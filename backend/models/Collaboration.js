// =======================================================
// CampusResolve - Collaboration Model
// Tracks Joint University-Industry Problem Solving & Implementation
// =======================================================

const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema(
    {
        challenge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Challenge",
            required: [true, "Associated challenge is required"],
            unique: true
        },

        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: [true, "College is required"]
        },

        adminUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Admin / University Lead is required"]
        },

        industryUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Industry partner is required"]
        },

        proposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            required: [true, "Accepted proposal is required"]
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Partner Selected",
                "Planning",
                "In Progress",
                "Pilot",
                "Completed",
                "Cancelled"
            ],
            default: "Partner Selected"
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        targetCompletionDate: {
            type: Date,
            default: null
        },

        actualCompletionDate: {
            type: Date,
            default: null
        },

        // Detailed progress log with public vs internal separation
        progressUpdates: [
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
                percentage: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                },
                isPublic: {
                    type: Boolean,
                    default: true
                },
                postedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                postedByRole: {
                    type: String,
                    enum: ["admin", "industry"]
                },
                images: [String],
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        // Final Deliverables & Solution Report
        finalSolution: {
            summary: { type: String, default: "" },
            implementationDetails: { type: String, default: "" },
            solutionImage: { type: String, default: null },
            submittedAt: { type: Date, default: null }
        },

        // Measurable SIH Impact
        impact: {
            studentsBenefited: { type: Number, default: 0 },
            energySaved: { type: String, default: "" },
            waterSaved: { type: String, default: "" },
            wasteReduced: { type: String, default: "" },
            costSavings: { type: String, default: "" },
            timeSaved: { type: String, default: "" },
            infrastructureImprovement: { type: String, default: "" },
            customMetrics: [
                {
                    label: { type: String, trim: true },
                    value: { type: String, trim: true }
                }
            ],
            recordedAt: { type: Date, default: null }
        }
    },
    {
        timestamps: true
    }
);

// Indexes
collaborationSchema.index({ college: 1, status: 1 });
collaborationSchema.index({ industryUser: 1 });

module.exports = mongoose.model("Collaboration", collaborationSchema);
