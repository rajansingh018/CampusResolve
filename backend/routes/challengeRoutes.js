// =======================================================
// CampusResolve - Student & General Challenge Routes
// Crowdsourcing Societal & Campus Challenges
// =======================================================

const express = require("express");
const Challenge = require("../models/Challenge");
const Collaboration = require("../models/Collaboration");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/**
 * Helper: Upload image buffer to Cloudinary
 */
function uploadToCloudinary(buffer, folder = "campusresolve/challenges") {
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
 * @route   POST /api/challenges
 * @desc    Submit a new crowdsourced societal/campus challenge
 * @access  Protected (Student, Admin)
 */
router.post("/", protect, upload.single("supportingImage"), async (req, res) => {
    try {
        const { title, description, category, location, requiredExpertise, priority } = req.body;

        if (!title || !description || !location) {
            return res.status(400).json({
                message: "Title, description, and location are required."
            });
        }

        const userId = req.user.userId || req.user._id;
        const collegeId = req.user.collegeId || req.user.college;

        if (!collegeId) {
            return res.status(400).json({
                message: "College association is required to submit a challenge."
            });
        }

        let supportingImage = null;
        if (req.file) {
            supportingImage = await uploadToCloudinary(req.file.buffer, "campusresolve/challenges");
        }

        // Format expertise array
        let expertiseArr = [];
        if (Array.isArray(requiredExpertise)) {
            expertiseArr = requiredExpertise.map(e => String(e).trim()).filter(Boolean);
        } else if (typeof requiredExpertise === "string" && requiredExpertise.trim()) {
            try {
                const parsed = JSON.parse(requiredExpertise);
                if (Array.isArray(parsed)) expertiseArr = parsed;
                else expertiseArr = requiredExpertise.split(",").map(e => e.trim()).filter(Boolean);
            } catch {
                expertiseArr = requiredExpertise.split(",").map(e => e.trim()).filter(Boolean);
            }
        }

        const challenge = await Challenge.create({
            title: title.trim(),
            description: description.trim(),
            category: (category || "Smart Campus").trim(),
            location: location.trim(),
            college: collegeId,
            createdBy: userId,
            priority: priority && ["Low", "Medium", "High", "Critical"].includes(priority) ? priority : "Medium",
            requiredExpertise: expertiseArr,
            supportingImage,
            status: "Open",
            supports: [userId], // Creator auto-supports their own submission
            supportCount: 1
        });

        // Notify college administrators of the new crowdsourced challenge
        try {
            const admins = await User.find({
                role: "admin",
                college: collegeId
            });

            for (const admin of admins) {
                await Notification.create({
                    user: admin._id,
                    challenge: challenge._id,
                    title: "New Challenge Submitted 💡",
                    message: `A new challenge "${challenge.title}" in ${challenge.category} was submitted for review.`,
                    type: "challenge"
                });
            }
        } catch (notifErr) {
            console.error("Admin notification error:", notifErr.message);
        }

        await challenge.populate("createdBy", "name email studentId");
        await challenge.populate("college", "name shortName logo");

        res.status(201).json({
            message: "Challenge submitted successfully! The campus community can now view and support it. 🎉",
            challenge
        });

    } catch (error) {
        console.error("Challenge creation error:", error);
        res.status(500).json({
            message: error.message || "Failed to submit challenge."
        });
    }
});

/**
 * @route   GET /api/challenges
 * @desc    Get all challenges for authenticated student's college with filters
 * @access  Protected
 */
router.get("/", protect, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const currentUserId = req.user.userId || req.user._id;

        const { status, category, search } = req.query;

        const query = {};
        if (collegeId) {
            query.college = collegeId;
        }

        if (status && status !== "All") {
            query.status = status;
        }

        if (category && category !== "All") {
            query.category = category;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ title: regex }, { description: regex }, { location: regex }, { requiredExpertise: regex }];
        }

        const challenges = await Challenge.find(query)
            .populate("createdBy", "name studentId")
            .populate("selectedPartner", "name companyName industryCategory")
            .populate("college", "name shortName logo")
            .sort({ supportCount: -1, createdAt: -1 });

        // Augment with isSupportedByMe
        const formattedChallenges = challenges.map(ch => {
            const chObj = ch.toObject();
            chObj.isSupportedByMe = ch.supports && ch.supports.some(uid => String(uid) === String(currentUserId));
            return chObj;
        });

        res.json(formattedChallenges);
    } catch (error) {
        console.error("Fetch challenges error:", error);
        res.status(500).json({
            message: "Unable to load challenges."
        });
    }
});

