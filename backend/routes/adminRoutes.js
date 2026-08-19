const express = require("express");

const Complaint =
    require("../models/Complaint");

const protect =
    require("../middleware/authMiddleware");

const adminOnly =
    require("../middleware/adminMiddleware");

const cloudinary =
    require("../config/cloudinary");

const multer =
    require("multer");
    

const router = express.Router();


// =====================================
// MULTER
// =====================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (
            file.mimetype.startsWith("image/")
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

function uploadToCloudinary(buffer) {

    return new Promise(
        (resolve, reject) => {

            const stream =
                cloudinary.uploader.upload_stream(

                    {
                        folder:
                            "campusresolve/resolutions"
                    },

                    (error, result) => {

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
// GET COLLEGE COMPLAINTS
// =====================================

router.get(
    "/complaints",
    protect,
    adminOnly,
    async (req, res) => {

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
                .sort({
                    createdAt: -1
                });


            res.json(
                complaints
            );


        } catch (error) {

            console.error(error);

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
    "/complaints/:id/status",
    protect,
    adminOnly,
    upload.single("resolutionImage"),

    async (req, res) => {

        try {

            const status =
                req.body.status;


            const allowedStatuses = [

                "Reported",
                "Under Review",
                "In Progress",
                "Resolved",
                "Rejected"

            ];


            // ---------------------------------
            // Validate status
            // ---------------------------------

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid complaint status."

                });

            }


            // ---------------------------------
            // Find complaint
            // ---------------------------------

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


            // ---------------------------------
            // Resolution photo required
            // ---------------------------------

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


            // ---------------------------------
            // Upload resolution image
            // ---------------------------------

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


            // ---------------------------------
            // Update status
            // ---------------------------------

            complaint.status =
                status;


            await complaint.save();


            // ---------------------------------
            // Response
            // ---------------------------------

            res.json({

                message:
                    "Complaint updated successfully.",

                complaint

            });


        } catch (error) {

            console.error(
                "Admin complaint update error:",
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


module.exports = router;