// =======================================================
// CampusResolve - Industry Partner Portal Routes
// Opportunity Discovery, Proposals & Joint Collaboration
// =======================================================

const express = require("express");
const Challenge = require("../models/Challenge");
const Proposal = require("../models/Proposal");
const Collaboration = require("../models/Collaboration");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");
const industryOnly = require("../middleware/industryMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

function uploadToCloudinary(buffer, folder = "campusresolve/proposals") {
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
 * @route   GET /api/industry/stats
 * @desc    Get real live stats for the logged-in industry partner
 * @access  Protected (Industry)
 */
router.get("/stats", protect, industryOnly, async (req, res) => {
    try {
        const industryUserId = req.user.userId || req.user._id;

        const availableChallenges = await Challenge.countDocuments({
            status: "Seeking Industry Partner"
        });

        const myProposals = await Proposal.countDocuments({
            industryUser: industryUserId
        });

        const activeCollaborations = await Collaboration.countDocuments({
            industryUser: industryUserId,
            status: { $in: ["Partner Selected", "Planning", "In Progress", "Pilot"] }
        });

        const completedCollaborations = await Collaboration.countDocuments({
            industryUser: industryUserId,
            status: "Completed"
        });

        res.json({
            availableChallenges,
            myProposals,
            activeCollaborations,
            completedCollaborations
        });
    } catch (error) {
        console.error("Industry stats error:", error);
        res.status(500).json({ message: "Unable to load dashboard metrics." });
    }
});

/**
 * @route   GET /api/industry/challenges
 * @desc    Discover eligible university challenges seeking industry collaboration
 * @access  Protected (Industry)
 */
router.get("/challenges", protect, industryOnly, async (req, res) => {
    try {
        const industryUserId = req.user.userId || req.user._id;
        const industryUser = await User.findById(industryUserId);

        const { category, search, collegeId } = req.query;

        const query = {
            status: "Seeking Industry Partner"
        };

        if (collegeId && collegeId !== "All") {
            query.college = collegeId;
        }

        if (category && category !== "All") {
            query.category = category;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { title: regex },
                { description: regex },
                { requiredExpertise: regex },
                { requiredIndustryCategory: regex }
            ];
        }

        const challenges = await Challenge.find(query)
            .populate("college", "name shortName logo city state")
            .populate("createdBy", "name")
            .sort({ supportCount: -1, createdAt: -1 });

        // Check if current industry user has already proposed for any of these
        const myProposals = await Proposal.find({ industryUser: industryUserId }).select("challenge status");
        const proposedChallengeMap = new Map();
        myProposals.forEach(p => proposedChallengeMap.set(String(p.challenge), p.status));

        // Deterministic expertise matching
        const userExpertiseList = (industryUser?.expertise || []).map(e => e.toLowerCase().trim());
        const userCategory = (industryUser?.industryCategory || "").toLowerCase().trim();

        const challengesWithMeta = challenges.map(ch => {
            const chObj = ch.toObject();
            chObj.hasProposed = proposedChallengeMap.has(String(ch._id));
            chObj.myProposalStatus = proposedChallengeMap.get(String(ch._id)) || null;

            // Deterministic Match Calculation
            let matchScore = 0;
            const requiredExp = (ch.requiredExpertise || []).map(e => e.toLowerCase().trim());
            const matchedSkills = [];

            if (ch.requiredIndustryCategory && ch.requiredIndustryCategory.toLowerCase().trim() === userCategory) {
                matchScore += 40;
            }

            requiredExp.forEach(skill => {
                if (userExpertiseList.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))) {
                    matchScore += 20;
                    matchedSkills.push(skill);
                }
            });

            chObj.matchScore = Math.min(matchScore, 100);
            chObj.matchedSkills = matchedSkills;

            return chObj;
        });

        // Sort by match score then supports
        challengesWithMeta.sort((a, b) => b.matchScore - a.matchScore);

        res.json(challengesWithMeta);
    } catch (error) {
        console.error("Industry fetch challenges error:", error);
        res.status(500).json({ message: "Unable to load industry opportunities." });
    }
});

/**
 * @route   GET /api/industry/challenges/:id
 * @desc    Get detailed challenge opportunity
 * @access  Protected (Industry)
 */
router.get("/challenges/:id", protect, industryOnly, async (req, res) => {
    try {
        const industryUserId = req.user.userId || req.user._id;

        const challenge = await Challenge.findById(req.params.id)
            .populate("college", "name shortName logo city state website");

        if (!challenge) {
            return res.status(404).json({ message: "Challenge opportunity not found." });
        }

        const existingProposal = await Proposal.findOne({
            challenge: challenge._id,
            industryUser: industryUserId
        });

        const chObj = challenge.toObject();
        chObj.existingProposal = existingProposal;

        res.json(chObj);
    } catch (error) {
        console.error("Single industry challenge error:", error);
        res.status(500).json({ message: "Unable to load challenge details." });
    }
});

