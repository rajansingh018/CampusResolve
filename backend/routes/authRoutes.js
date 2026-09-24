const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const College = require("../models/College");

const router = express.Router();


// =====================================
// REGISTER
// =====================================

// =====================================
// REGISTER (Student)
// =====================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            studentId,
            password,
            collegeId
        } = req.body;


        // Validate

        if (
            !name ||
            !email ||
            !studentId ||
            !password ||
            !collegeId
        ) {

            return res.status(400).json({
                message: "Please fill all required fields."
            });

        }


        // Check college

        const college =
            await College.findById(collegeId);

        if (!college) {

            return res.status(404).json({
                message: "College not found."
            });

        }


        // Check existing user

        const existingUser =
            await User.findOne({ email: email.toLowerCase().trim() });

        if (existingUser) {

            return res.status(400).json({
                message: "User already exists with this email."
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user

        const user =
            await User.create({

                name: name.trim(),

                email: email.toLowerCase().trim(),

                studentId: studentId.trim(),

                password: hashedPassword,

                college: college._id,

                role: "student"

            });


        res.status(201).json({

            message: "Account created successfully.",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                college: user.college,
                role: user.role
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});


// =====================================
// REGISTER INDUSTRY PARTNER
// =====================================

router.post("/register-industry", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            companyName,
            industryCategory,
            expertise,
            description,
            website,
            phone,
            collegeId
        } = req.body;

        if (!name || !email || !password || !companyName) {
            return res.status(400).json({
                message: "Contact name, work email, password, and company name are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "An account already exists with this email."
            });
        }

        // Format expertise array
        let expertiseArray = [];
        if (Array.isArray(expertise)) {
            expertiseArray = expertise.map(e => String(e).trim()).filter(Boolean);
        } else if (typeof expertise === "string" && expertise.trim()) {
            expertiseArray = expertise.split(",").map(e => e.trim()).filter(Boolean);
        }

        // Optional college check
        let collegeRef = null;
        if (collegeId) {
            const collegeDoc = await College.findById(collegeId);
            if (collegeDoc) {
                collegeRef = collegeDoc._id;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const industryUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "industry",
            companyName: companyName.trim(),
            industryCategory: (industryCategory || "Information Technology").trim(),
            expertise: expertiseArray,
            description: (description || "").trim(),
            website: (website || "").trim(),
            phone: (phone || "").trim(),
            college: collegeRef
        });

        const token = jwt.sign(
            {
                userId: industryUser._id,
                collegeId: collegeRef,
                role: "industry",
                companyName: industryUser.companyName
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Industry partner account created successfully! 🚀",
            token,
            user: {
                id: industryUser._id,
                name: industryUser.name,
                email: industryUser.email,
                role: industryUser.role,
                companyName: industryUser.companyName,
                industryCategory: industryUser.industryCategory,
                expertise: industryUser.expertise,
                description: industryUser.description,
                website: industryUser.website,
                college: collegeRef
            }
        });

    } catch (error) {
        console.error("Industry registration error:", error);
        res.status(500).json({
            message: error.message || "Unable to register industry account."
        });
    }
});


// =====================================
// LOGIN
// =====================================

router.post(
    "/login",
    async (req, res) => {

        try {

            const {
                email,
                password,
                role,
                collegeId
            } = req.body;


            // =================================
            // Validate
            // =================================

            if (!email || !password || !role) {
                return res.status(400).json({
                    message: "Email, password, and role are required."
                });
            }

            // Student/Admin/Staff require collegeId
            if (role !== "industry" && !collegeId) {
                return res.status(400).json({
                    message: "College selection is required for this role."
                });
            }


            // =================================
            // Validate Role
            // =================================

            if (
                role !== "student" &&
                role !== "admin" &&
                role !== "department_staff" &&
                role !== "industry"
            ) {

                return res.status(400).json({

                    message:
                        "Invalid login role."

                });

            }


            // =================================
            // Find User
            // =================================

            const normalizedEmail = email.toLowerCase().trim();
            const query = { email: normalizedEmail };

            if (role !== "industry") {
                query.college = collegeId;
            }

            const user = await User.findOne(query)
                .populate("college")
                .populate("department", "name");


            // =================================
            // User Not Found
            // =================================

            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid email or password."

                });

            }


            // =================================
            // Check selected role against database role
            // =================================

            if (user.role !== role) {

                let roleMismatchMsg = "This account is not a student account.";
                if (role === "admin") {
                    roleMismatchMsg = "This account is not an admin account.";
                } else if (role === "department_staff") {
                    roleMismatchMsg = "This account is not a department staff account.";
                } else if (role === "industry") {
                    roleMismatchMsg = "This account is not registered as an industry partner.";
                }

                return res.status(403).json({
                    message: roleMismatchMsg
                });

            }


            // =================================
            // Check Password
            // =================================

            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!isMatch) {

                return res.status(401).json({

                    message:
                        "Invalid email or password."

                });

            }


            // =================================
            // JWT
            // =================================

            const tokenPayload = {
                userId: user._id,
                role: user.role,
                collegeId: user.college?._id || user.college || null,
                departmentId: user.department?._id || user.department || null,
                companyName: user.companyName || null
            };

            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );


            // =================================
            // Response
            // =================================

            const responseUser = {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                role: user.role,
                companyName: user.companyName || null,
                industryCategory: user.industryCategory || null,
                expertise: user.expertise || [],
                description: user.description || "",
                website: user.website || "",
                department: user.department
                    ? {
                        id: user.department._id,
                        name: user.department.name
                    }
                    : null,
                college: user.college
                    ? {
                        id: user.college._id,
                        name: user.college.name,
                        shortName: user.college.shortName,
                        logo: user.college.logo,
                        primaryColor: user.college.primaryColor,
                        secondaryColor: user.college.secondaryColor
                    }
                    : null
            };

            res.json({

                message: "Login successful.",

                token,

                user: responseUser

            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            res.status(500).json({

                message:
                    "Server error."

            });

        }

    }
);


module.exports = router;