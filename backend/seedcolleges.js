const dotenv = require("dotenv");
const mongoose = require("mongoose");

const College = require("./models/College");

dotenv.config();

const colleges = [
    {
        name: "JSS Academy of Technical Education",
        shortName: "JSSATEN",
        city: "Noida",
        state: "Uttar Pradesh",
        logo: "assets/logos/jssaten.png",
        primaryColor: "#2563eb",
        secondaryColor: "#7c3aed",
        website: "https://www.jssaten.ac.in"
    },

    {
        name: "Indian Institute of Technology Delhi",
        shortName: "IIT Delhi",
        city: "New Delhi",
        state: "Delhi",
        logo: "assets/logos/iitd.png",
        primaryColor: "#dc2626",
        secondaryColor: "#f59e0b"
    },

    {
        name: "Dr. A.P.J. Abdul Kalam Technical University",
        shortName: "AKTU",
        city: "Lucknow",
        state: "Uttar Pradesh",
        logo: "assets/logos/aktu.png",
        primaryColor: "#16a34a",
        secondaryColor: "#0ea5e9"
    },

    {
        name: "University of Delhi",
        shortName: "Delhi University",
        city: "New Delhi",
        state: "Delhi",
        logo: "assets/logos/du.png",
        primaryColor: "#1d4ed8",
        secondaryColor: "#9333ea"
    },

    {
        name: "Amity University",
        shortName: "Amity University",
        city: "Noida",
        state: "Uttar Pradesh",
        logo: "assets/logos/amity.png",
        primaryColor: "#b91c1c",
        secondaryColor: "#f59e0b"
    }
];


const seedDatabase = async () => {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB connected.");


        // Remove old colleges

        await College.deleteMany({});

        console.log("Old colleges removed.");


        // Insert colleges

        await College.insertMany(colleges);

        console.log(
            `${colleges.length} colleges inserted successfully.`
        );


        await mongoose.connection.close();

        console.log("Database connection closed.");

    } catch (error) {

        console.error(
            "Seeding failed:",
            error.message
        );

        process.exit(1);
    }
};


seedDatabase();