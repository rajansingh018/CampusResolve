// =======================================================
// CampusResolve - Student Complaint Routes
// =======================================================

const express = require("express");
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/uploadMiddleware");
const { analyzeComplaint } = require("../services/complaintAIService");

const router = express.Router();

// =====================================
// CREATE COMPLAINT (AI Auto-Routing)
// =====================================
router.post(
    "/",
    protect,
    upload.single("problemImage"),
    async (req, res) => {
        try {
            const {
                title,
                description,
                location
            } = req.body;

            // Validate mandatory student inputs
            if (!title || !description || !location) {
                return res.status(400).json({
                    message: "Title, description, and location are required."
                });
            }

            const studentId = req.user.userId || req.user._id;
            const collegeId = req.user.collegeId || req.user.college;

            let problemImage = null;

            // Upload image to Cloudinary if provided
            if (req.file) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "campusresolve/problems" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(req.file.buffer);
                });

                problemImage = result.secure_url;
            }

            // 1. Fetch active departments for the college
            const activeDepartments = await Department.find({
                college: collegeId,
                isActive: true
            });

            // 2. Invoke AI Complaint Agent for automated triage
            const aiResult = await analyzeComplaint({
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                availableDepartments: activeDepartments
            });

            console.log(`[AI Triage] Complaint "${title}" analyzed:`, {
                issueType: aiResult.issueType,
                priority: aiResult.priority,
                department: aiResult.department,
                confidence: aiResult.confidence
            });

            // 3. Match AI result against active MongoDB departments
            let matchedDepartment = null;
            if (aiResult.department) {
                matchedDepartment = activeDepartments.find(
                    (d) => d.name.toLowerCase().trim() === aiResult.department.toLowerCase().trim()
                );
            }

            // High enough confidence and valid department match
            const isConfidenceAcceptable = aiResult.confidence >= 0.6;
            const isAssigned = Boolean(matchedDepartment && isConfidenceAcceptable);

            const departmentId = isAssigned ? matchedDepartment._id : null;
            const categoryName = isAssigned ? matchedDepartment.name : "Other";
            const requiresManualAssignment = !isAssigned;

            // 4. Save complaint to MongoDB
            const complaint = await Complaint.create({
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                category: categoryName,
                department: departmentId,
                issueType: aiResult.issueType || "General Complaint",
                aiPriority: aiResult.priority || "Medium",
                priority: aiResult.priority || "Medium",
                aiSummary: aiResult.summary || "",
                aiReason: aiResult.reason || "",
                aiConfidence: aiResult.confidence || 0,
                requiresManualAssignment: requiresManualAssignment,
                student: studentId,
                college: collegeId,
                problemImage,
                status: "Reported",
                statusHistory: [
                    {
                        status: "Reported",
                        message: isAssigned
                            ? `Complaint reported and auto-assigned to ${matchedDepartment.name} by AI.`
                            : "Complaint reported and queued for department assignment.",
                        updatedAt: new Date()
                    }
                ]
            });

            // 5. Notifications
            if (isAssigned) {
                // Notify all staff members belonging to this department
                try {
                    const deptStaff = await User.find({
                        role: "department_staff",
                        department: matchedDepartment._id,
                        college: collegeId
                    });

                    for (const staff of deptStaff) {
                        await Notification.create({
                            user: staff._id,
                            complaint: complaint._id,
                            title: `New ${complaint.priority} Priority Complaint`,
                            message: `New issue "${complaint.title}" has been assigned to ${matchedDepartment.name} at ${complaint.location}.`,
                            type: "complaint"
                        });
                    }
                } catch (notifErr) {
                    console.error("Failed to notify department staff:", notifErr.message);
                }
            } else {
                // Low confidence or unmatched: Notify college admin for manual assignment
                try {
                    const admins = await User.find({
                        role: "admin",
                        college: collegeId
                    });

                    for (const admin of admins) {
                        await Notification.create({
                            user: admin._id,
                            complaint: complaint._id,
                            title: "Complaint Routing Required ⚠️",
                            message: `AI confidence was ${Math.round(aiResult.confidence * 100)}% for "${complaint.title}". Please assign a department manually.`,
                            type: "warning"
                        });
                    }
                } catch (notifErr) {
                    console.error("Failed to notify admin of unassigned complaint:", notifErr.message);
                }
            }

            // Populate department details for response
            await complaint.populate("department", "name");

            res.status(201).json({
                message: isAssigned
                    ? `Issue reported successfully and assigned to ${matchedDepartment.name}! 🎉`
                    : "Issue reported successfully and queued for review. 🎉",
                complaint
            });

        } catch (error) {
            console.error("Complaint creation error:", error);
            res.status(500).json({
                message: error.message || "Unable to create complaint."
            });
        }
    }
);

// =====================================
// GET MY COMPLAINTS (Student's private list)
// =====================================
router.get(
    "/my",
    protect,
    async (req, res) => {
        try {
            const userId = req.user.userId || req.user._id;
            const collegeId = req.user.collegeId || req.user.college;

            const complaints = await Complaint.find({
                student: userId,
                college: collegeId
            })
                .populate("department", "name")
                .populate("assignedStaff", "name")
                .sort({
                    createdAt: -1
                });

            res.json(complaints);
        } catch (error) {
            console.error("My complaints fetch error:", error);
            res.status(500).json({
                message: "Unable to fetch complaints."
            });
        }
    }
);

module.exports = router;