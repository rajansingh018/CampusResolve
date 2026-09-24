// =======================================================
// CampusResolve - Admin Challenge & Collaboration Routes
// University Validation, Partner Selection, & Impact Tracking
// =======================================================

const express = require("express");
const Challenge = require("../models/Challenge");
const Proposal = require("../models/Proposal");
const Collaboration = require("../models/Collaboration");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

function uploadToCloudinary(buffer, folder = "campusresolve/solutions") {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

/**
 * @route   GET /api/admin/challenges
 * @desc    Get all challenges for authenticated admin's college
 * @access  Protected (Admin only)
 */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;

        const challenges = await Challenge.find({ college: collegeId })
            .populate("createdBy", "name email studentId")
            .populate("selectedPartner", "name companyName industryCategory website")
            .sort({ createdAt: -1 });

        // Augment with proposal count and collaboration summary
        const challengesWithStats = await Promise.all(
            challenges.map(async (ch) => {
                const proposalCount = await Proposal.countDocuments({ challenge: ch._id });
                const collaboration = await Collaboration.findOne({ challenge: ch._id })
                    .select("status startDate targetCompletionDate impact");

                return {
                    ...ch.toObject(),
                    proposalCount,
                    collaboration
                };
            })
        );

        res.json(challengesWithStats);
    } catch (error) {
        console.error("Admin fetch challenges error:", error);
        res.status(500).json({ message: "Unable to load campus challenges." });
    }
});

/**
 * @route   GET /api/admin/challenges/:id
 * @desc    Get single challenge detail for admin
 * @access  Protected (Admin only)
 */
router.get("/:id", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;

        const challenge = await Challenge.findOne({
            _id: req.params.id,
            college: collegeId
        })
            .populate("createdBy", "name email studentId")
            .populate("selectedPartner", "name companyName industryCategory website description");

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found in your college." });
        }

        const proposals = await Proposal.find({ challenge: challenge._id })
            .populate("industryUser", "name email companyName industryCategory expertise website phone description")
            .sort({ createdAt: -1 });

        const collaboration = await Collaboration.findOne({ challenge: challenge._id })
            .populate("industryUser", "name companyName industryCategory website");

        res.json({
            challenge,
            proposals,
            collaboration
        });
    } catch (error) {
        console.error("Admin single challenge error:", error);
        res.status(500).json({ message: "Unable to load challenge details." });
    }
});

/**
 * @route   PATCH /api/admin/challenges/:id/validate
 * @desc    Validate a student challenge as a genuine campus/societal problem
 * @access  Protected (Admin only)
 */
router.patch("/:id/validate", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const adminId = req.user.userId || req.user._id;
        const { validationNotes, priority } = req.body;

        const challenge = await Challenge.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found." });
        }

        challenge.status = "University Validated";
        challenge.validationNotes = (validationNotes || "Validated by campus administration.").trim();
        challenge.validatedAt = new Date();
        challenge.validatedBy = adminId;
        if (priority && ["Low", "Medium", "High", "Critical"].includes(priority)) {
            challenge.priority = priority;
        }

        await challenge.save();

        // Notify student creator
        try {
            await Notification.create({
                user: challenge.createdBy,
                challenge: challenge._id,
                title: "Challenge Validated! 🎓",
                message: `Your challenge "${challenge.title}" has been reviewed and validated by university authorities.`,
                type: "success"
            });
        } catch (notifErr) {
            console.error("Student notification error:", notifErr.message);
        }

        res.json({
            message: "Challenge validated successfully. You can now request industry collaboration.",
            challenge
        });
    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({ message: error.message || "Failed to validate challenge." });
    }
});

/**
 * @route   PATCH /api/admin/challenges/:id/reject
 * @desc    Reject a challenge
 * @access  Protected (Admin only)
 */
router.patch("/:id/reject", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const { reason } = req.body;

        const challenge = await Challenge.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found." });
        }

        challenge.status = "Rejected";
        challenge.validationNotes = (reason || "Does not meet university challenge criteria.").trim();
        await challenge.save();

        // Notify student creator
        try {
            await Notification.create({
                user: challenge.createdBy,
                challenge: challenge._id,
                title: "Challenge Update",
                message: `Your challenge "${challenge.title}" could not be validated: ${challenge.validationNotes}`,
                type: "warning"
            });
        } catch (notifErr) {
            console.error("Student notification error:", notifErr.message);
        }

        res.json({
            message: "Challenge marked as rejected.",
            challenge
        });
    } catch (error) {
        console.error("Reject challenge error:", error);
        res.status(500).json({ message: "Failed to update challenge." });
    }
});

