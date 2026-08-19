const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Infrastructure",
                "Wi-Fi & IT",
                "Hostel",
                "Mess",
                "Transport",
                "Academics",
                "Safety",
                "Cleanliness",
                "Other"
            ]
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Reported",
                "Under Review",
                "In Progress",
                "Resolved",
                "Rejected"
            ],
            default: "Reported"
        },

        priority: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High",
                "Critical"
            ],
            default: "Medium"
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true
        },

        // Student uploaded problem photo
        problemImage: {
            type: String,
            default: null
        },

        // Admin uploaded resolution proof photo
        resolutionImage: {
            type: String,
            default: null
        },
        // =====================================
        // Escalation
        // =====================================

        escalationLevel: {
            type: Number,
            default: 0
        },

        isEscalated: {
            type: Boolean,
            default: false
        },

        escalatedAt: {
            type: Date,
            default: null
        },
        // =====================================
        // Status History
        // =====================================

        statusHistory: [
            {
                status: {
                    type: String,
                    enum: [
                        "Reported",
                        "Under Review",
                        "In Progress",
                        "Resolved",
                        "Rejected"
                    ]
                },

                message: {
                    type: String
                },

                updatedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },


    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Complaint",
    complaintSchema
);