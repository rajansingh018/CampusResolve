const express = require("express");

const Complaint =
    require("../models/Complaint");

const Department =
    require("../models/Department");

const User =
    require("../models/User");

const protect =
    require("../middleware/authMiddleware");

const adminOnly =
    require("../middleware/adminMiddleware");

const multer =
    require("multer");

const cloudinary =
    require("../config/cloudinary");

const router =
    express.Router();

const Notification =
    require("../models/Notification");


// =====================================
// MULTER
// =====================================

const upload = multer({

    storage:
        multer.memoryStorage(),

    limits: {
        fileSize:
            5 * 1024 * 1024
    },

    fileFilter:
        (req, file, cb) => {

            if (
                file.mimetype.startsWith(
                    "image/"
                )
            ) {

                cb(null, true);

            } else {

                cb(
                    new Error(
                        "Only image files are allowed."
                    )
                );

            }

        }

});


// =====================================
// CLOUDINARY UPLOAD
// =====================================

function uploadToCloudinary(
    buffer
) {

    return new Promise(
        (resolve, reject) => {

            const stream =
                cloudinary.uploader.upload_stream(

                    {
                        folder:
                            "campusresolve/resolutions"
                    },

                    (
                        error,
                        result
                    ) => {

                        if (error) {

                            reject(error);

                        } else {

                            resolve(
                                result.secure_url
                            );

                        }

                    }

                );


            stream.end(buffer);

        }
    );

}


// =====================================
// GET ALL COMPLAINTS
// =====================================

router.get(
    "/",
    protect,
    adminOnly,

    async (
        req,
        res
    ) => {

        try {

            const complaints =
                await Complaint.find({

                    college:
                        req.user.collegeId

                })

                    .populate(
                        "student",
                        "name email studentId"
                    )

                    .populate(
                        "department",
                        "name"
                    )

                    .populate(
                        "assignedStaff",
                        "name email"
                    )

                    .populate(
                        "college",
                        "name shortName logo"
                    )

                    .sort({
                        createdAt: -1
                    });


            res.json(
                complaints
            );


        } catch (error) {

            console.error(
                "Admin complaints error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to fetch complaints."

            });

        }

    }
);


// =====================================
// UPDATE COMPLAINT STATUS
// =====================================

router.patch(
    "/:id/status",

    protect,

    adminOnly,

    upload.single("resolutionImage"),

    async (req, res) => {

        try {

            // =================================
            // Get status
            // =================================

            const status =
                req.body?.status;


            // =================================
            // Allowed statuses
            // =================================

            const allowedStatuses = [

                "Reported",

                "Under Review",

                "In Progress",

                "Resolved",

                "Rejected"

            ];


            // =================================
            // Validate status
            // =================================

            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({

                    message:
                        "Invalid complaint status."

                });

            }


            // =================================
            // Find complaint
            // =================================

            const complaint =
                await Complaint.findOne({

                    _id:
                        req.params.id,

                    college:
                        req.user.collegeId

                });


            if (!complaint) {

                return res.status(404).json({

                    message:
                        "Complaint not found."

                });

            }


            // =================================
            // Resolution photo required
            // =================================

            if (
                status === "Resolved" &&
                !req.file &&
                !complaint.resolutionImage
            ) {

                return res.status(400).json({

                    message:
                        "Please upload a resolution photo before marking the complaint as resolved."

                });

            }


            // =================================
            // Upload resolution photo
            // =================================

            if (
                status === "Resolved" &&
                req.file
            ) {

                const imageUrl =
                    await uploadToCloudinary(
                        req.file.buffer
                    );


                complaint.resolutionImage =
                    imageUrl;

            }


            // =================================
            // Update status
            // =================================

            complaint.status =
                status;


            // =================================
            // Notification message
            // =================================

            let message =
                "Complaint status updated.";


            if (
                status === "Under Review"
            ) {

                message =
                    "Your complaint is now under review.";

            }


            else if (
                status === "In Progress"
            ) {

                message =
                    "Work has started on your complaint.";

            }


            else if (
                status === "Resolved"
            ) {

                message =
                    "Your complaint has been resolved.";

            }


            else if (
                status === "Rejected"
            ) {

                message =
                    "Your complaint has been rejected.";

            }


            // =================================
            // Status History
            // =================================

            if (
                !complaint.statusHistory
            ) {

                complaint.statusHistory = [];

            }


            complaint.statusHistory.push({

                status:
                    status,

                message:
                    message,

                updatedAt:
                    new Date()

            });


            // =================================
            // Save Complaint
            // =================================

            await complaint.save();


            // =================================
            // CREATE STUDENT NOTIFICATION
            // =================================
            // Complaint notifications are
            // always enabled.
            // =================================

            await Notification.create({

                user:
                    complaint.student,

                complaint:
                    complaint._id,

                title:
                    `Complaint ${status}`,

                message:
                    message,

                type:
                    status === "Resolved"
                        ? "success"
                        : status === "Rejected"
                            ? "warning"
                            : "info"

            });


            // =================================
            // Populate student
            // =================================

            await complaint.populate(
                "student",
                "name email studentId"
            );


            // =================================
            // Response
            // =================================

            res.json({

                message:
                    "Complaint updated successfully.",

                complaint

            });


        } catch (error) {

            console.error(
                "Status update error:",
                error
            );


            res.status(500).json({

                message:
                    error.message ||
                    "Unable to update complaint."

            });

        }

    }
);