/**
 * @route   PATCH /api/admin/challenges/:id/request-collaboration
 * @desc    Publish challenge to industry partners (Seeking Industry Partner)
 * @access  Protected (Admin only)
 */
router.patch("/:id/request-collaboration", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const {
            requiredIndustryCategory,
            requiredExpertise,
            expectedOutcome,
            timelineMonths,
            estimatedBudget,
            deliverables
        } = req.body;

        const challenge = await Challenge.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found." });
        }

        let expertiseArr = [];
        if (Array.isArray(requiredExpertise)) {
            expertiseArr = requiredExpertise.map(e => String(e).trim()).filter(Boolean);
        } else if (typeof requiredExpertise === "string" && requiredExpertise.trim()) {
            expertiseArr = requiredExpertise.split(",").map(e => e.trim()).filter(Boolean);
        }

        challenge.status = "Seeking Industry Partner";
        if (requiredIndustryCategory) challenge.requiredIndustryCategory = requiredIndustryCategory.trim();
        if (expertiseArr.length > 0) challenge.requiredExpertise = expertiseArr;

        challenge.collaborationRequirements = {
            expectedOutcome: (expectedOutcome || "").trim(),
            timelineMonths: Number(timelineMonths) || 3,
            estimatedBudget: (estimatedBudget || "University / CSR Supported").trim(),
            deliverables: (deliverables || "").trim(),
            requestedAt: new Date()
        };

        await challenge.save();

        // Notify student creator
        try {
            await Notification.create({
                user: challenge.createdBy,
                challenge: challenge._id,
                title: "Seeking Industry Collaboration 🤝",
                message: `Your challenge "${challenge.title}" is now open for industry solution proposals!`,
                type: "info"
            });
        } catch (notifErr) {
            console.error("Student notification error:", notifErr.message);
        }

        res.json({
            message: "Challenge published for industry collaboration! Industry partners can now submit proposals. 🚀",
            challenge
        });
    } catch (error) {
        console.error("Request collaboration error:", error);
        res.status(500).json({ message: error.message || "Failed to publish challenge for collaboration." });
    }
});

/**
 * @route   GET /api/admin/challenges/:id/proposals
 * @desc    Get all proposals for a challenge
 * @access  Protected (Admin only)
 */
router.get("/:id/proposals", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;

        const challenge = await Challenge.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found." });
        }

        const proposals = await Proposal.find({ challenge: challenge._id })
            .populate("industryUser", "name email companyName industryCategory expertise website phone description")
            .sort({ createdAt: -1 });

        res.json(proposals);
    } catch (error) {
        console.error("Fetch proposals error:", error);
        res.status(500).json({ message: "Unable to load proposals." });
    }
});

/**
 * @route   PATCH /api/admin/proposals/:proposalId/accept
 * @desc    Accept an industry proposal and initiate collaboration
 * @access  Protected (Admin only)
 */
