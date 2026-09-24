// =======================================================
// CampusResolve - AI Complaint Routing Service
// Dedicated AI Complaint Agent for Automated Triage
// =======================================================

/**
 * Intelligent Rule-Based / NLP Classifier Fallback
 * Used when Gemini API is unavailable, unconfigured, or fails.
 */
function heuristicClassifyComplaint({ title, description, location, availableDepartments = [] }) {
    const text = `${title} ${description} ${location}`.toLowerCase();

    // Map departments to high-confidence keyword signals
    const departmentSignals = [
        {
            name: "IT Support",
            aliases: ["it", "wi-fi & it", "wifi", "it support", "information technology"],
            keywords: [
                "wifi", "wi-fi", "internet", "network", "router", "lan", "ethernet",
                "portal", "login", "password", "server", "website", "erp", "system crash",
                "computer", "pc", "monitor", "keyboard", "mouse", "printer", "projector",
                "smart board", "lab computer", "software", "antivirus", "broadband"
            ],
            issueTypes: {
                wifi: "Wi-Fi & Network Connectivity",
                portal: "Student Portal / ERP Access",
                hardware: "IT Lab & Computer Hardware",
                printer: "Printer & Projector Malfunction",
                default: "IT Infrastructure & Software Issue"
            }
        },
        {
            name: "Electrical & Maintenance",
            aliases: ["electrical", "maintenance", "electrical & maintenance"],
            keywords: [
                "electric", "electricity", "power", "current", "shock", "spark", "short circuit",
                "wire", "wiring", "switch", "switchboard", "socket", "plug", "mcb", "fuse",
                "light", "tube light", "bulb", "fan", "ceiling fan", "ac", "air conditioner",
                "cooler", "lift", "elevator", "generator", "voltage", "blackout", "fluctuation"
            ],
            issueTypes: {
                shock: "Electrical Hazard & Shock Risk",
                spark: "Short Circuit / Sparking",
                power: "Power Outage / Blackout",
                fan: "Fan / Lighting Breakdown",
                ac: "Air Conditioning Breakdown",
                default: "Electrical & Maintenance Fault"
            }
        },
        {
            name: "Hostel",
            aliases: ["hostel", "hostel maintenance"],
            keywords: [
                "hostel", "room", "bed", "mattress", "almirah", "cupboard", "door", "lock",
                "key", "window", "balcony", "curtain", "washroom", "bathroom", "toilet",
                "tap", "flush", "sink", "geyser", "hot water", "warden", "roommate",
                "block a", "block b", "block c", "block d", "hostel block", "water heater"
            ],
            issueTypes: {
                washroom: "Hostel Sanitation & Plumbing",
                geyser: "Geyser & Hot Water Problem",
                room: "Room Fixture / Furniture Damage",
                lock: "Door Lock & Security Hardware",
                default: "Hostel Accommodation Grievance"
            }
        },
        {
            name: "Mess & Food",
            aliases: ["mess", "food", "canteen", "mess & food"],
            keywords: [
                "food", "mess", "canteen", "meal", "breakfast", "lunch", "dinner", "snack",
                "roti", "rice", "dal", "paneer", "vegetable", "milk", "tea", "coffee",
                "insect", "worm", "hair in food", "stone", "stale", "spoiled", "smell",
                "hygiene", "plate", "spoon", "dining hall", "cook", "catering", "raw",
                "taste", "food poisoning", "diarrhea", "vomit", "water cooler", "drinking water", "ro filter"
            ],
            issueTypes: {
                insect: "Severe Food Contamination",
                hygiene: "Dining Hall & Kitchen Hygiene",
                drinking: "Drinking Water Quality / RO Issue",
                taste: "Food Quality & Preparation Standard",
                default: "Mess & Dining Grievance"
            }
        },
        {
            name: "Cleanliness & Sanitation",
            aliases: ["cleanliness", "sanitation", "housekeeping", "cleanliness & sanitation"],
            keywords: [
                "dirty", "dust", "garbage", "trash", "dustbin", "waste", "litter",
                "sweep", "sweeper", "mop", "smell", "stink", "foul", "drain", "drainage",
                "gutter", "choked", "clogged", "overflowing", "corridor", "staircase",
                "campus ground", "spitting", "stains", "cleaning"
            ],
            issueTypes: {
                choked: "Drainage Overflow & Clogging",
                garbage: "Uncollected Garbage / Waste Accumulation",
                dirty: "Corridor & Classroom Housekeeping",
                default: "Campus Cleanliness & Hygiene"
            }
        },
        {
            name: "Security",
            aliases: ["security", "safety"],
            keywords: [
                "security", "guard", "gate", "main gate", "id card", "entry", "trespass",
                "stranger", "theft", "stolen", "lost", "laptop stolen", "cycle", "bike",
                "parking", "cctv", "camera", "fight", "brawl", "ragging", "harassment",
                "bully", "threat", "unsafe", "suspicious", "alcohol", "drugs", "smoking"
            ],
            issueTypes: {
                ragging: "Anti-Ragging / Student Safety Emergency",
                theft: "Campus Property Theft / Lost & Found",
                gate: "Gate Entry & Security Surveillance",
                default: "Campus Security & Vigilance"
            }
        },
        {
            name: "Transport",
            aliases: ["transport"],
            keywords: [
                "bus", "transport", "driver", "conductor", "shuttle", "route", "bus stop",
                "pickup", "drop", "bus timing", "delay", "crowded", "bus pass", "breakdown",
                "flat tyre", "overspeeding", "rash driving"
            ],
            issueTypes: {
                driver: "Driver Conduct & Rash Driving",
                timing: "Bus Delay & Route Schedule Disruption",
                breakdown: "Transport Vehicle Breakdown",
                default: "Campus Transportation Service"
            }
        },
        {
            name: "Academics",
            aliases: ["academics", "academic"],
            keywords: [
                "teacher", "faculty", "professor", "hod", "lecture", "class", "attendance",
                "subject", "syllabus", "exam", "examination", "midsem", "endsem", "test",
                "marks", "grading", "internal", "assignment", "lab manual", "schedule",
                "timetable", "credit", "backlog", "result"
            ],
            issueTypes: {
                attendance: "Attendance Discrepancy",
                exam: "Examination / Evaluation Grievance",
                faculty: "Faculty Lecture & Curriculum Schedule",
                default: "Academic & Curriculum Support"
            }
        },
        {
            name: "Library",
            aliases: ["library"],
            keywords: [
                "library", "book", "journal", "issue book", "return book", "fine", "librarian",
                "reading hall", "reference", "digital library", "study room", "noise in library"
            ],
            issueTypes: {
                book: "Book Availability & Cataloguing",
                hall: "Library Study Environment & Noise",
                default: "Library Service & Resources"
            }
        },
        {
            name: "Administration",
            aliases: ["administration", "admin office"],
            keywords: [
                "fees", "fee receipt", "fee slip", "scholarship", "document", "verification",
                "bonafide", "certificate", "character certificate", "transcript", "clearance",
                "account office", "registrar", "refund", "admission", "identity card"
            ],
            issueTypes: {
                scholarship: "Scholarship & Fee Processing",
                certificate: "Document & Certificate Issuance",
                default: "Campus Administration & Documentation"
            }
        }
    ];

    // Build department lookup list from MongoDB active departments
    const deptMap = new Map();
    availableDepartments.forEach(dept => {
        deptMap.set(dept.name.toLowerCase().trim(), dept.name);
    });

    // Score each candidate department
    let bestDept = null;
    let highestScore = 0;
    let matchedSignal = null;

    for (const signal of departmentSignals) {
        let score = 0;
        for (const kw of signal.keywords) {
            if (text.includes(kw)) {
                // Word boundary / longer matches carry more weight
                score += kw.length > 5 ? 2 : 1;
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestDept = signal.name;
            matchedSignal = signal;
        }
    }

    // Determine priority
    let priority = "Medium";
    let priorityReason = "Normal operational grievance";

    const criticalKeywords = [
        "shock", "spark", "fire", "emergency", "ragging", "poisoning",
        "harassment", "bleeding", "threat", "short circuit", "burst", "gas leak"
    ];
    const highKeywords = [
        "not working since", "exam tomorrow", "no water", "overflowing",
        "stolen", "theft", "blackout", "urgent", "danger", "immediately", "severe", "broken lock"
    ];
    const lowKeywords = [
        "suggestion", "feedback", "slow", "minor", "spelling", "request"
    ];

    if (criticalKeywords.some(kw => text.includes(kw))) {
        priority = "Critical";
        priorityReason = "Detected immediate safety, health hazard, or emergency keywords";
    } else if (highKeywords.some(kw => text.includes(kw))) {
        priority = "High";
        priorityReason = "Detected widespread impact or urgent operational disruption";
    } else if (lowKeywords.some(kw => text.includes(kw))) {
        priority = "Low";
        priorityReason = "Detected non-urgent feedback or minor cosmetic issue";
    }

    // Determine issue type
    let issueType = "Campus Grievance";
    if (matchedSignal) {
        issueType = matchedSignal.issueTypes.default;
        for (const [subKey, typeLabel] of Object.entries(matchedSignal.issueTypes)) {
            if (subKey !== "default" && text.includes(subKey)) {
                issueType = typeLabel;
                break;
            }
        }
    }

    // Calculate confidence score (0.0 to 1.0)
    let confidence = 0.4;
    if (highestScore >= 4) {
        confidence = 0.94;
    } else if (highestScore >= 2) {
        confidence = 0.85;
    } else if (highestScore === 1) {
        confidence = 0.65;
    } else {
        confidence = 0.35;
        bestDept = null;
    }

    // Validate matched department against available MongoDB departments
    let matchedMongoDeptName = null;
    if (bestDept) {
        // Direct match
        if (deptMap.has(bestDept.toLowerCase())) {
            matchedMongoDeptName = deptMap.get(bestDept.toLowerCase());
        } else {
            // Check aliases
            if (matchedSignal) {
                for (const alias of matchedSignal.aliases) {
                    if (deptMap.has(alias)) {
                        matchedMongoDeptName = deptMap.get(alias);
                        break;
                    }
                }
            }
            // Fuzzy partial match
            if (!matchedMongoDeptName) {
                for (const [deptLower, originalName] of deptMap.entries()) {
                    if (deptLower.includes(bestDept.toLowerCase()) || bestDept.toLowerCase().includes(deptLower)) {
                        matchedMongoDeptName = originalName;
                        break;
                    }
                }
            }
        }
    }

    // If no department in DB matched, downgrade confidence
    if (!matchedMongoDeptName) {
        confidence = Math.min(confidence, 0.45);
    }

    const summary = `${title} reported at ${location}. ${description.slice(0, 120)}${description.length > 120 ? '...' : ''}`;
    const reason = matchedMongoDeptName
        ? `Categorized under "${matchedMongoDeptName}" based on context keywords (${matchedSignal?.keywords.filter(k => text.includes(k)).slice(0, 3).join(", ") || "content"}). ${priorityReason}.`
        : `Could not confidently match active campus departments for this issue. Requires manual admin assignment.`;

    return {
        issueType: issueType,
        priority: priority,
        department: matchedMongoDeptName,
        summary: summary,
        reason: reason,
        confidence: Number(confidence.toFixed(2))
    };
}

/**
 * Main AI Complaint Analyzer
 * Invokes Gemini API if available, falls back to heuristic engine.
 */
async function analyzeComplaint({ title, description, location, availableDepartments = [] }) {
    const apiKey = process.env.GEMINI_API_KEY;

    // List of active department names to guide the AI
    const deptNames = availableDepartments.map(d => d.name);

    if (!apiKey) {
        // Run heuristic classifier when no Gemini key is provided
        return heuristicClassifyComplaint({ title, description, location, availableDepartments });
    }

    try {
        const systemPrompt = `
You are an expert Campus Grievance AI Triage Agent for CampusResolve.
Your task is to analyze a student's complaint and output a structured JSON classification for automatic department routing.

Available Active Departments in MongoDB:
${deptNames.length > 0 ? deptNames.map(d => `- "${d}"`).join("\n") : "No specific departments provided"}

Instructions:
1. "issueType": A specific title for the grievance (e.g. "Wi-Fi & Network Connectivity", "Room Electrical Hazard", "Dining Hygiene", etc.).
2. "priority": Exactly one of ["Low", "Medium", "High", "Critical"].
   - "Critical": Physical safety hazard, electrical shock, fire risk, anti-ragging, extreme emergency.
   - "High": Major disruption affecting multiple students (whole floor Wi-Fi down, water supply halted, door lock broken).
   - "Medium": Standard single-user operational issue (slow speed, light bulb fused, food taste issue).
   - "Low": Minor inconvenience, suggestion, cosmetic defect.
3. "department": Must STRICTLY be selected from the Available Active Departments list above, matching the exact spelling. If NO available department is suitable or if the issue is ambiguous, return null.
4. "summary": A concise 1-2 sentence executive summary of the issue.
5. "reason": Clear rationale explaining why this department and priority were chosen.
6. "confidence": A floating point number between 0.0 and 1.0 representing your classification confidence.

You MUST reply with valid JSON only, without any markdown code fences, comments, or extra text.
Format:
{
  "issueType": "string",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "department": "Department Name" | null,
  "summary": "string",
  "reason": "string",
  "confidence": 0.95
}
`;

        const userPrompt = `
Student Complaint:
- Title: ${title}
- Location: ${location}
- Description: ${description}
`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userPrompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.95,
                    maxOutputTokens: 500,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn("Gemini Complaint Agent API call returned error, falling back to heuristic engine:", errText);
            return heuristicClassifyComplaint({ title, description, location, availableDepartments });
        }

        const data = await response.json();
        const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawReply) {
            return heuristicClassifyComplaint({ title, description, location, availableDepartments });
        }

        // Clean any markdown formatting if present
        let cleanedJson = rawReply.trim();
        if (cleanedJson.startsWith("```json")) {
            cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        } else if (cleanedJson.startsWith("```")) {
            cleanedJson = cleanedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(cleanedJson);

        // Sanitize and validate fields
        const validPriorities = ["Low", "Medium", "High", "Critical"];
        const priority = validPriorities.includes(parsed.priority) ? parsed.priority : "Medium";
        const confidence = typeof parsed.confidence === "number" ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.8;

        // Verify department exists in available departments
        let matchedDept = null;
        if (parsed.department) {
            const found = availableDepartments.find(
                d => d.name.toLowerCase().trim() === parsed.department.toLowerCase().trim()
            );
            if (found) {
                matchedDept = found.name;
            }
        }

        return {
            issueType: parsed.issueType || "Campus Grievance",
            priority: priority,
            department: matchedDept,
            summary: parsed.summary || `${title} at ${location}`,
            reason: parsed.reason || "Automated AI triage analysis.",
            confidence: Number(confidence.toFixed(2))
        };

    } catch (error) {
        console.error("Gemini Complaint Agent Error:", error.message);
        return heuristicClassifyComplaint({ title, description, location, availableDepartments });
    }
}

module.exports = {
    analyzeComplaint,
    heuristicClassifyComplaint
};
