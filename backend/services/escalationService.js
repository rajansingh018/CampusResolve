const nodemailer = require("nodemailer");

const Complaint =
    require("../models/Complaint");

const College =
    require("../models/College");

const Notification =
    require("../models/Notification");


// =====================================
// Email Transporter
// =====================================

const transporter =
    nodemailer.createTransport({

        service: "gmail",

        auth: {

            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_APP_PASSWORD

        }

    });


// =====================================
// Check & Escalate Complaints
// =====================================

async function checkEscalations() {

    try {

        // Escalation time in hours
        const escalationHours =
            Number(
                process.env.ESCALATION_HOURS || 12
            );


        // Calculate deadline
        const deadline =
            new Date(
                Date.now() -
                escalationHours * 60 * 60 * 1000
            );


        // Find complaints which:
        // 1. Are older than 12 hours
        // 2. Are not resolved/rejected
        // 3. Have not already been escalated

        const complaints =
            await Complaint.find({

                createdAt: {
                    $lte: deadline
                },

                status: {
                    $nin: [
                        "Resolved",
                        "Rejected"
                    ]
                },

                isEscalated: false

            });


        console.log(
            `Escalation check: ${complaints.length} complaint(s) found.`
        );


        for (
            const complaint of complaints
        ) {

            try {

                // =================================
                // Get College
                // =================================

                const college =
                    await College.findById(
                        complaint.college
                    );


                if (
                    !college ||
                    !college.escalationEmail
                ) {

                    console.log(
                        `No escalation email configured for complaint ${complaint._id}`
                    );

                    continue;

                }


                // =================================
                // Email Content
                // =================================

                const subject =
                    `⚠️ Complaint Escalation - ${complaint.title}`;


                const message = `

Dear Principal/Dean,

A complaint submitted through CampusResolve
has remained unresolved for more than
${escalationHours} hours.

Complaint Details:

Title:
${complaint.title}

Category:
${complaint.category}

Location:
${complaint.location}

Current Status:
${complaint.status}

Reported On:
${complaint.createdAt.toLocaleString("en-IN")}

Complaint Description:
${complaint.description}

The complaint has therefore been
automatically escalated for your attention.

Regards,
CampusResolve
Student Complaint Resolution System

                `;


                // =================================
                // Send Email
                // =================================

                await transporter.sendMail({

                    from:
                        `"CampusResolve" <${process.env.EMAIL_USER}>`,

                    to:
                        college.escalationEmail,

                    subject:
                        subject,

                    text:
                        message

                });


                // =================================
                // Mark as Escalated
                // =================================

                complaint.isEscalated =
                    true;

                complaint.escalatedAt =
                    new Date();

                complaint.escalationLevel =
                    1;


                await complaint.save();

                // Create student notification for escalation
                try {
                    await Notification.create({
                        user: complaint.student,
                        complaint: complaint._id,
                        title: "Complaint Escalated ⚠️",
                        message: `Your complaint "${complaint.title}" has been escalated to higher authorities due to resolution delay.`,
                        type: "warning"
                    });
                } catch (notifErr) {
                    console.error("Failed to create escalation notification:", notifErr.message);
                }

                console.log(
                    `Complaint ${complaint._id} escalated successfully.`
                );


            } catch (error) {

                console.error(
                    `Escalation failed for complaint ${complaint._id}:`,
                    error.message
                );

            }

        }


    } catch (error) {

        console.error(
            "Escalation service error:",
            error
        );

    }

}


module.exports =
    checkEscalations;