router.patch("/proposals/:proposalId/accept", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const adminId = req.user.userId || req.user._id;

        const proposal = await Proposal.findOne({
            _id: req.params.proposalId,
            college: collegeId
        }).populate("industryUser", "name email companyName");

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found." });
        }

        const challenge = await Challenge.findOne({
            _id: proposal.challenge,
            college: collegeId
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found." });
        }

        // Accept this proposal
        proposal.status = "Accepted";
        proposal.reviewedAt = new Date();
        await proposal.save();

        // Reject other proposals for this challenge
        await Proposal.updateMany(
            {
                challenge: challenge._id,
                _id: { $ne: proposal._id },
                status: { $ne: "Accepted" }
            },
            {
                status: "Rejected",
                adminFeedback: "Another industry proposal was selected for this project cycle.",
                reviewedAt: new Date()
            }
        );

        // Update challenge state
        challenge.status = "Partner Selected";
        challenge.selectedProposal = proposal._id;
        challenge.selectedPartner = proposal.industryUser._id;
        await challenge.save();

        // Create or update Collaboration project
        let collaboration = await Collaboration.findOne({ challenge: challenge._id });
        if (!collaboration) {
            collaboration = await Collaboration.create({
                challenge: challenge._id,
                college: collegeId,
                adminUser: adminId,
                industryUser: proposal.industryUser._id,
                proposal: proposal._id,
                title: `${challenge.title} — ${proposal.companyName} Partnership`,
                status: "Partner Selected",
                startDate: new Date(),
                progressUpdates: [
                    {
                        title: "Partner Selected & Project Initialized",
                        description: `University selected ${proposal.companyName} as the implementation partner based on proposed approach.`,
                        percentage: 5,
                        isPublic: true,
                        postedBy: adminId,
                        postedByRole: "admin",
                        createdAt: new Date()
                    }
                ]
            });
        } else {
            collaboration.industryUser = proposal.industryUser._id;
            collaboration.proposal = proposal._id;
            collaboration.status = "Partner Selected";
            await collaboration.save();
        }

        // 1. Notify Industry Partner
        try {
            await Notification.create({
                user: proposal.industryUser._id,
                challenge: challenge._id,
                proposal: proposal._id,
                collaboration: collaboration._id,
                title: "Proposal Accepted! 🎉",
                message: `Congratulations! Your proposal for "${challenge.title}" was accepted by the university.`,
                type: "success"
            });
        } catch (notifErr) {
            console.error("Industry notification error:", notifErr.message);
        }

        // 2. Notify Student Creator
        try {
            await Notification.create({
                user: challenge.createdBy,
                challenge: challenge._id,
                collaboration: collaboration._id,
                title: "Industry Partner Selected! 🤝",
                message: `${proposal.companyName} has been selected to solve "${challenge.title}".`,
                type: "success"
            });
        } catch (notifErr) {
            console.error("Student notification error:", notifErr.message);
        }

        res.json({
            message: `Proposal accepted! Collaboration project started with ${proposal.companyName}. 🎉`,
            proposal,
            collaboration,
            challenge
        });

    } catch (error) {
        console.error("Accept proposal error:", error);
        res.status(500).json({ message: error.message || "Failed to accept proposal." });
    }
});

/**
 * @route   PATCH /api/admin/proposals/:proposalId/reject
 * @desc    Reject an industry proposal
 * @access  Protected (Admin only)
 */
router.patch("/proposals/:proposalId/reject", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const { feedback } = req.body;

        const proposal = await Proposal.findOne({
            _id: req.params.proposalId,
            college: collegeId
        });

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found." });
        }

        proposal.status = "Rejected";
        proposal.adminFeedback = (feedback || "Proposal did not match current university requirements.").trim();
        proposal.reviewedAt = new Date();
        await proposal.save();

        // Notify Industry Partner
        try {
            await Notification.create({
                user: proposal.industryUser,
                challenge: proposal.challenge,
                proposal: proposal._id,
                title: "Proposal Status Update",
                message: `Your proposal for the campus challenge was reviewed: ${proposal.adminFeedback}`,
                type: "info"
            });
        } catch (notifErr) {
            console.error("Industry notification error:", notifErr.message);
        }

        res.json({
            message: "Proposal marked as rejected.",
            proposal
        });
    } catch (error) {
        console.error("Reject proposal error:", error);
        res.status(500).json({ message: "Failed to update proposal." });
    }
});

/**
 * @route   POST /api/admin/collaborations/:id/updates
 * @desc    Post progress update to collaboration
 * @access  Protected (Admin only)
 */
router.patch("/collaborations/:id/status", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;
        const { status } = req.body;
        const allowed = ["Partner Selected", "Planning", "In Progress", "Pilot", "Completed", "Cancelled"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid collaboration status." });
        }

        const collaboration = await Collaboration.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found." });
        }

        collaboration.status = status;
        await collaboration.save();

        // Also update challenge status
        if (status === "In Progress" || status === "Pilot") {
            await Challenge.findByIdAndUpdate(collaboration.challenge, { status: "In Progress" });
        }

        res.json({
            message: `Collaboration status updated to ${status}.`,
            collaboration
        });
    } catch (error) {
        console.error("Update collab status error:", error);
        res.status(500).json({ message: "Failed to update collaboration status." });
    }
});

/**
 * @route   PATCH /api/admin/collaborations/:id/complete
 * @desc    Mark collaboration as completed, record final solution, and capture SIH measurable impact
 * @access  Protected (Admin only)
 */
