const express = require("express");

const Complaint =
    require("../models/Complaint");

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
            // Save
            // =================================

            await complaint.save();

            // =================================
            // Create Student Notification
            // =================================

            await Notification.create({

                user: complaint.student,

                complaint: complaint._id,

                title: `Complaint ${status}`,

                message: message,

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


module.exports =
    router;