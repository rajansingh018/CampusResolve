const express = require("express");

const Notification =
    require("../models/Notification");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();


// =====================================
// GET MY NOTIFICATIONS
// =====================================

router.get(
    "/",
    protect,

    async (req, res) => {

        try {

            const userId = req.user.userId || req.user._id;

            const notifications =
                await Notification.find({
                    user: userId
                })
                    .populate(
                        "complaint",
                        "title status"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .limit(50);


            res.json(
                notifications
            );


        } catch (error) {

            console.error(
                "Notification fetch error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to fetch notifications."

            });

        }

    }
);


// =====================================
// MARK ONE AS READ
// =====================================

router.patch(
    "/:id/read",
    protect,

    async (req, res) => {

        try {

            const userId = req.user.userId || req.user._id;

            const notification =
                await Notification.findOneAndUpdate(

                    {
                        _id:
                            req.params.id,

                        user:
                            userId
                    },

                    {
                        isRead:
                            true
                    },

                    {
                        new:
                            true
                    }

                );


            if (!notification) {

                return res.status(404).json({

                    message:
                        "Notification not found."

                });

            }


            res.json(
                notification
            );


        } catch (error) {

            console.error(
                "Mark notification read error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to update notification."

            });

        }

    }
);


// =====================================
// MARK ALL AS READ
// =====================================

router.patch(
    "/read-all",
    protect,

    async (req, res) => {

        try {

            const userId = req.user.userId || req.user._id;

            await Notification.updateMany(

                {
                    user:
                        userId,

                    isRead:
                        false
                },

                {
                    isRead:
                        true
                }

            );


            res.json({

                message:
                    "All notifications marked as read."

            });


        } catch (error) {

            console.error(
                "Mark all notifications read error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to update notifications."

            });

        }

    }
);


module.exports =
    router;