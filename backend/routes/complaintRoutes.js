const express = require("express");

const Complaint = require("../models/Complaint");

const protect =
    require("../middleware/authMiddleware");


const cloudinary =
    require("../config/cloudinary");

const upload =
    require("../middleware/uploadMiddleware");
const router = express.Router();


// =====================================
// CREATE COMPLAINT
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
                category,
                location,
                priority
            } = req.body;


            if (
                !title ||
                !description ||
                !category ||
                !location
            ) {

                return res.status(400).json({
                    message:
                        "Please fill all required fields."
                });

            }


            let problemImage = null;


            // Upload image to Cloudinary

            if (req.file) {

                const result =
                    await new Promise(
                        (resolve, reject) => {

                            const stream =
                                cloudinary.uploader.upload_stream(
                                    {
                                        folder:
                                            "campusresolve/problems"
                                    },

                                    (error, result) => {

                                        if (error) {

                                            reject(error);

                                        } else {

                                            resolve(result);

                                        }

                                    }
                                );


                            stream.end(
                                req.file.buffer
                            );

                        }
                    );


                problemImage =
                    result.secure_url;

            }


            // Create complaint

            const complaint =
    await Complaint.create({

        title,

        description,

        category,

        location,

        priority:
            priority || "Medium",

        student:
            req.user.userId,

        college:
            req.user.collegeId,

        problemImage,

        // =================================
        // Initial Status History
        // =================================

        statusHistory: [

            {
                status:
                    "Reported",

                message:
                    "Complaint reported successfully.",

                updatedAt:
                    new Date()
            }

        ]

    });


            res.status(201).json({

                message:
                    "Issue reported successfully.",

                complaint

            });


        } catch (error) {

            console.error(
                "Complaint creation error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to create complaint."
            });

        }

    }
);


// =====================================
// GET MY COMPLAINTS
// =====================================

router.get(
    "/my",
    protect,
    async (req, res) => {

        try {

            const complaints =
                await Complaint.find({

                    student:
                        req.user.userId,

                    college:
                        req.user.collegeId

                })
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


module.exports = router;