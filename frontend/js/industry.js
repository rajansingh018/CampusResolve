// =======================================================
// CampusResolve - Industry Partner Portal Client
// =======================================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5002/api"
        : "https://campus-resolve-backend.vercel.app/api";

const token = localStorage.getItem("token");
const userData = localStorage.getItem("user");

if (!token || !userData) {
    window.location.href = "login.html";
}

const user = JSON.parse(userData);

if (user.role !== "industry") {
    alert("Industry partner account required.");
    window.location.href = "login.html";
}

// Update Topbar Badge
document.getElementById("companyNameBadge").textContent = user.companyName || user.name;
document.getElementById("companyCategoryBadge").textContent = user.industryCategory || "Industry Partner";
document.getElementById("topbarHeading").textContent = `Welcome, ${user.companyName || user.name} 👋`;

let opportunities = [];
let proposals = [];
let collaborations = [];

// =====================================
// TAB SWITCHING
// =====================================

function switchTab(tabId, btn) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".sidebar .nav-item").forEach(n => n.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add("active");
    if (btn) btn.classList.add("active");

    if (tabId === "opportunitiesTab") loadOpportunities();
    else if (tabId === "proposalsTab") loadProposals();
    else if (tabId === "collaborationsTab") loadCollaborations();
    else if (tabId === "completedTab") loadCompletedProjects();
    else if (tabId === "profileTab") loadProfile();
}

// =====================================
// LOAD METRICS & DASHBOARD
// =====================================

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/industry/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById("statAvailable").textContent = data.availableChallenges || 0;
            document.getElementById("statProposals").textContent = data.myProposals || 0;
            document.getElementById("statActive").textContent = data.activeCollaborations || 0;
            document.getElementById("statCompleted").textContent = data.completedCollaborations || 0;
        }
    } catch (err) {
        console.error("Stats error:", err);
    }
}

// =====================================
// LOAD OPPORTUNITIES
// =====================================