/**
 * @route   POST /api/industry/challenges/:id/proposals
 * @desc    Submit an industry solution proposal for a challenge
 * @access  Protected (Industry)
 */
router.post(
    "/challenges/:id/proposals",
    protect,
    industryOnly,
    upload.single("supportingDocument"),
    async (req, res) => {
        try {
            const industryUserId = req.user.userId || req.user._id;
            const user = await User.findById(industryUserId);

            const {
                proposedSolution,
                implementationApproach,
                requiredResources,
                estimatedTimeline,
                expectedImpact,
                estimatedCost,
                contactPhone
            } = req.body;

            if (!proposedSolution || !implementationApproach || !estimatedTimeline || !expectedImpact) {
                return res.status(400).json({
                    message: "Solution, implementation approach, timeline, and expected impact are required."
                });
            }

            const challenge = await Challenge.findById(req.params.id);
            if (!challenge) {
                return res.status(404).json({ message: "Challenge not found." });
            }

            if (challenge.status !== "Seeking Industry Partner" && challenge.status !== "Proposal Received") {
                return res.status(400).json({
                    message: `This challenge is currently in "${challenge.status}" status and is not accepting new proposals.`
                });
            }

            // Check duplicate proposal
            const existing = await Proposal.findOne({
                challenge: challenge._id,
                industryUser: industryUserId
            });

            if (existing) {
                return res.status(400).json({
                    message: "You have already submitted a proposal for this challenge."
                });
            }

            let supportingDocument = null;
            if (req.file) {
                supportingDocument = await uploadToCloudinary(req.file.buffer, "campusresolve/proposals");
            }

            const proposal = await Proposal.create({
                challenge: challenge._id,
                college: challenge.college,
                industryUser: industryUserId,
                companyName: user.companyName || user.name,
                contactEmail: user.email,
                contactPhone: contactPhone || user.phone || "",
                proposedSolution: proposedSolution.trim(),
                implementationApproach: implementationApproach.trim(),
                requiredResources: (requiredResources || "").trim(),
                estimatedTimeline: estimatedTimeline.trim(),
                expectedImpact: expectedImpact.trim(),
                estimatedCost: (estimatedCost || "CSR / University Sponsored").trim(),
                supportingDocument,
                status: "Submitted"
            });

            // Update challenge status to Proposal Received if currently Seeking
            if (challenge.status === "Seeking Industry Partner") {
                challenge.status = "Proposal Received";
                await challenge.save();
            }

            // Notify university admins of the new proposal
            try {
                const admins = await User.find({
                    role: "admin",
                    college: challenge.college
                });

                for (const admin of admins) {
                    await Notification.create({
                        user: admin._id,
                        challenge: challenge._id,
                        proposal: proposal._id,
                        title: "New Industry Proposal Received 💼",
                        message: `${proposal.companyName} submitted a solution proposal for "${challenge.title}".`,
                        type: "proposal"
                    });
                }
            } catch (notifErr) {
                console.error("Admin proposal notification error:", notifErr.message);
            }

            res.status(201).json({
                message: "Proposal submitted successfully! The university administration has been notified for review. 🚀",
                proposal
            });

        } catch (error) {
            console.error("Submit proposal error:", error);
            res.status(500).json({ message: error.message || "Failed to submit proposal." });
        }
    }
);

/**
 * @route   GET /api/industry/proposals
 * @desc    Get all proposals submitted by current industry user
 * @access  Protected (Industry)
 */
router.get("/proposals", protect, industryOnly, async (req, res) => {
    try {
        const industryUserId = req.user.userId || req.user._id;

        const proposals = await Proposal.find({ industryUser: industryUserId })
            .populate({
                path: "challenge",
                select: "title category location status supportingImage priority",
                populate: { path: "college", select: "name shortName logo" }
            })
            .sort({ createdAt: -1 });

        res.json(proposals);
    } catch (error) {
        console.error("Industry proposals error:", error);
        res.status(500).json({ message: "Unable to load your proposals." });
    }
});

/**
 * @route   GET /api/industry/collaborations
 * @desc    Get all active & completed collaborations for current industry user
 * @access  Protected (Industry)
 */
