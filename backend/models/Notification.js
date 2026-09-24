const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        complaint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            default: null
        },

        challenge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Challenge",
            default: null
        },

        proposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            default: null
        },

        collaboration: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collaboration",
            default: null
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: [
                "complaint",
                "challenge",
                "proposal",
                "collaboration",
                "success",
                "warning",
                "info"
            ],
            default: "info"
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);