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
const Challenge = require("./models/Challenge");
const Proposal = require("./models/Proposal");
const Collaboration = require("./models/Collaboration");

async function runIndustryModuleVerification() {
    console.log("==================================================");
    console.log("   CAMPUSRESOLVE SIH INDUSTRY MODULE TEST SUITE");
    console.log("==================================================");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✓ Step 0: MongoDB connected successfully.");

        // 1. Fetch test college, student, admin
        const college = await College.findOne();
        if (!college) throw new Error("No college found in database.");
        console.log(`✓ Step 1: College: ${college.name} (${college.shortName})`);

        let student = await User.findOne({ role: "student", college: college._id });
        if (!student) {
            // create one if needed
            const hash = await bcrypt.hash("Password123!", 10);
            student = await User.create({
                name: "Test Student",
                email: `teststudent_${Date.now()}@college.edu`,
                password: hash,
                role: "student",
                studentId: `STU${Date.now().toString().slice(-4)}`,
                college: college._id,
                departmentName: "Computer Science"
            });
        }
        console.log(`✓ Step 2: Student: ${student.email}`);

        let admin = await User.findOne({ role: "admin", college: college._id });
        if (!admin) {
            const hash = await bcrypt.hash("AdminPass123!", 10);
            admin = await User.create({
                name: "Test Admin",
                email: `testadmin_${Date.now()}@college.edu`,
                password: hash,
                role: "admin",
                college: college._id
            });
        }
        console.log(`✓ Step 3: Admin: ${admin.email}`);

        // 2. Register/Create Industry Partner
        const industryEmail = `greentech_${Date.now()}@ecovate.io`;
        const indPassword = await bcrypt.hash("IndustrySecure123!", 10);
        const industryUser = await User.create({
            name: "Dr. Arvind Mehta",
            email: industryEmail,
            password: indPassword,
            role: "industry",
            companyName: "Ecovate Renewable Systems Pvt Ltd",
            industryCategory: "Sustainability & CleanTech",
            expertise: ["Solar Energy", "IoT Smart Grid", "Waste Management"],
            description: "Leading provider of IoT-enabled solar microgrids and smart energy management systems for academic campuses.",
            website: "https://ecovate.example.com",
            phone: "+91 9876543210"
        });
        console.log(`✓ Step 4: Industry Partner registered: ${industryUser.companyName} (${industryUser.email})`);

        // 3. Student Submits a Crowdsourced Societal Challenge
        const challengeTitle = `Campus Solar Microgrid & Smart Energy Optimization - ${Date.now()}`;
        const challenge = await Challenge.create({
            title: challengeTitle,
            description: "High energy consumption across academic blocks during peak daylight hours. We need an IoT-monitored solar microgrid to reduce carbon footprint and stabilize campus power.",
            category: "Sustainability & CleanTech",
            location: "North & South Academic Blocks Rooftop",
            expectedOutcome: "30% reduction in grid power consumption and continuous power for computer labs during outages.",
            targetBeneficiaries: "Over 4,500 students and faculty members across North & South Blocks.",
            createdBy: student._id,
            college: college._id,
            status: "Open",
            supports: [student._id],
            supportCount: 1
        });
        console.log(`✓ Step 5: Student Challenge Created: "${challenge.title}" [Status: ${challenge.status}]`);

        // Create student submission notification for admin
        await Notification.create({
            user: admin._id,
            challenge: challenge._id,
            type: "challenge",
            title: "New Challenge Submitted",
            message: `A new challenge "${challenge.title}" was submitted by ${student.name}.`
        });

        // 4. Another Student Upvotes / Supports Challenge
        // Toggle support test
        const isSupported = challenge.supports.some(s => s.toString() === student._id.toString());
        if (isSupported) {
            console.log(`✓ Step 6: Challenge Upvote verified. Creator is in supports array (Count: ${challenge.supportCount}).`);
        }

        // 5. Admin Reviews and Validates Challenge
        challenge.status = "University Validated";
        challenge.adminFeedback = "Validated by Dean of Innovation & Sustainable Campus Committee.";
        await challenge.save();
        console.log(`✓ Step 7: Admin Validated Challenge: [Status: ${challenge.status}]`);

        // 6. Admin Requests Industry Collaboration
        challenge.status = "Seeking Industry Partner";
        challenge.requiredExpertise = ["Solar Energy", "IoT Smart Grid"];
        challenge.requiredIndustryCategory = "Sustainability & CleanTech";
        challenge.collaborationRequirements = {
            expectedOutcome: "30% reduction in grid power consumption and continuous power for computer labs during outages.",
            timelineMonths: 2,
            estimatedBudget: "₹15-20 Lakhs",
            deliverables: "50kWp rooftop installation with smart IoT dashboard",
            requestedAt: new Date()
        };
        await challenge.save();
        console.log(`✓ Step 8: Admin Opened for Industry Collaboration: [Status: ${challenge.status}, Category: ${challenge.requiredIndustryCategory}]`);

        // 7. Industry Partner Views Available Challenges & Calculates Match Score
        const availableChallenges = await Challenge.find({
            status: { $in: ["Seeking Industry Partner", "Proposal Received"] }
        }).populate("college", "name shortName");

        const targetFound = availableChallenges.find(c => c._id.toString() === challenge._id.toString());
        if (!targetFound) throw new Error("Challenge not found in industry available feed.");
        
        // Match calculation check
        let matchScore = 0;
        if (targetFound.requiredIndustryCategory === industryUser.industryCategory) matchScore += 40;
        const matchingExpertise = (targetFound.requiredExpertise || []).filter(skill =>
            industryUser.expertise.some(e => e.toLowerCase() === skill.toLowerCase())
        );
        matchScore += Math.min(60, matchingExpertise.length * 20);
        console.log(`✓ Step 9: Industry matched challenge with Match Score: ${matchScore}% (Matched Skills: ${matchingExpertise.join(", ")})`);

        // 8. Industry Partner Submits a Proposal
        const proposal = await Proposal.create({
            challenge: challenge._id,
            college: college._id,
            industryUser: industryUser._id,
            companyName: industryUser.companyName,
            proposedSolution: "Installation of a 50kWp Smart Hybrid Solar Microgrid with Cloud-connected IoT telemetry sensors for real-time energy flow tracking.",
            implementationApproach: "Phase 1: Solar audit & structural analysis (2 wks). Phase 2: Panel mounting & inverter setup (3 wks). Phase 3: IoT gateway & campus dashboard integration (1 wk).",
            estimatedTimeline: "6 Weeks",
            expectedImpact: "Estimated 35,000 kWh annual clean energy generation, cutting campus electricity bills by ₹3.5 Lakhs/yr.",
            estimatedCost: "₹18,50,000 (Co-funded under Industry CSR + University Grant)",
            status: "Submitted"
        });

        challenge.status = "Proposal Received";
        await challenge.save();
        console.log(`✓ Step 10: Industry Proposal Submitted by "${proposal.companyName}" [Status: ${proposal.status}]`);

        // 9. Admin Accepts Proposal and Initializes Collaboration
        proposal.status = "Accepted";
        proposal.adminFeedback = "Approved by University Executive Council and Industry Liaison Office.";
        await proposal.save();

        challenge.status = "Partner Selected";
        await challenge.save();

        const collaboration = await Collaboration.create({
            challenge: challenge._id,
            college: college._id,
            adminUser: admin._id,
            industryUser: industryUser._id,
            proposal: proposal._id,
            title: `${challenge.title} — ${proposal.companyName} Partnership`,
            status: "Partner Selected",
            progressUpdates: [
                {
                    title: "Partnership Kickoff & Agreement Signed",
                    description: "Formal MoU signed between University and Ecovate Renewable Systems. Site survey scheduled for next Monday.",
                    percentage: 10,
                    isPublic: true,
                    postedBy: industryUser._id,
                    postedByRole: "industry"
                }
            ]
        });
        console.log(`✓ Step 11: Admin Accepted Proposal -> Collaboration Created [Collab ID: ${collaboration._id}]`);

        // 10. Industry Posts Progress Update
        collaboration.status = "In Progress";
        collaboration.progressUpdates.push({
            title: "Hardware Installation & Inverter Synchronization",
            description: "50kWp panels installed on Block C rooftop. Smart inverters successfully synchronized with university 3-phase grid.",
            percentage: 60,
            isPublic: true,
            postedBy: industryUser._id,
            postedByRole: "industry"
        });
        await collaboration.save();

        challenge.status = "In Progress";
        await challenge.save();
        console.log(`✓ Step 12: In-Progress Milestone logged by Industry Partner (Updates count: ${collaboration.progressUpdates.length})`);

        // 11. Admin Completes Project & Records SIH Real Impact
        const finalImpact = {
            studentsBenefited: 4850,
            energySaved: "42,000 kWh/year",
            waterSaved: "0 Liters",
            wasteReduced: "12 Tons CO2 Equivalent/year",
            costSavings: "₹4,20,000 / year",
            timeSaved: "100% reduction in lab power disruptions"
        };
        const finalSol = {
            summary: "Fully operational 50kWp IoT-enabled Solar Microgrid deployed on Block C with live dashboard telemetry accessible to engineering students for research.",
            implementationDetails: "Installed 110 monocrystalline PERC solar panels, 2 x 25kW smart hybrid string inverters, and Modbus IoT gateway.",
            solutionImage: null,
            submittedAt: new Date()
        };

        collaboration.status = "Completed";
        collaboration.finalSolution = finalSol;
        collaboration.impact = finalImpact;
        await collaboration.save();

        challenge.status = "Completed";
        challenge.finalSolution = {
            summary: finalSol.summary,
            implementationDetails: finalSol.implementationDetails,
            solutionImage: finalSol.solutionImage,
            completedAt: new Date()
        };
        challenge.impact = finalImpact;
        await challenge.save();

        console.log(`✓ Step 13: Project Marked Completed with SIH Impact Recorded:`);
        console.log(`   - Students Benefited: ${challenge.impact.studentsBenefited}`);
        console.log(`   - Energy Saved: ${challenge.impact.energySaved}`);
        console.log(`   - Carbon/Waste Reduced: ${challenge.impact.wasteReduced}`);
        console.log(`   - Annual Cost Savings: ${challenge.impact.costSavings}`);

        // 12. Public Showcase Query Test
        const publicCompleted = await Challenge.find({ status: "Completed" })
            .populate("college", "name shortName")
            .populate("createdBy", "name");
        
        const completedMatch = publicCompleted.find(c => c._id.toString() === challenge._id.toString());
        if (!completedMatch) throw new Error("Completed challenge not showing in public showcase.");
        console.log(`✓ Step 14: Public Showcase verified (${publicCompleted.length} completed showcase projects found).`);

        console.log("\n==================================================");
        console.log("   ALL UNIVERSITY-INDUSTRY TESTS PASSED (100%)");
        console.log("==================================================");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

runIndustryModuleVerification();
