const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        shortName: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        logo: {
            type: String,
            default: ""
        },

        primaryColor: {
            type: String,
            default: "#2563eb"
        },

        secondaryColor: {
            type: String,
            default: "#7c3aed"
        },

        website: {
            type: String,
            default: ""
        },
        escalationEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "College",
    collegeSchema
);