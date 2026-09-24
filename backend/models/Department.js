const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Department name is required"],
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        college: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: [true, "Associated college is required"]
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate department names in the same college
departmentSchema.index({ name: 1, college: 1 }, { unique: true });

// Predefined default departments for college initialization
departmentSchema.statics.DEFAULT_DEPARTMENTS = [
    { name: "IT Support", description: "Campus Wi-Fi, computer labs, portal access, network, and tech hardware." },
    { name: "Electrical & Maintenance", description: "Power, wiring, fans, air conditioning, lights, elevators, and repairs." },
    { name: "Hostel", description: "Hostel rooms, furniture, washrooms, plumbing, keys, and warden assistance." },
    { name: "Mess & Food", description: "Cafeteria, dining hall hygiene, food quality, drinking water, and meal service." },
    { name: "Transport", description: "Campus buses, shuttle service, driver conduct, vehicle schedules, and parking." },
    { name: "Academics", description: "Lectures, faculty, examinations, timetables, syllabus, and course grading." },
    { name: "Security", description: "Gate entry, ID cards, CCTV, campus safety, lost & found, and emergency response." },
    { name: "Cleanliness & Sanitation", description: "Housekeeping, trash disposal, classroom cleanliness, and campus hygiene." },
    { name: "Library", description: "Book availability, reading halls, reference material, and library system." },
    { name: "Administration", description: "Student fees, certificates, admissions, verification, and registrar desk." }
];

module.exports = mongoose.model("Department", departmentSchema);
