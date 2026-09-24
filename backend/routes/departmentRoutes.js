// =======================================================
// CampusResolve - Department Management Routes
// =======================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const Department = require("../models/Department");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * @route   GET /api/departments
 * @desc    Get active departments for authenticated user's college
 * @access  Protected (Student, Admin, Staff)
 */
router.get("/", protect, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const departments = await Department.find({
            college: collegeId,
            isActive: true
        }).sort({ name: 1 });

        res.json(departments);
    } catch (error) {
        console.error("Fetch departments error:", error);
        res.status(500).json({ message: "Unable to fetch departments." });
    }
});

/**
 * @route   GET /api/departments/admin/all
 * @desc    Get all departments with staff and complaints metrics for admin
 * @access  Protected (Admin only)
 */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const departments = await Department.find({ college: collegeId }).sort({ name: 1 });

        // Calculate staff and complaint counts for each department
        const departmentsWithStats = await Promise.all(
            departments.map(async (dept) => {
                const staffCount = await User.countDocuments({
                    department: dept._id,
                    college: collegeId,
                    role: "department_staff"
                });

                const totalComplaints = await Complaint.countDocuments({
                    department: dept._id,
                    college: collegeId
                });

                const pendingComplaints = await Complaint.countDocuments({
                    department: dept._id,
                    college: collegeId,
                    status: { $nin: ["Resolved", "Rejected"] }
                });

                const resolvedComplaints = await Complaint.countDocuments({
                    department: dept._id,
                    college: collegeId,
                    status: "Resolved"
                });

                return {
                    ...dept.toObject(),
                    staffCount,
                    totalComplaints,
                    pendingComplaints,
                    resolvedComplaints
                };
            })
        );

        res.json(departmentsWithStats);
    } catch (error) {
        console.error("Admin fetch departments error:", error);
        res.status(500).json({ message: "Unable to load departments." });
    }
});

/**
 * @route   POST /api/departments/admin
 * @desc    Create new department
 * @access  Protected (Admin only)
 */
router.post("/admin", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Department name is required." });
        }

        const trimmedName = name.trim();

        // Check if department already exists for this college
        const existing = await Department.findOne({
            college: collegeId,
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") }
        });

        if (existing) {
            return res.status(400).json({ message: "A department with this name already exists in your college." });
        }

        const department = await Department.create({
            name: trimmedName,
            description: (description || "").trim(),
            college: collegeId,
            isActive: true
        });

        res.status(201).json({
            message: "Department created successfully.",
            department
        });
    } catch (error) {
        console.error("Create department error:", error);
        res.status(500).json({ message: error.message || "Failed to create department." });
    }
});

/**
 * @route   PUT /api/departments/admin/:id
 * @desc    Edit existing department
 * @access  Protected (Admin only)
 */
router.put("/admin/:id", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const { name, description, isActive } = req.body;

        const department = await Department.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!department) {
            return res.status(404).json({ message: "Department not found." });
        }

        if (name && name.trim()) {
            const trimmedName = name.trim();
            // Check for duplicate name if changed
            if (trimmedName.toLowerCase() !== department.name.toLowerCase()) {
                const duplicate = await Department.findOne({
                    college: collegeId,
                    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
                    _id: { $ne: department._id }
                });
                if (duplicate) {
                    return res.status(400).json({ message: "A department with this name already exists." });
                }
            }
            department.name = trimmedName;
        }

        if (typeof description === "string") {
            department.description = description.trim();
        }

        if (typeof isActive === "boolean") {
            department.isActive = isActive;
        }

        await department.save();

        res.json({
            message: "Department updated successfully.",
            department
        });
    } catch (error) {
        console.error("Update department error:", error);
        res.status(500).json({ message: "Failed to update department." });
    }
});

/**
 * @route   PATCH /api/departments/admin/:id/toggle
 * @desc    Toggle department active status
 * @access  Protected (Admin only)
 */
router.patch("/admin/:id/toggle", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const department = await Department.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!department) {
            return res.status(404).json({ message: "Department not found." });
        }

        department.isActive = !department.isActive;
        await department.save();

        res.json({
            message: `Department ${department.isActive ? "activated" : "deactivated"} successfully.`,
            department
        });
    } catch (error) {
        console.error("Toggle department error:", error);
        res.status(500).json({ message: "Failed to toggle department status." });
    }
});

/**
 * @route   POST /api/departments/admin/seed
 * @desc    Seed standard default departments for current college
 * @access  Protected (Admin only)
 */
router.post("/admin/seed", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const created = [];
        for (const def of Department.DEFAULT_DEPARTMENTS) {
            const exists = await Department.findOne({
                college: collegeId,
                name: { $regex: new RegExp(`^${def.name}$`, "i") }
            });

            if (!exists) {
                const newDept = await Department.create({
                    name: def.name,
                    description: def.description,
                    college: collegeId,
                    isActive: true
                });
                created.push(newDept);
            }
        }

        res.json({
            message: `Successfully seeded ${created.length} department(s).`,
            createdCount: created.length
        });
    } catch (error) {
        console.error("Seed departments error:", error);
        res.status(500).json({ message: "Failed to seed departments." });
    }
});

/**
 * @route   GET /api/departments/admin/:id/staff
 * @desc    Get staff members assigned to department
 * @access  Protected (Admin only)
 */
router.get("/admin/:id/staff", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const staffList = await User.find({
            department: req.params.id,
            college: collegeId,
            role: "department_staff"
        }).select("-password");

        res.json(staffList);
    } catch (error) {
        console.error("Fetch department staff error:", error);
        res.status(500).json({ message: "Failed to fetch department staff." });
    }
});

/**
 * @route   POST /api/departments/admin/:id/staff
 * @desc    Create and assign a staff member to department
 * @access  Protected (Admin only)
 */
router.post("/admin/:id/staff", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const department = await Department.findOne({
            _id: req.params.id,
            college: collegeId
        });

        if (!department) {
            return res.status(404).json({ message: "Department not found." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const staffUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            college: collegeId,
            department: department._id,
            role: "department_staff",
            studentId: `STAFF-${Date.now().toString().slice(-5)}`
        });

        res.status(201).json({
            message: "Department staff member created successfully.",
            staff: {
                id: staffUser._id,
                name: staffUser.name,
                email: staffUser.email,
                role: staffUser.role,
                department: department.name
            }
        });
    } catch (error) {
        console.error("Add department staff error:", error);
        res.status(500).json({ message: error.message || "Failed to add department staff." });
    }
});

/**
 * @route   DELETE /api/departments/admin/staff/:staffId
 * @desc    Remove a department staff member
 * @access  Protected (Admin only)
 */
router.delete("/admin/staff/:staffId", protect, adminOnly, async (req, res) => {
    try {
        const collegeId = req.user.collegeId || req.user.college;

        const staff = await User.findOneAndDelete({
            _id: req.params.staffId,
            college: collegeId,
            role: "department_staff"
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        res.json({ message: "Staff member removed successfully." });
    } catch (error) {
        console.error("Delete staff error:", error);
        res.status(500).json({ message: "Failed to remove staff member." });
    }
});

module.exports = router;
