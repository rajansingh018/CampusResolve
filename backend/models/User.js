const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        studentId: {
            type: String,
            trim: true,
            required: function () {
                return this.role === "student";
            }
        },

        password: {
            type: String,
            required: true
        },

        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: function () {
                return this.role !== "industry";
            }
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },

        role: {
            type: String,
            enum: ["student", "admin", "department_staff", "industry"],
            default: "student"
        },

        // Industry Partner Specific Fields
        companyName: {
            type: String,
            trim: true,
            default: null
        },

        industryCategory: {
            type: String,
            trim: true,
            default: null
        },

        expertise: {
            type: [String],
            default: []
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        website: {
            type: String,
            trim: true,
            default: ""
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);