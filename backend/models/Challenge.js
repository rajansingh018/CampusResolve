// =======================================================
// CampusResolve - Challenge Model
// Societal & Campus Challenges for University-Industry Collaboration
// =======================================================

const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Challenge title is required"],
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            required: [true, "Challenge description is required"],
            trim: true
        },

        category: {
            type: String,
            required: [true, "Challenge category is required"],
            trim: true,
            default: "Smart Campus"
        },

        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true
        },

        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: [true, "Associated college is required"]
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Creator is required"]
        },

        // Challenge Lifecycle Status
        status: {
            type: String,
            enum: [
                "Open",
                "Under Review",
                "University Validated",
                "Seeking Industry Partner",
                "Proposal Received",
                "Partner Selected",
                "In Progress",
                "Completed",
                "Rejected",
                "Cancelled"
            ],
            default: "Open"
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium"
        },

        // Required technical / research expertise (e.g. IoT, Clean Energy, AI)
        requiredExpertise: {
            type: [String],
            default: []
        },

        // Relevant industry domain (e.g. Energy & CleanTech, IT, Healthcare)
        requiredIndustryCategory: {
            type: String,
            trim: true,
            default: null
        },

        // Crowdsourced support / upvotes from students in the same college
        supports: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        supportCount: {
            type: Number,
            default: 0
        },

        // Optional student uploaded photo / document
        supportingImage: {
            type: String,
            default: null
        },

        // University Validation Notes
        validationNotes: {
            type: String,
            trim: true,
            default: ""
        },

        validatedAt: {
            type: Date,
            default: null
        },

        validatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Collaboration Parameters defined by University Admin
        collaborationRequirements: {
            expectedOutcome: { type: String, default: "" },
            timelineMonths: { type: Number, default: 3 },
            estimatedBudget: { type: String, default: "University / CSR Funded" },
            deliverables: { type: String, default: "" },
            requestedAt: { type: Date, default: null }
        },

        // Selected Partner & Proposal
        selectedProposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            default: null
        },

        selectedPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Final Solution details after completion
        finalSolution: {
            summary: { type: String, default: "" },
            implementationDetails: { type: String, default: "" },
            solutionImage: { type: String, default: null },
            completedAt: { type: Date, default: null }
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
            recordedAt: { type: Date, default: null }
        }
    },
    {
        timestamps: true
    }
);

// Indexes for optimal query performance
challengeSchema.index({ college: 1, status: 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ category: 1 });
challengeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Challenge", challengeSchema);