async function loadOpportunities() {
    const container = document.getElementById("opportunitiesContainer");
    const dashContainer = document.getElementById("dashOpportunitiesContainer");

    try {
        const res = await fetch(`${API_URL}/industry/challenges`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load opportunities.");

        opportunities = data;
        renderOpportunities(opportunities, container);

        // Also render top 3 for dashboard
        if (dashContainer) {
            renderOpportunities(opportunities.slice(0, 3), dashContainer);
        }
    } catch (err) {
        console.error("Opportunities error:", err);
        if (container) container.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
        if (dashContainer) dashContainer.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
    }
}

function renderOpportunities(list, targetElement) {
    if (!targetElement) return;

    if (list.length === 0) {
        targetElement.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No active challenge opportunities found</h4>
                <p style="font-size: 13px; color: #64748b;">Universities post new challenges when external industry collaboration is required.</p>
            </div>
        `;
        return;
    }

    targetElement.innerHTML = list.map(opp => {
        const hasProposed = Boolean(opp.hasProposed);
        const matchPct = opp.matchScore || 0;

        return `
            <div class="opp-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <span class="category-tag">${escapeHTML(opp.category)}</span>
                        ${matchPct > 0 ? `<span class="match-score-badge">🎯 ${matchPct}% Match</span>` : ''}
                    </div>

                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.35;">${escapeHTML(opp.title)}</h3>
                    
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                        <span>🏛️ ${escapeHTML(opp.college?.name || "Partner University")}</span>
                        <span>•</span>
                        <span>📍 ${escapeHTML(opp.location)}</span>
                    </div>

                    <p style="font-size: 13px; color: #475569; line-height: 1.45; margin-bottom: 14px;">${escapeHTML(opp.description)}</p>

                    ${opp.collaborationRequirements?.expectedOutcome ? `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 12px;">
                            <strong style="color: #0f172a; display: block; margin-bottom: 2px;">Expected Solution:</strong>
                            <span style="color: #475569;">${escapeHTML(opp.collaborationRequirements.expectedOutcome)}</span>
                            <div style="margin-top: 6px; color: #64748b;">
                                ⏱️ Timeline: <strong>${opp.collaborationRequirements.timelineMonths || 3} months</strong> • 💰 Budget: <strong>${escapeHTML(opp.collaborationRequirements.estimatedBudget || "Supported")}</strong>
                            </div>
                        </div>
                    ` : ""}

                    ${opp.requiredExpertise && opp.requiredExpertise.length > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px;">
                            ${opp.requiredExpertise.map(e => `<span class="skill-tag">${escapeHTML(e)}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: #64748b;">❤️ <strong>${opp.supportCount || 0}</strong> student votes</span>

                    ${hasProposed ? `
                        <span style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                            ✓ Proposal Submitted (${escapeHTML(opp.myProposalStatus || "Review")})
                        </span>
                    ` : `
                        <button type="button" class="btn-primary" onclick="openProposalModal('${opp._id}', '${escapeHTML(opp.title)}')">
                            Submit Proposal →
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join("");
}

function filterOpportunities() {
    const search = (document.getElementById("oppSearch")?.value || "").toLowerCase().trim();
    const cat = document.getElementById("oppCategoryFilter")?.value || "All";

    const filtered = opportunities.filter(opp => {
        if (cat !== "All" && opp.category !== cat) return false;
        if (search) {
            const t = (opp.title || "").toLowerCase();
            const d = (opp.description || "").toLowerCase();
            const exp = (opp.requiredExpertise || []).some(e => e.toLowerCase().includes(search));
            if (!t.includes(search) && !d.includes(search) && !exp) return false;
        }
        return true;
    });

    renderOpportunities(filtered, document.getElementById("opportunitiesContainer"));
}

// =====================================
// PROPOSAL SUBMISSION MODAL
// =====================================

function openProposalModal(challengeId, challengeTitle) {
    document.getElementById("propChallengeId").value = challengeId;
    document.getElementById("propChallengeTitle").textContent = challengeTitle;
    document.getElementById("proposalForm").reset();
    document.getElementById("proposalModal").style.display = "flex";
}

function closeProposalModal() {
    document.getElementById("proposalModal").style.display = "none";
}

document.getElementById("proposalForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const challengeId = document.getElementById("propChallengeId").value;
    const solution = document.getElementById("propSolution").value.trim();
    const approach = document.getElementById("propApproach").value.trim();
    const timeline = document.getElementById("propTimeline").value.trim();
    const cost = document.getElementById("propCost").value.trim();
    const impact = document.getElementById("propImpact").value.trim();
    const resources = document.getElementById("propResources").value.trim();
    const fileInput = document.getElementById("propDoc");
    const submitBtn = document.getElementById("propSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Proposal...";

    try {
        const formData = new FormData();
        formData.append("proposedSolution", solution);
        formData.append("implementationApproach", approach);
        formData.append("estimatedTimeline", timeline);
        formData.append("estimatedCost", cost);
        formData.append("expectedImpact", impact);
        formData.append("requiredResources", resources);
        if (fileInput.files[0]) formData.append("supportingDocument", fileInput.files[0]);

        const res = await fetch(`${API_URL}/industry/challenges/${challengeId}/proposals`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to submit proposal.");

        closeProposalModal();
        alert("Solution proposal submitted successfully to the university! 🎉");
        await loadStats();
        await loadOpportunities();
    } catch (err) {
        alert(err.message || "Error submitting proposal.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Proposal 🚀";
    }
});

// =====================================
// LOAD MY PROPOSALS
// =====================================

async function loadProposals() {
    const container = document.getElementById("proposalsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/industry/proposals`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load proposals.");

        proposals = data;
        renderProposalsTable(proposals, container);
    } catch (err) {
        console.error("Proposals error:", err);
        container.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
    }
}

function renderProposalsTable(list, container) {
    if (list.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No proposals submitted yet</h4>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Browse available challenges and submit solutions.</p>
                <button class="btn-primary" onclick="switchTab('opportunitiesTab', document.querySelector('[data-tab=opportunitiesTab]'))">
                    Browse Available Challenges →
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Challenge Title</th>
                    <th>University / College</th>
                    <th>Proposed Solution</th>
                    <th>Timeline</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(p => `
                    <tr>
                        <td>
                            <strong style="color: #0f172a;">${escapeHTML(p.challenge?.title || "Challenge")}</strong>
                            <div style="font-size: 11px; color: #64748b;">${escapeHTML(p.challenge?.category || "")}</div>
                        </td>
                        <td>${escapeHTML(p.challenge?.college?.name || "University")}</td>
                        <td>
                            <div style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${escapeHTML(p.proposedSolution)}
                            </div>
                        </td>
                        <td>${escapeHTML(p.estimatedTimeline)}</td>
                        <td>
                            <span style="padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 11px; ${getProposalStatusStyle(p.status)}">
                                ${escapeHTML(p.status)}
                            </span>
                        </td>
                        <td>${new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function getProposalStatusStyle(status) {
    switch (status) {
        case "Submitted": return "background: #f1f5f9; color: #475569;";
        case "Under Review": return "background: #fef3c7; color: #92400e;";
        case "Accepted": return "background: #dcfce7; color: #166534;";
        case "Rejected": return "background: #fee2e2; color: #991b1b;";
        default: return "background: #f1f5f9; color: #475569;";
    }
}

// =====================================
// LOAD ACTIVE COLLABORATIONS
// =====================================

async function loadCollaborations() {
    const container = document.getElementById("collaborationsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/industry/collaborations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load collaborations.");

        collaborations = data;
        const activeList = collaborations.filter(c => c.status !== "Completed" && c.status !== "Cancelled");
        renderCollaborations(activeList, container);
    } catch (err) {
        console.error("Collaborations error:", err);
        container.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
    }
}

function renderCollaborations(list, container) {
    if (list.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">⚙️</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No active collaboration projects</h4>
                <p style="font-size: 13px; color: #64748b;">Active projects appear here when a university accepts your proposal.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(collab => {
        const lastUpdate = (collab.progressUpdates || []).slice(-1)[0] || { percentage: 0 };

        return `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 700; background: #ede9fe; color: #5b21b6; padding: 2px 8px; border-radius: 10px;">
                            ${escapeHTML(collab.status)}
                        </span>
                        <h3 style="font-size: 18px; color: #0f172a; margin: 6px 0 2px 0;">${escapeHTML(collab.title)}</h3>
                        <div style="font-size: 12px; color: #64748b;">🏛️ ${escapeHTML(collab.college?.name || "University Partner")} • Started ${new Date(collab.startDate).toLocaleDateString("en-IN")}</div>
                    </div>

                    <button class="btn-primary" onclick="openProgressModal('${collab._id}')">
                        + Post Progress Update
                    </button>
                </div>

                <div style="margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #334155;">
                        <span>Implementation Progress</span>
                        <span>${lastUpdate.percentage || 0}% Complete</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${lastUpdate.percentage || 0}%;"></div>
                    </div>
                </div>

                ${collab.progressUpdates && collab.progressUpdates.length > 0 ? `
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 14px;">
                        <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 8px;">Milestone History:</strong>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${collab.progressUpdates.map(u => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 12px;">
                                    <div style="display: flex; justify-content: space-between; font-weight: 600; color: #0f172a;">
                                        <span>${escapeHTML(u.title)}</span>
                                        <span style="color: #0f766e;">${u.percentage}%</span>
                                    </div>
                                    <p style="margin: 4px 0 0 0; color: #475569;">${escapeHTML(u.description)}</p>
                                    <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${new Date(u.createdAt).toLocaleString("en-IN")} • ${u.isPublic ? '🌐 Public to Students' : '🔒 Internal Admin Note'}</div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

// =====================================
// POST PROGRESS MODAL
// =====================================

function openProgressModal(collabId) {
    document.getElementById("progCollabId").value = collabId;
    document.getElementById("progressForm").reset();
    document.getElementById("progressModal").style.display = "flex";
}

function closeProgressModal() {
    document.getElementById("progressModal").style.display = "none";
}

document.getElementById("progressForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const collabId = document.getElementById("progCollabId").value;
    const title = document.getElementById("progTitle").value.trim();
    const percent = document.getElementById("progPercent").value;
    const isPublic = document.getElementById("progPublic").value;
    const desc = document.getElementById("progDesc").value.trim();
    const submitBtn = document.getElementById("progSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("percentage", percent);
        formData.append("isPublic", isPublic);
        formData.append("description", desc);

        const res = await fetch(`${API_URL}/industry/collaborations/${collabId}/updates`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to post update.");

        closeProgressModal();
        alert("Milestone progress update posted successfully! 📢");
        await loadCollaborations();
    } catch (err) {
        alert(err.message || "Error posting progress update.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Post Update";
    }
});

// =====================================
// LOAD COMPLETED PROJECTS
// =====================================

async function loadCompletedProjects() {
    const container = document.getElementById("completedContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/industry/collaborations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load projects.");

        const completedList = data.filter(c => c.status === "Completed");

        if (completedList.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🏆</div>
                    <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No completed projects yet</h4>
                    <p style="font-size: 13px; color: #64748b;">Completed projects with verified SIH impact metrics will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = completedList.map(c => `
            <div style="background: white; border: 1px solid #bbf7d0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">
                            ✓ Completed & Impact Verified
                        </span>
                        <h3 style="font-size: 18px; color: #0f172a; margin: 6px 0 2px 0;">${escapeHTML(c.title)}</h3>
                        <div style="font-size: 12px; color: #64748b;">🏛️ ${escapeHTML(c.college?.name || "University Partner")}</div>
                    </div>
                </div>

                <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                    ${escapeHTML(c.finalSolution?.summary || "Successfully implemented solution addressing campus problem.")}
                </p>

                <div class="impact-grid">
                    ${c.impact?.studentsBenefited ? `<div class="impact-card"><span class="val">${c.impact.studentsBenefited}+</span><span class="lbl">Students Impacted</span></div>` : ""}
                    ${c.impact?.energySaved ? `<div class="impact-card"><span class="val">${escapeHTML(c.impact.energySaved)}</span><span class="lbl">Energy Saved</span></div>` : ""}
                    ${c.impact?.waterSaved ? `<div class="impact-card"><span class="val">${escapeHTML(c.impact.waterSaved)}</span><span class="lbl">Water Saved</span></div>` : ""}
                    ${c.impact?.wasteReduced ? `<div class="impact-card"><span class="val">${escapeHTML(c.impact.wasteReduced)}</span><span class="lbl">Waste Diverted</span></div>` : ""}
                    ${c.impact?.costSavings ? `<div class="impact-card"><span class="val">${escapeHTML(c.impact.costSavings)}</span><span class="lbl">Cost Savings</span></div>` : ""}
                    ${c.impact?.timeSaved ? `<div class="impact-card"><span class="val">${escapeHTML(c.impact.timeSaved)}</span><span class="lbl">Time Saved</span></div>` : ""}
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Completed error:", err);
    }
}

// =====================================
// LOAD & SAVE PROFILE
// =====================================

async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/industry/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById("profCompanyName").value = data.companyName || "";
            document.getElementById("profCategory").value = data.industryCategory || "Information Technology";
            document.getElementById("profWebsite").value = data.website || "";
            document.getElementById("profExpertise").value = (data.expertise || []).join(", ");
            document.getElementById("profContactName").value = data.name || "";
            document.getElementById("profPhone").value = data.phone || "";
            document.getElementById("profDescription").value = data.description || "";
        }
    } catch (err) {
        console.error("Load profile error:", err);
    }
}

document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const companyName = document.getElementById("profCompanyName").value.trim();
    const industryCategory = document.getElementById("profCategory").value;
    const website = document.getElementById("profWebsite").value.trim();
    const expertise = document.getElementById("profExpertise").value.trim();
    const name = document.getElementById("profContactName").value.trim();
    const phone = document.getElementById("profPhone").value.trim();
    const description = document.getElementById("profDescription").value.trim();
    const btn = document.getElementById("profSaveBtn");

    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        const res = await fetch(`${API_URL}/industry/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ companyName, industryCategory, website, expertise, name, phone, description })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update profile.");

        localStorage.setItem("user", JSON.stringify({ ...user, ...data.user }));
        document.getElementById("companyNameBadge").textContent = data.user.companyName;
        document.getElementById("companyCategoryBadge").textContent = data.user.industryCategory;

        alert("Profile updated successfully! 🎉");
    } catch (err) {
        alert(err.message || "Error updating profile.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Profile";
    }
});

// Utilities
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("demoUser");
    window.location.href = "login.html";
}

// Notifications
let notifications = [];
async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        notifications = await res.json();
        renderNotifications();
    } catch (e) {
        console.error("Notifs error:", e);
    }
}

function renderNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");
    const countEl = document.getElementById("notificationCount");
    if (!list || !badge) return;

    const unread = notifications.filter(n => !n.isRead).length;
    if (unread > 0) {
        badge.textContent = unread > 9 ? "9+" : unread;
        badge.classList.remove("hidden");
        if (countEl) countEl.textContent = `${unread} new notification${unread > 1 ? "s" : ""}`;
    } else {
        badge.classList.add("hidden");
        if (countEl) countEl.textContent = "No new notifications";
    }

    if (notifications.length === 0) {
        list.innerHTML = `<div class="notification-empty">🔔<p>No notifications yet.</p></div>`;
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${!n.isRead ? 'unread' : ''}">
            <div class="notification-icon">🔔</div>
            <div class="notification-content">
                <div class="notification-title">${escapeHTML(n.title)}</div>
                <div class="notification-message">${escapeHTML(n.message)}</div>
            </div>
        </div>
    `).join("");
}

document.getElementById("notificationBtn")?.addEventListener("click", () => {
    document.getElementById("notificationPanel")?.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    const wrapper = document.querySelector(".notification-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById("notificationPanel")?.classList.remove("show");
    }
});

// Initialize
loadStats();
loadOpportunities();
loadNotifications();
