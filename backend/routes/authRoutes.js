const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const College = require("../models/College");

const router = express.Router();


// =====================================
// REGISTER
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
            await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({
                message: "User already exists."
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user

        const user =
            await User.create({

                name,

                email,

                studentId,

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

            if (
                !email ||
                !password ||
                !role ||
                !collegeId
            ) {

                return res.status(400).json({

                    message:
                        "Email, password, role and college are required."

                });

            }


            // =================================
            // Validate Role
            // =================================

            if (
                role !== "student" &&
                role !== "admin"
            ) {

                return res.status(400).json({

                    message:
                        "Invalid login role."

                });

            }


            // =================================
            // Find User
            // =================================

            const user =
                await User.findOne({

                    email: email.toLowerCase().trim(),

                    college: collegeId

                })
                .populate("college");


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
            // IMPORTANT:
            // Check selected role
            // against database role
            // =================================

            if (
                user.role !== role
            ) {

                return res.status(403).json({

                    message:
                        role === "admin"

                            ? "This account is not an admin account."

                            : "This account is not a student account."

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

            const token =
                jwt.sign(

                    {

                        userId:
                            user._id,

                        collegeId:
                            user.college._id,

                        role:
                            user.role

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "7d"

                    }

                );


            // =================================
            // Response
            // =================================

            res.json({

                message:
                    "Login successful.",

                token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    studentId:
                        user.studentId,

                    role:
                        user.role,

                    college: {

                        id:
                            user.college._id,

                        name:
                            user.college.name,

                        shortName:
                            user.college.shortName,

                        logo:
                            user.college.logo,

                        primaryColor:
                            user.college.primaryColor,

                        secondaryColor:
                            user.college.secondaryColor

                    }

                }

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