router.get("/collaborations", protect, industryOnly, async (req, res) => {
    try {
        const industryUserId = req.user.userId || req.user._id;

        const collaborations = await Collaboration.find({ industryUser: industryUserId })
            .populate("challenge", "title category location status supportingImage")
            .populate("college", "name shortName logo city")
            .populate("proposal", "proposedSolution estimatedTimeline estimatedCost")
            .sort({ updatedAt: -1 });

        res.json(collaborations);
    } catch (error) {
        console.error("Industry collaborations error:", error);
        res.status(500).json({ message: "Unable to load collaborations." });
    }
});

/**
 * @route   POST /api/industry/collaborations/:id/updates
 * @desc    Post progress update to active collaboration
 * @access  Protected (Industry)
 */
router.post(
    "/collaborations/:id/updates",
    protect,
    industryOnly,
    upload.array("images", 3),
    async (req, res) => {
        try {
            const industryUserId = req.user.userId || req.user._id;
            const { title, description, percentage, isPublic } = req.body;

            if (!title || !description) {
                return res.status(400).json({ message: "Title and description are required." });
            }

            const collaboration = await Collaboration.findOne({
                _id: req.params.id,
                industryUser: industryUserId
            });

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration project not found." });
            }

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const url = await uploadToCloudinary(file.buffer, "campusresolve/progress");
                    imageUrls.push(url);
                }
            }

            const parsedPct = typeof percentage !== "undefined" ? Math.min(Math.max(Number(percentage), 0), 100) : 0;
            const publicFlag = isPublic === "true" || isPublic === true;

            const newUpdate = {
                title: title.trim(),
                description: description.trim(),
                percentage: parsedPct,
                isPublic: publicFlag,
                postedBy: industryUserId,
                postedByRole: "industry",
                images: imageUrls,
                createdAt: new Date()
            };

            collaboration.progressUpdates.push(newUpdate);

            // Auto-advance status if starting work
            if (collaboration.status === "Partner Selected" || collaboration.status === "Planning") {
                collaboration.status = "In Progress";
                await Challenge.findByIdAndUpdate(collaboration.challenge, { status: "In Progress" });
            }

            await collaboration.save();

            // Notify Admin
            try {
                await Notification.create({
                    user: collaboration.adminUser,
                    challenge: collaboration.challenge,
                    collaboration: collaboration._id,
                    title: `Progress Update: ${collaboration.title}`,
                    message: `${title} (${parsedPct}% complete).`,
                    type: "collaboration"
                });
            } catch (notifErr) {
                console.error("Admin update notification error:", notifErr.message);
            }

            // If public, notify student creator
            if (publicFlag) {
                try {
                    const ch = await Challenge.findById(collaboration.challenge);
                    if (ch) {
                        await Notification.create({
                            user: ch.createdBy,
                            challenge: ch._id,
                            collaboration: collaboration._id,
                            title: `Challenge Progress Update: ${title}`,
                            message: `Industry partner posted an update on "${ch.title}" (${parsedPct}% complete).`,
                            type: "info"
                        });
                    }
                } catch (notifErr) {
                    console.error("Student progress notification error:", notifErr.message);
                }
            }

            res.status(201).json({
                message: "Progress update posted successfully! 🚀",
                update: newUpdate,
                collaboration
            });

        } catch (error) {
            console.error("Post update error:", error);
            res.status(500).json({ message: error.message || "Failed to post progress update." });
        }
    }
);

/**
 * @route   GET /api/industry/profile
 * @desc    Get industry user profile
 * @access  Protected (Industry)
 */
router.get("/profile", protect, industryOnly, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId || req.user._id).select("-password");
        res.json(user);
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Unable to load profile." });
    }
});

/**
 * @route   PUT /api/industry/profile
 * @desc    Update industry user profile
 * @access  Protected (Industry)
 */
router.put("/profile", protect, industryOnly, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const { companyName, industryCategory, expertise, description, website, phone, name } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (companyName) user.companyName = companyName.trim();
        if (industryCategory) user.industryCategory = industryCategory.trim();
        if (description) user.description = description.trim();
        if (website) user.website = website.trim();
        if (phone) user.phone = phone.trim();
        if (name) user.name = name.trim();

        if (Array.isArray(expertise)) {
            user.expertise = expertise.map(e => String(e).trim()).filter(Boolean);
        } else if (typeof expertise === "string" && expertise.trim()) {
            user.expertise = expertise.split(",").map(e => e.trim()).filter(Boolean);
        }

        await user.save();

        res.json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyName: user.companyName,
                industryCategory: user.industryCategory,
                expertise: user.expertise,
                description: user.description,
                website: user.website,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile." });
    }
});

module.exports = router;
