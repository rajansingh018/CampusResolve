const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const College = require("./models/College");
const Department = require("./models/Department");
const User = require("./models/User");

dotenv.config();

async function seedTestStaff() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const jssCollege = await College.findOne({ shortName: "JSSATEN" });
        if (!jssCollege) {
            console.log("JSS college not found.");
            process.exit(1);
        }

        const itDept = await Department.findOne({ college: jssCollege._id, name: "IT Support" });
        if (!itDept) {
            console.log("IT Support department not found.");
            process.exit(1);
        }

        const staffEmail = "jss.itstaff@gmail.com";
        const existing = await User.findOne({ email: staffEmail });
        const hashedPassword = await bcrypt.hash("Staff@12345", 10);

        if (!existing) {
            await User.create({
                name: "Ramesh Sharma (IT Staff)",
                email: staffEmail,
                password: hashedPassword,
                college: jssCollege._id,
                department: itDept._id,
                role: "department_staff",
                studentId: "STAFF-IT01"
            });
            console.log(`Created test IT staff: ${staffEmail} / Staff@12345`);
        } else {
            existing.password = hashedPassword;
            existing.department = itDept._id;
            existing.role = "department_staff";
            await existing.save();
            console.log(`Updated test IT staff: ${staffEmail} / Staff@12345`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Staff seed error:", err);
        process.exit(1);
    }
}

seedTestStaff();