router.patch(
    "/collaborations/:id/complete",
    protect,
    adminOnly,
    upload.single("solutionImage"),
    async (req, res) => {
        try {
            const collegeId = req.user.collegeId;
            const {
                summary,
                implementationDetails,
                studentsBenefited,
                energySaved,
                waterSaved,
                wasteReduced,
                costSavings,
                timeSaved,
                infrastructureImprovement,
                customMetrics
            } = req.body;

            const collaboration = await Collaboration.findOne({
                _id: req.params.id,
                college: collegeId
            }).populate("industryUser", "name companyName");

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration project not found." });
            }

            let solutionImageUrl = null;
            if (req.file) {
                solutionImageUrl = await uploadToCloudinary(req.file.buffer, "campusresolve/solutions");
            }

            let parsedMetrics = [];
            if (customMetrics) {
                try {
                    parsedMetrics = typeof customMetrics === "string" ? JSON.parse(customMetrics) : customMetrics;
                } catch {
                    parsedMetrics = [];
                }
            }

            const impactData = {
                studentsBenefited: Number(studentsBenefited) || 0,
                energySaved: (energySaved || "").trim(),
                waterSaved: (waterSaved || "").trim(),
                wasteReduced: (wasteReduced || "").trim(),
                costSavings: (costSavings || "").trim(),
                timeSaved: (timeSaved || "").trim(),
                infrastructureImprovement: (infrastructureImprovement || "").trim(),
                customMetrics: parsedMetrics,
                recordedAt: new Date()
            };

            const solutionData = {
                summary: (summary || "Collaboration completed successfully.").trim(),
                implementationDetails: (implementationDetails || "").trim(),
                solutionImage: solutionImageUrl || collaboration.finalSolution?.solutionImage || null,
                submittedAt: new Date()
            };

            // Update collaboration record
            collaboration.status = "Completed";
            collaboration.actualCompletionDate = new Date();
            collaboration.finalSolution = solutionData;
            collaboration.impact = impactData;
            collaboration.progressUpdates.push({
                title: "Project Completed & Impact Verified",
                description: `Joint implementation finalized with measured impact for the campus community.`,
                percentage: 100,
                isPublic: true,
                postedBy: req.user.userId || req.user._id,
                postedByRole: "admin",
                createdAt: new Date()
            });

            await collaboration.save();

            // Update challenge record
            const challenge = await Challenge.findById(collaboration.challenge);
            if (challenge) {
                challenge.status = "Completed";
                challenge.finalSolution = {
                    summary: solutionData.summary,
                    implementationDetails: solutionData.implementationDetails,
                    solutionImage: solutionData.solutionImage,
                    completedAt: new Date()
                };
                challenge.impact = {
                    studentsBenefited: impactData.studentsBenefited,
                    energySaved: impactData.energySaved,
                    waterSaved: impactData.waterSaved,
                    wasteReduced: impactData.wasteReduced,
                    costSavings: impactData.costSavings,
                    timeSaved: impactData.timeSaved,
                    infrastructureImprovement: impactData.infrastructureImprovement,
                    recordedAt: new Date()
                };
                await challenge.save();

                // Notify student creator
                try {
                    await Notification.create({
                        user: challenge.createdBy,
                        challenge: challenge._id,
                        collaboration: collaboration._id,
                        title: "Challenge Successfully Resolved! 🎉",
                        message: `The collaboration project for "${challenge.title}" is complete! View the final solution and measured impact.`,
                        type: "success"
                    });
                } catch (notifErr) {
                    console.error("Student notification error:", notifErr.message);
                }
            }

            // Notify industry partner
            try {
                await Notification.create({
                    user: collaboration.industryUser._id,
                    challenge: collaboration.challenge,
                    collaboration: collaboration._id,
                    title: "Collaboration Marked as Completed! 🏆",
                    message: `University administration has approved and published the final solution and impact outcomes.`,
                    type: "success"
                });
            } catch (notifErr) {
                console.error("Industry notification error:", notifErr.message);
            }

            res.json({
                message: "Collaboration completed and measurable impact recorded successfully! 🏆",
                collaboration,
                challenge
            });

        } catch (error) {
            console.error("Complete collaboration error:", error);
            res.status(500).json({ message: error.message || "Failed to complete collaboration." });
        }
    }
);

module.exports = router;
