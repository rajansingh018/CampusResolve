// =======================================================
// CampusResolve - AI Chatbot Service (ResolveAI)
// =======================================================

const SYSTEM_PROMPT = `
You are "ResolveAI", the friendly, intelligent, and proactive AI Assistant for CampusResolve — the ultimate Student Grievance and Campus Resolution Platform.

Your Mission:
1. Help students navigate CampusResolve and resolve their campus problems quickly.
2. Guide them on reporting issues, selecting the right category, writing clear descriptions, and attaching photo proof.
3. Explain complaint statuses, resolution workflows, and automatic escalation mechanisms.
4. Answer questions about campus policies, hostel/mess rules, Wi-Fi connectivity, academic grievances, and emergency contacts.
5. Speak in the user's preferred language (English, Hindi, or Hinglish). Always be helpful, respectful, empathetic, and concise.

Platform Knowledge & Rules:
- Complaint Categories: Infrastructure, Wi-Fi & IT, Hostel, Mess, Transport, Academics, Safety, Cleanliness, Other.
- Complaint Lifecycle:
  * Reported: Complaint submitted by student.
  * Under Review: Campus admin/staff has acknowledged and is reviewing the issue.
  * In Progress: Maintenance/staff is actively fixing the problem.
  * Resolved: Issue fixed. Admin uploads resolution proof image.
  * Rejected: Invalid or duplicate issue (with specific admin reason).
- Escalation System: If an issue is not resolved within the defined SLA timeline (e.g., unattended for days), the system automatically escalates it to higher campus authorities (HOD / Dean / Warden / Admin) and triggers high-priority alerts.
- Reporting an issue: Navigate to "Report Issue" (or report.html), choose category, describe problem, specify exact location (e.g. Block B, Room 204), set priority (Low, Medium, High, Critical), and optionally attach a photo.
- Tracking issues: Go to "My Complaints" (complaints.html) to see real-time updates and status history timeline.

Formatting:
- Use bullet points, bold text, and clean formatting.
- Include appropriate emojis (🚀, 📋, ⚡, 🔔, 🛠️) to make answers engaging and easy to scan.
- Always encourage students to voice genuine campus concerns!
`;

