const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

async function resetPassword() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB connected");

        const newPassword = "Admin@12345";

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        const user =
            await User.findOneAndUpdate(

                {
                    email: "jss25@gmail.com"
                },

                {
                    password: hashedPassword,
                    role: "admin"
                },

                {
                    new: true
                }

            );

        if (!user) {

            console.log(
                "User not found"
            );

            return;

        }

        console.log(
            "Admin password reset successfully!"
        );

        console.log(
            "Email: jss25@gmail.com"
        );

        console.log(
            "New password: Admin@12345"
        );

    } catch (error) {

        console.error(
            "Error:",
            error
        );

    } finally {

        await mongoose.disconnect();

    }

}

resetPassword();