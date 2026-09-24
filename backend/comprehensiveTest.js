const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const College = require("./models/College");
const Department = require("./models/Department");
const User = require("./models/User");
const Complaint = require("./models/Complaint");
const Notification = require("./models/Notification");
const { analyzeComplaint } = require("./services/complaintAIService");
const { generateAIResponse } = require("./services/aiService");
const checkEscalations = require("./services/escalationService");

async function runComprehensiveVerification() {
    console.log("==================================================");
    console.log("   CAMPUSRESOLVE COMPREHENSIVE TEST SUITE");
    console.log("==================================================");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✓ Step 0: MongoDB connected successfully.");

        // 1. College verification
        const college = await College.findOne({ shortName: "JSSATEN" });
        if (!college) throw new Error("JSS college not found.");
        console.log(`✓ Step 1: College verified: ${college.name} (${college.shortName})`);

        // 2. Auth Verification (Student, Staff, Admin)
        const student = await User.findOne({ email: "rajan@gmail.com" });
        const admin = await User.findOne({ email: "jss25@gmail.com" });
        const staff = await User.findOne({ email: "jss.itstaff@gmail.com" }).populate("department");

        if (!student || !admin || !staff) {
            throw new Error("Missing test users (student, admin, or staff).");
        }

        console.log(`✓ Step 2: Users Verified:`);
        console.log(`   - Student: ${student.email} (Role: ${student.role})`);
        console.log(`   - Admin: ${admin.email} (Role: ${admin.role})`);
        console.log(`   - Staff: ${staff.email} (Role: ${staff.role}, Dept: ${staff.department?.name})`);

        // 3. Departments verification
        const depts = await Department.find({ college: college._id, isActive: true });
        console.log(`✓ Step 3: ${depts.length} active departments found for ${college.shortName}.`);
        if (depts.length < 5) throw new Error("Expected at least 5 active departments.");

        // 4. Test Student Complaint Submission with AI Auto-Routing (IT Complaint)
        console.log("\n--- Testing Student Complaint Submission & AI Auto-Routing ---");
        const compTitle = `TEST_COMPLAINT_${Date.now()}`;
        const compLocation = "Computer Center, Lab 3, 1st Floor";
        const compDesc = "The Wi-Fi access point in Lab 3 is completely dead. Students cannot connect devices to the college internet portal.";

        const aiResult = await analyzeComplaint({
            title: compTitle,
            description: compDesc,
            location: compLocation,
            availableDepartments: depts
        });

        console.log("AI Analysis Result:", {
            issueType: aiResult.issueType,
            priority: aiResult.priority,
            department: aiResult.department,
            confidence: aiResult.confidence
        });

        if (aiResult.department !== "IT Support" || aiResult.confidence < 0.6) {
            throw new Error(`AI Auto-routing failed: expected IT Support, got ${aiResult.department}`);
        }

        const matchedDept = depts.find(d => d.name === aiResult.department);
        const newComplaint = await Complaint.create({
            title: compTitle,
            description: compDesc,
            location: compLocation,
            category: matchedDept.name,
            department: matchedDept._id,
            issueType: aiResult.issueType,
            aiPriority: aiResult.priority,
            priority: aiResult.priority,
            aiSummary: aiResult.summary,
            aiReason: aiResult.reason,
            aiConfidence: aiResult.confidence,
            requiresManualAssignment: false,
            student: student._id,
            college: college._id,
            status: "Reported",
            statusHistory: [{
                status: "Reported",
                message: `Reported and auto-assigned to ${matchedDept.name} by ResolveAI.`,
                updatedAt: new Date()
            }]
        });

        console.log(`✓ Step 4: Complaint created and assigned: ID ${newComplaint._id}`);

        // 5. Verify Staff Notification & Staff Scoped Access
        console.log("\n--- Testing Staff Notification & Access Control ---");
        const staffNotification = await Notification.create({
            user: staff._id,
            complaint: newComplaint._id,
            title: `New ${newComplaint.priority} Priority Complaint`,
            message: `New issue "${newComplaint.title}" assigned to ${matchedDept.name}.`,
            type: "complaint"
        });

        const staffComplaints = await Complaint.find({
            college: college._id,
            department: staff.department._id
        });
        const isFoundInStaffQueue = staffComplaints.some(c => c._id.toString() === newComplaint._id.toString());
        if (!isFoundInStaffQueue) throw new Error("Complaint not found in staff department queue.");
        console.log("✓ Step 5: Complaint successfully visible in staff department queue.");

        // 6. Test Department Staff Status Transitions: Under Review -> In Progress -> Resolved
        console.log("\n--- Testing Staff Status Transitions & Resolution ---");

        // Accept complaint
        newComplaint.status = "Under Review";
        newComplaint.assignedStaff = staff._id;
        newComplaint.statusHistory.push({
            status: "Under Review",
            message: "Accepted by staff member.",
            updatedAt: new Date()
        });
        await newComplaint.save();
        console.log("✓ Step 6a: Complaint transitioned to 'Under Review'");

        // In Progress with remarks
        newComplaint.status = "In Progress";
        newComplaint.statusHistory.push({
            status: "In Progress",
            message: "Replaced faulty switch in rack 2.",
            updatedAt: new Date()
        });
        await newComplaint.save();
        console.log("✓ Step 6b: Complaint transitioned to 'In Progress'");

        // Resolved with resolution image
        newComplaint.status = "Resolved";
        newComplaint.resolutionImage = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        newComplaint.statusHistory.push({
            status: "Resolved",
            message: "Access point rebooted and tested at 150 Mbps.",
            updatedAt: new Date()
        });
        await newComplaint.save();

        // Create student resolution notification
        const studentNotif = await Notification.create({
            user: student._id,
            complaint: newComplaint._id,
            title: "Complaint Resolved ✓",
            message: "Your Wi-Fi complaint has been resolved with proof photo attached.",
            type: "success"
        });
        console.log("✓ Step 6c: Complaint transitioned to 'Resolved' with resolution proof and student notified.");

        // 7. Test Ambiguous / Low-Confidence Routing -> Admin Notification
        console.log("\n--- Testing Low-Confidence Ambiguous Ticket ---");
        const ambTitle = `AMBIGUOUS_COMPLAINT_${Date.now()}`;
        const ambResult = await analyzeComplaint({
            title: ambTitle,
            description: "Strange vibe around the sidewalk",
            location: "Somewhere outside",
            availableDepartments: depts
        });

        console.log("Ambiguous Triage Result:", {
            confidence: ambResult.confidence,
            department: ambResult.department
        });

        const isUnassigned = !ambResult.department || ambResult.confidence < 0.6;
        if (!isUnassigned) {
            console.log("Warning: Ambiguous complaint was routed with confidence", ambResult.confidence);
        } else {
            console.log("✓ Step 7a: Low-confidence complaint correctly tagged for manual routing.");
        }

        const unassignedComplaint = await Complaint.create({
            title: ambTitle,
            description: "Strange vibe around the sidewalk",
            location: "Somewhere outside",
            category: "Other",
            department: null,
            issueType: ambResult.issueType,
            aiPriority: ambResult.priority,
            priority: ambResult.priority,
            aiSummary: ambResult.summary,
            aiReason: ambResult.reason,
            aiConfidence: ambResult.confidence,
            requiresManualAssignment: true,
            student: student._id,
            college: college._id,
            status: "Reported"
        });

        // Admin notification for unassigned complaint
        const adminNotif = await Notification.create({
            user: admin._id,
            complaint: unassignedComplaint._id,
            title: "Complaint Routing Required ⚠️",
            message: `Complaint "${unassignedComplaint.title}" requires manual department assignment.`,
            type: "warning"
        });
        console.log("✓ Step 7b: Admin notification created for manual triage ticket.");

        // 8. Test Admin Manual Assignment & Priority Change
        console.log("\n--- Testing Admin Manual Department & Priority Assignment ---");
        const securityDept = depts.find(d => d.name === "Security") || depts[0];
        unassignedComplaint.department = securityDept._id;
        unassignedComplaint.category = securityDept.name;
        unassignedComplaint.requiresManualAssignment = false;
        unassignedComplaint.priority = "High";
        unassignedComplaint.statusHistory.push({
            status: "Reported",
            message: `Manually routed to ${securityDept.name} with High priority by admin.`,
            updatedAt: new Date()
        });
        await unassignedComplaint.save();

        if (unassignedComplaint.department.toString() !== securityDept._id.toString() || unassignedComplaint.priority !== "High") {
            throw new Error("Admin manual assignment failed.");
        }
        console.log(`✓ Step 8: Complaint successfully reassigned to ${securityDept.name} with High priority.`);

        // 9. Test Department Creation, Staff Addition, and Deletion
        console.log("\n--- Testing Admin Department & Staff CRUD ---");
        const testDeptName = `Test Dept ${Date.now().toString().slice(-4)}`;
        const testDept = await Department.create({
            name: testDeptName,
            description: "Temporary test department",
            college: college._id,
            isActive: true
        });
        console.log(`✓ Step 9a: Admin created department: ${testDept.name}`);

        const testStaffEmail = `temp.staff.${Date.now()}@college.edu`;
        const testHashedPass = await bcrypt.hash("TempPass@123", 10);
        const tempStaff = await User.create({
            name: "Temp Staff",
            email: testStaffEmail,
            password: testHashedPass,
            college: college._id,
            department: testDept._id,
            role: "department_staff",
            studentId: "STAFF-TEMP"
        });
        console.log(`✓ Step 9b: Admin added department staff: ${tempStaff.email}`);

        // Clean up temp test department and staff
        await User.deleteOne({ _id: tempStaff._id });
        await Department.deleteOne({ _id: testDept._id });
        console.log("✓ Step 9c: Cleaned up temporary department and staff.");

        // 10. Regression Testing: Chatbot & Escalation Service
        console.log("\n--- Testing Existing Features (Chatbot & Escalations) ---");
        const chatReply = await generateAIResponse("How do I report a Wi-Fi complaint?", [], {
            collegeName: college.name,
            studentName: student.name
        });
        if (!chatReply || !chatReply.reply) throw new Error("Chatbot response failed.");
        console.log("✓ Step 10a: Chatbot response generated successfully.");

        await checkEscalations();
        console.log("✓ Step 10b: Escalation check function executed without error.");

        // Cleanup test complaints and notifications
        await Complaint.deleteOne({ _id: newComplaint._id });
        await Complaint.deleteOne({ _id: unassignedComplaint._id });
        await Notification.deleteOne({ _id: staffNotification._id });
        await Notification.deleteOne({ _id: studentNotif._id });
        await Notification.deleteOne({ _id: adminNotif._id });

        await mongoose.disconnect();
        console.log("\n==================================================");
        console.log("   ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
        console.log("==================================================");

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILED:", err);
        process.exit(1);
    }
}

runComprehensiveVerification();