// =====================================
// MANUALLY ASSIGN / REASSIGN DEPARTMENT
// =====================================

router.patch(
    "/:id/assign",
    protect,
    adminOnly,
    async (req, res) => {
        try {
            const { departmentId, assignedStaffId } = req.body;

            if (!departmentId) {
                return res.status(400).json({
                    message: "Department ID is required for assignment."
                });
            }

            const department = await Department.findOne({
                _id: departmentId,
                college: req.user.collegeId
            });

            if (!department) {
                return res.status(404).json({
                    message: "Department not found in your college."
                });
            }

            const complaint = await Complaint.findOne({
                _id: req.params.id,
                college: req.user.collegeId
            });

            if (!complaint) {
                return res.status(404).json({
                    message: "Complaint not found."
                });
            }

            // Assign department and clear manual routing flag
            complaint.department = department._id;
            complaint.category = department.name;
            complaint.requiresManualAssignment = false;

            // Optional staff assignment
            if (assignedStaffId) {
                const staff = await User.findOne({
                    _id: assignedStaffId,
                    department: department._id,
                    college: req.user.collegeId,
                    role: "department_staff"
                });
                if (staff) {
                    complaint.assignedStaff = staff._id;
                }
            }

            if (!complaint.statusHistory) {
                complaint.statusHistory = [];
            }

            complaint.statusHistory.push({
                status: complaint.status,
                message: `Assigned to ${department.name} by campus administration.`,
                updatedAt: new Date()
            });

            await complaint.save();

            // Notify department staff
            try {
                const deptStaff = await User.find({
                    role: "department_staff",
                    department: department._id,
                    college: req.user.collegeId
                });

                for (const staff of deptStaff) {
                    await Notification.create({
                        user: staff._id,
                        complaint: complaint._id,
                        title: `Complaint Assigned to ${department.name}`,
                        message: `Complaint "${complaint.title}" has been assigned to your department by admin.`,
                        type: "complaint"
                    });
                }
            } catch (notifErr) {
                console.error("Failed to notify staff of manual assignment:", notifErr.message);
            }

            await complaint.populate("student", "name email studentId");
            await complaint.populate("department", "name");
            await complaint.populate("assignedStaff", "name email");

            res.json({
                message: `Complaint assigned to ${department.name} successfully.`,
                complaint
            });

        } catch (error) {
            console.error("Admin assignment error:", error);
            res.status(500).json({
                message: error.message || "Failed to assign complaint department."
            });
        }
    }
);


// =====================================
// MANUALLY CHANGE PRIORITY
// =====================================

router.patch(
    "/:id/priority",
    protect,
    adminOnly,
    async (req, res) => {
        try {
            const { priority } = req.body;
            const validPriorities = ["Low", "Medium", "High", "Critical"];

            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    message: "Invalid priority level."
                });
            }

            const complaint = await Complaint.findOne({
                _id: req.params.id,
                college: req.user.collegeId
            });

            if (!complaint) {
                return res.status(404).json({
                    message: "Complaint not found."
                });
            }

            const oldPriority = complaint.priority;
            complaint.priority = priority;

            if (!complaint.statusHistory) {
                complaint.statusHistory = [];
            }

            complaint.statusHistory.push({
                status: complaint.status,
                message: `Priority changed from ${oldPriority} to ${priority} by administrator.`,
                updatedAt: new Date()
            });

            await complaint.save();

            await complaint.populate("student", "name email studentId");
            await complaint.populate("department", "name");
            await complaint.populate("assignedStaff", "name email");

            res.json({
                message: `Priority updated to ${priority} successfully.`,
                complaint
            });

        } catch (error) {
            console.error("Admin priority update error:", error);
            res.status(500).json({
                message: error.message || "Failed to update priority."
            });
        }
    }
);


module.exports =
    router;