const dotenv = require("dotenv");
const mongoose = require("mongoose");
const College = require("./models/College");
const Department = require("./models/Department");

dotenv.config();

async function seedDepartments() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for department seeding.");

        const colleges = await College.find();
        console.log(`Found ${colleges.length} colleges.`);

        let totalSeeded = 0;
        for (const college of colleges) {
            for (const def of Department.DEFAULT_DEPARTMENTS) {
                const existing = await Department.findOne({
                    college: college._id,
                    name: def.name
                });

                if (!existing) {
                    await Department.create({
                        name: def.name,
                        description: def.description,
                        college: college._id,
                        isActive: true
                    });
                    totalSeeded++;
                }
            }
        }

        console.log(`Seeding complete. ${totalSeeded} new department(s) created.`);
        await mongoose.disconnect();
    } catch (error) {
        console.error("Department seeding failed:", error);
        process.exit(1);
    }
}

seedDepartments();