/**
 * @route   GET /api/challenges/my
 * @desc    Get challenges created by the logged in student
 * @access  Protected
 */
router.get("/my", protect, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;

        const challenges = await Challenge.find({ createdBy: userId })
            .populate("selectedPartner", "name companyName industryCategory")
            .populate("college", "name shortName logo")
            .sort({ createdAt: -1 });

        res.json(challenges);
    } catch (error) {
        console.error("Fetch my challenges error:", error);
        res.status(500).json({
            message: "Unable to load your challenges."
        });
    }
});

/**
 * @route   GET /api/challenges/public-completed
 * @desc    Get completed challenges with final solutions and measured impact
 * @access  Protected
 */
router.get("/public-completed", protect, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const query = { status: "Completed" };
        if (collegeId) query.college = collegeId;

        const completedChallenges = await Challenge.find(query)
            .populate("selectedPartner", "companyName industryCategory website")
            .populate("college", "name shortName logo")
            .sort({ "finalSolution.completedAt": -1, updatedAt: -1 });

        res.json(completedChallenges);
    } catch (error) {
        console.error("Completed challenges error:", error);
        res.status(500).json({
            message: "Unable to load completed challenges."
        });
    }
});

/**
 * @route   GET /api/challenges/:id
 * @desc    Get single challenge detail including public collaboration progress
 * @access  Protected
 */
router.get("/:id", protect, async (req, res) => {
    try {
        const currentUserId = req.user.userId || req.user._id;

        const challenge = await Challenge.findById(req.params.id)
            .populate("createdBy", "name email studentId")
            .populate("selectedPartner", "name companyName industryCategory website description")
            .populate("college", "name shortName logo");

        if (!challenge) {
            return res.status(404).json({
                message: "Challenge not found."
            });
        }

        const chObj = challenge.toObject();
        chObj.isSupportedByMe = challenge.supports && challenge.supports.some(uid => String(uid) === String(currentUserId));

        // Fetch collaboration record if partner is selected / in progress / completed
        const collaboration = await Collaboration.findOne({ challenge: challenge._id })
            .populate("industryUser", "companyName industryCategory");

        if (collaboration) {
            // Filter progress updates: students only see public updates
            const publicUpdates = (collaboration.progressUpdates || []).filter(u => u.isPublic);
            chObj.collaboration = {
                id: collaboration._id,
                status: collaboration.status,
                startDate: collaboration.startDate,
                targetCompletionDate: collaboration.targetCompletionDate,
                actualCompletionDate: collaboration.actualCompletionDate,
                progressUpdates: publicUpdates,
                finalSolution: collaboration.finalSolution,
                impact: collaboration.impact
            };
        }

        res.json(chObj);
    } catch (error) {
        console.error("Single challenge error:", error);
        res.status(500).json({
            message: "Unable to load challenge details."
        });
    }
});

/**
 * @route   POST /api/challenges/:id/support
 * @desc    Toggle crowdsourced support / upvote for a challenge
 * @access  Protected (Student/User in same college)
 */
router.post("/:id/support", protect, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const collegeId = req.user.collegeId || req.user.college;

        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({
                message: "Challenge not found."
            });
        }

        // Verify user belongs to same college
        if (collegeId && String(challenge.college) !== String(collegeId)) {
            return res.status(403).json({
                message: "You can only support challenges from your own college campus."
            });
        }

        const isAlreadySupported = challenge.supports.some(uid => String(uid) === String(userId));

        let isSupported;
        if (isAlreadySupported) {
            // Remove support
            challenge.supports = challenge.supports.filter(uid => String(uid) !== String(userId));
            isSupported = false;
        } else {
            // Add support
            challenge.supports.push(userId);
            isSupported = true;
        }

        challenge.supportCount = challenge.supports.length;
        await challenge.save();

        res.json({
            message: isSupported ? "Supported challenge! 👍" : "Support removed.",
            isSupported,
            supportCount: challenge.supportCount
        });

    } catch (error) {
        console.error("Support toggle error:", error);
        res.status(500).json({
            message: "Failed to update support status."
        });
    }
});

module.exports = router;
