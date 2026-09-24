// =======================================================
// CampusResolve - Proposal Model
// Industry Proposals for Validated University Challenges
// =======================================================

const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
    {
        challenge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Challenge",
            required: [true, "Target challenge is required"]
        },

        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: [true, "College is required"]
        },

        industryUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Industry partner is required"]
        },

        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },

        contactEmail: {
            type: String,
            trim: true,
            default: ""
        },

        contactPhone: {
            type: String,
            trim: true,
            default: ""
        },

        // Core proposal content
        proposedSolution: {
            type: String,
            required: [true, "Proposed solution is required"],
            trim: true
        },

        implementationApproach: {
            type: String,
            required: [true, "Implementation approach is required"],
            trim: true
        },

        requiredResources: {
            type: String,
            trim: true,
            default: ""
        },

        estimatedTimeline: {
            type: String,
            required: [true, "Estimated timeline is required"],
            trim: true
        },

        expectedImpact: {
            type: String,
            required: [true, "Expected impact is required"],
            trim: true
        },

        estimatedCost: {
            type: String,
            trim: true,
            default: "CSR / University Supported"
        },

        supportingDocument: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "Submitted",
                "Under Review",
                "Accepted",
                "Rejected",
                "Withdrawn"
            ],
            default: "Submitted"
        },

        adminFeedback: {
            type: String,
            trim: true,
            default: ""
        },

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
proposalSchema.index({ challenge: 1, industryUser: 1 });
proposalSchema.index({ college: 1, status: 1 });
proposalSchema.index({ industryUser: 1, createdAt: -1 });

module.exports = mongoose.model("Proposal", proposalSchema);
