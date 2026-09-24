// =======================================================
// CampusResolve - Department Staff Complaint Routes
// =======================================================

const express = require("express");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const Department = require("../models/Department");
const protect = require("../middleware/authMiddleware");
const staffOnly = require("../middleware/staffMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Multer memory storage for resolution image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed."));
        }
    }
});

function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "campusresolve/resolutions" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

/**
 * @route   GET /api/staff/complaints
 * @desc    Get all complaints assigned strictly to logged-in staff's department
 * @access  Protected (Department Staff)
 */
router.get("/complaints", protect, staffOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const departmentId = req.user.departmentId || req.user.department;

        const complaints = await Complaint.find({
            college: collegeId,
            department: departmentId
        })
            .populate("student", "name email studentId")
            .populate("department", "name")
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        console.error("Staff complaints fetch error:", error);
        res.status(500).json({ message: "Unable to fetch department complaints." });
    }
});

/**
 * @route   GET /api/staff/complaints/:id
 * @desc    Get single complaint detail for department staff
 * @access  Protected (Department Staff)
 */
router.get("/complaints/:id", protect, staffOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const departmentId = req.user.departmentId || req.user.department;

        const complaint = await Complaint.findOne({
            _id: req.params.id,
            college: collegeId,
            department: departmentId
        })
            .populate("student", "name email studentId")
            .populate("department", "name");

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found in your department." });
        }

        res.json(complaint);
    } catch (error) {
        console.error("Staff single complaint error:", error);
        res.status(500).json({ message: "Unable to fetch complaint details." });
    }
});

/**
 * @route   PATCH /api/staff/complaints/:id/status
 * @desc    Update complaint status, add staff remarks, upload resolution proof
 * @access  Protected (Department Staff)
 */
router.patch("/complaints/:id/status", protect, staffOnly, upload.single("resolutionImage"), async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const departmentId = req.user.departmentId || req.user.department;
        const staffUserId = req.user.userId || req.user._id;

        const { status, remarks } = req.body;
        const allowedStatuses = ["Under Review", "In Progress", "Resolved", "Rejected"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid complaint status." });
        }

        const complaint = await Complaint.findOne({
            _id: req.params.id,
            college: collegeId,
            department: departmentId
        });

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found or not assigned to your department." });
        }

        // Marking as resolved requires resolution proof photo
        if (status === "Resolved" && !req.file && !complaint.resolutionImage) {
            return res.status(400).json({
                message: "A resolution photo is required to mark the complaint as resolved."
            });
        }

        // Upload resolution photo if provided
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer);
            complaint.resolutionImage = imageUrl;
        }

        // Update status and assigned staff
        complaint.status = status;
        complaint.assignedStaff = staffUserId;

        // Custom or default status update message
        let statusMessage = remarks && remarks.trim()
            ? remarks.trim()
            : `Complaint marked as ${status} by department staff.`;

        if (status === "Under Review" && (!remarks || !remarks.trim())) {
            statusMessage = "Your complaint has been accepted and is currently under review by the department.";
        } else if (status === "In Progress" && (!remarks || !remarks.trim())) {
            statusMessage = "Work has started on resolving your complaint.";
        } else if (status === "Resolved" && (!remarks || !remarks.trim())) {
            statusMessage = "Your complaint has been resolved with proof photo attached.";
        } else if (status === "Rejected" && (!remarks || !remarks.trim())) {
            statusMessage = "Your complaint could not be processed.";
        }

        if (!complaint.statusHistory) {
            complaint.statusHistory = [];
        }

        complaint.statusHistory.push({
            status,
            message: statusMessage,
            updatedAt: new Date()
        });

        await complaint.save();

        // Notify student of the status change / resolution
        try {
            await Notification.create({
                user: complaint.student,
                complaint: complaint._id,
                title: `Complaint ${status}`,
                message: statusMessage,
                type: status === "Resolved" ? "success" : status === "Rejected" ? "warning" : "info"
            });
        } catch (notifErr) {
            console.error("Failed to create student notification from staff action:", notifErr.message);
        }

        await complaint.populate("student", "name email studentId");
        await complaint.populate("department", "name");

        res.json({
            message: "Complaint updated successfully.",
            complaint
        });

    } catch (error) {
        console.error("Staff status update error:", error);
        res.status(500).json({ message: error.message || "Failed to update complaint status." });
    }
});

module.exports = router;