// Built-in Intelligent Fallback Knowledge Base
function getFallbackResponse(userMessage, context = {}) {
    const msg = userMessage.toLowerCase().trim();
    const collegeName = context.collegeName || "your campus";
    const studentName = context.studentName || "Student";

    // Greeting
    if (/^(hi|hello|hey|namaste|pranam|hola|good morning|good evening|kya hal hai)/i.test(msg)) {
        return `Hello ${studentName}! 👋 Main **ResolveAI** hoon, CampusResolve ka AI Assistant.\n\nMain aapki help kar sakta hoon:\n- 📝 **Complaint report** karne mein guidance\n- 🔍 **Status & Escalation** samjhne mein\n- 📶 **Wi-Fi, Hostel, Mess, Infrastructure** related issues solve karne mein\n- ❓ Campus resolution policies aur FAQs\n\nBataiye, aaj main aapki kya madad kar sakta hoon?`;
    }

    // Report / File Complaint
    if (/report|file|submit|complaint kaise|issue kaise|shikayat|darj/i.test(msg)) {
        return `📝 **Complaint Kaise Report Karein:**\n\n1. **"Report Issue"** page par jaiye.\n2. **Category** select karein (jaise *Wi-Fi & IT, Hostel, Mess, Infrastructure, Cleanliness*).\n3. **Title aur Description** mein exact problem likhein.\n4. **Location** specify karein (e.g. *Hostel Block B, Room 102 ya IT Lab 3*).\n5. **Priority** choose karein (*Low, Medium, High, Critical*).\n6. Problem ki **photo attach** karein taaki admin jaldi verify kar sake.\n7. **Submit** button dabayein! ✅\n\nAapko real-time notification aur tracking ID mil jayegi.`;
    }

    // Track Status
    if (/status|track|check|meri complaint|kahan tak pahucha|kab solve hoga/i.test(msg)) {
        return `🔍 **Complaint Status Track Karne Ka Tarika:**\n\n- **"My Complaints"** tab par click karein.\n- Har complaint ka current status dikhega:\n  * 🟡 **Reported**: Admin ke paas complaint receive ho chuki hai.\n  * 🔵 **Under Review**: Issue ko check kiya ja raha hai.\n  * 🟠 **In Progress**: Technician / Staff resolve karne mein laga hai.\n  * 🟢 **Resolved**: Issue fix ho chuka hai (Proof photo ke sath).\n  * 🔴 **Rejected**: Agar duplicate ya invalid issue tha.`;
    }

    // Escalation
    if (/escalat|delay|solve nahi hua|time lag raha|late|action nahi/i.test(msg)) {
        return `⚡ **Escalation Policy & Timeline:**\n\nCampusResolve mein **Automated Escalation** system laga hai:\n- Agar aapki complaint par time limit ke andar koi action nahi liya jata, toh system use **Higher Authority (HOD / Dean / Chief Warden)** ko escalate kar deta hai.\n- Complaint ka priority level automatically increase ho jata hai.\n- Admin ko urgent reminder notification bheja jata hai.\n\nAap apne **My Complaints** section mein escalation status dekh sakte hain!`;
    }

    // Wi-Fi / IT
    if (/\b(wifi|wi-fi|internet|network|portal|login|router|server|lan)\b/i.test(msg) || (/\bit\b/i.test(msg) && !/submit|wait|suit|visit|quality|credit/i.test(msg))) {
        return `📶 **Wi-Fi & IT Support:**\n\n- Agar campus Wi-Fi slow hai ya connect nahi ho raha:\n  1. Ek baar device ka Wi-Fi off/on karke campus portal login verify karein.\n  2. Agar poore floor/block mein problem hai, toh **Category: Wi-Fi & IT** select karke complaint file karein.\n  3. Location mein Router number / Floor / Room number zaroor likhein.\n  4. IT department ko direct alert chala jayega! 💻`;
    }

    // Hostel / Mess
    if (/hostel|mess|food|khana|water|pani|bijli|electricity|geyser|room/i.test(msg)) {
        return `🏢 **Hostel & Mess Grievances:**\n\n- **Mess / Food Issue**: Agar khana theek nahi hai ya hygiene issue hai, Category: **Mess** select karke photo ke saath report karein.\n- **Room / Electricity / Water**: Geyser, fan, leakage ya electricity cut ke liye Category: **Hostel** ya **Infrastructure** choose karein.\n- Hostel warden aur maintenance team ko real-time dashboard par aapka ticket show hoga.`;
    }

    // Emergency / Safety
    if (/safety|emergency|ragging|harassment|security|help|khatra/i.test(msg)) {
        return `🚨 **Safety & Urgent Help:**\n\n- Agar koi ragging, safety ya security concern hai:\n  1. Priority ko **Critical** select karein.\n  2. Category: **Safety** choose karein.\n  3. Direct Proctor / Security Incharge ko instant alert send hoga.\n- Emergency situations mein turant apne campus security control room ya warden se bhi contact karein!`;
    }

    // Default general response
    return `Main aapki query samajh gaya! 🤝\n\n**${collegeName}** ke CampusResolve platform par aap:\n- 📝 Nayi complaint file kar sakte hain (**Report Issue**).\n- 📋 Purani complaints ka live progress dekh sakte hain (**My Complaints**).\n- 🔔 Notifications bell se real-time updates pa sakte hain.\n\nAgar aapko kisi specific category (Wi-Fi, Hostel, Mess, Academics, Escalation) ke baare mein janna hai, toh batayein!`;
}

/**
 * Generate AI Response using Gemini API or Fallback
 */
async function generateAIResponse(userMessage, conversationHistory = [], context = {}) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // Use intelligent fallback when no API key is provided
        return {
            reply: getFallbackResponse(userMessage, context),
            source: "smart_knowledge_base"
        };
    }

    try {
        const contents = [];

        // Add conversation history if available
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
            for (const item of conversationHistory.slice(-6)) {
                if (item.role && item.text) {
                    contents.push({
                        role: item.role === "user" ? "user" : "model",
                        parts: [{ text: item.text }]
                    });
                }
            }
        }

        // Add current user message with context injection
        const contextString = context.collegeName
            ? `[User Context: Student at "${context.collegeName}", Name: "${context.studentName || 'Student'}"]\n`
            : "";

        contents.push({
            role: "user",
            parts: [{ text: `${contextString}${userMessage}` }]
        });

        // Call Google Gemini API (gemini-1.5-flash)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 600
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn("Gemini API call returned error, falling back to local engine:", errorText);
            return {
                reply: getFallbackResponse(userMessage, context),
                source: "fallback_engine"
            };
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
            return {
                reply: reply.trim(),
                source: "gemini_ai"
            };
        }

        return {
            reply: getFallbackResponse(userMessage, context),
            source: "fallback_engine"
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        return {
            reply: getFallbackResponse(userMessage, context),
            source: "fallback_engine"
        };
    }
}

module.exports = {
    generateAIResponse,
    getFallbackResponse
};
