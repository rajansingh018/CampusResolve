const nodemailer = require("nodemailer");

const Complaint =
    require("../models/Complaint");

const College =
    require("../models/College");


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

        const escalationDays =
            Number(
                process.env.ESCALATION_DAYS || 7
            );


        const deadline =
            new Date();

        deadline.setDate(
            deadline.getDate() -
            escalationDays
        );


        // Find unresolved complaints
        // older than escalation period

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

                // Get college

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
${escalationDays} days.

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
${complaint.createdAt.toLocaleDateString("en-IN")}

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