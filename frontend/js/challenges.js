// =======================================================
// CampusResolve - Student & Campus Challenges Client
// =======================================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5002/api"
        : "https://campus-resolve-backend.vercel.app/api";

const token = localStorage.getItem("token");
const userData = localStorage.getItem("user");
const collegeData = localStorage.getItem("selectedCollege");

if (!token || !userData || !collegeData) {
    window.location.href = "index.html";
}

const user = JSON.parse(userData);
const college = JSON.parse(collegeData);

// Apply Theme
document.documentElement.style.setProperty("--college-primary", college.primaryColor || "#2563eb");
document.documentElement.style.setProperty("--college-secondary", college.secondaryColor || "#7c3aed");

const collegeNameEl = document.getElementById("collegeName");
const collegeLogoEl = document.getElementById("collegeLogo");

if (collegeNameEl) collegeNameEl.textContent = college.name;
if (collegeLogoEl && college.logo) {
    collegeLogoEl.innerHTML = `<img src="${college.logo}" alt="${college.name}" onerror="this.style.display='none'">`;
}

let allChallenges = [];
let activeFilter = "All";

// =====================================
// LOAD CHALLENGES
// =====================================

async function loadChallenges() {
    const container = document.getElementById("challengesContainer");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/challenges`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load challenges.");

        allChallenges = data;
        filterChallenges();
    } catch (err) {
        console.error("Load challenges error:", err);
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px 20px; text-align: center; color: #ef4444;">
                <p>Failed to load campus challenges: ${err.message}</p>
                <button onclick="loadChallenges()" style="margin-top: 10px; padding: 6px 14px; border-radius: 6px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}

// =====================================
// FILTER & SEARCH
// =====================================

function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    filterChallenges();
}

function filterChallenges() {
    const container = document.getElementById("challengesContainer");
    if (!container) return;

    const searchTerm = (document.getElementById("challengeSearch")?.value || "").toLowerCase().trim();

    const filtered = allChallenges.filter(ch => {
        // Status filter
        if (activeFilter === "My") {
            if (ch.createdBy?._id !== user.id && ch.createdBy !== user.id) return false;
        } else if (activeFilter !== "All") {
            if (ch.status !== activeFilter) return false;
        }

        // Search term
        if (searchTerm) {
            const matchTitle = (ch.title || "").toLowerCase().includes(searchTerm);
            const matchDesc = (ch.description || "").toLowerCase().includes(searchTerm);
            const matchLocation = (ch.location || "").toLowerCase().includes(searchTerm);
            const matchCategory = (ch.category || "").toLowerCase().includes(searchTerm);
            const matchExp = (ch.requiredExpertise || []).some(e => e.toLowerCase().includes(searchTerm));
            if (!matchTitle && !matchDesc && !matchLocation && !matchCategory && !matchExp) return false;
        }

        return true;
    });

    renderChallenges(filtered);
}

// =====================================
// RENDER CHALLENGES
// =====================================

function renderChallenges(list) {
    const container = document.getElementById("challengesContainer");
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 50px 20px; background: white; border-radius: 14px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">🚀</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No challenges match your filter</h4>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Be the first to crowdsource a challenge for university-industry collaboration!</p>
                <button class="hero-btn" onclick="openSubmitModal()">+ Submit First Challenge</button>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(ch => {
        const isSupported = Boolean(ch.isSupportedByMe);
        const statusClass = getStatusClass(ch.status);

        return `
            <div class="challenge-card">
                <div>
                    <div class="card-header-row">
                        <span class="category-tag">${escapeHTML(ch.category)}</span>
                        <span class="status-badge-pill ${statusClass}">${getStatusIcon(ch.status)} ${escapeHTML(ch.status)}</span>
                    </div>

                    <h3 class="challenge-title">${escapeHTML(ch.title)}</h3>
                    <div class="challenge-location">📍 ${escapeHTML(ch.location)}</div>

                    <p class="challenge-desc">${escapeHTML(ch.description)}</p>

                    ${ch.requiredExpertise && ch.requiredExpertise.length > 0 ? `
                        <div class="expertise-tags">
                            ${ch.requiredExpertise.map(e => `<span class="skill-tag">${escapeHTML(e)}</span>`).join("")}
                        </div>
                    ` : ""}

                    ${ch.selectedPartner ? `
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 12px; color: #166534; display: flex; align-items: center; gap: 8px;">
                            <span>🤝</span>
                            <span>Partner: <strong>${escapeHTML(ch.selectedPartner.companyName || ch.selectedPartner.name)}</strong></span>
                        </div>
                    ` : ""}
                </div>

                <div class="card-footer">
                    <button type="button" class="upvote-btn ${isSupported ? 'supported' : ''}" onclick="toggleSupport('${ch._id}', this)">
                        <span>${isSupported ? '❤️' : '🤍'}</span>
                        <strong class="vote-count">${ch.supportCount || 0}</strong>
                        <span>Supports</span>
                    </button>

                    <button type="button" class="details-btn" onclick="openDetailModal('${ch._id}')">
                        View Progress & Impact →
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function getStatusClass(status) {
    switch (status) {
        case "Open": return "status-open";
        case "University Validated": return "status-validated";
        case "Seeking Industry Partner": return "status-seeking";
        case "Proposal Received": return "status-proposal";
        case "Partner Selected": return "status-partner";
        case "In Progress": return "status-progress";
        case "Completed": return "status-completed";
        case "Rejected": return "status-rejected";
        default: return "status-open";
    }
}

function getStatusIcon(status) {
    switch (status) {
        case "Open": return "💡";
        case "University Validated": return "🎓";
        case "Seeking Industry Partner": return "🤝";
        case "Proposal Received": return "💼";
        case "Partner Selected": return "👥";
        case "In Progress": return "⚙️";
        case "Completed": return "🏆";
        case "Rejected": return "❌";
        default: return "📌";
    }
}

// =====================================
// SUPPORT / UPVOTE TOGGLE
// =====================================

async function toggleSupport(challengeId, btn) {
    try {
        const response = await fetch(`${API_URL}/challenges/${challengeId}/support`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update support.");

        // Update local object
        const ch = allChallenges.find(c => c._id === challengeId);
        if (ch) {
            ch.isSupportedByMe = data.isSupported;
            ch.supportCount = data.supportCount;
        }

        // Update UI
        const countEl = btn.querySelector(".vote-count");
        if (countEl) countEl.textContent = data.supportCount;

        if (data.isSupported) {
            btn.classList.add("supported");
            btn.querySelector("span").textContent = "❤️";
        } else {
            btn.classList.remove("supported");
            btn.querySelector("span").textContent = "🤍";
        }
    } catch (err) {
        alert(err.message || "Unable to update support.");
    }
}

// =====================================
// SUBMIT CHALLENGE MODAL
// =====================================

function openSubmitModal() {
    document.getElementById("challengeForm").reset();
    document.getElementById("submitChallengeModal").style.display = "flex";
}

function closeSubmitModal() {
    document.getElementById("submitChallengeModal").style.display = "none";
}

document.getElementById("challengeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("chTitle").value.trim();
    const category = document.getElementById("chCategory").value;
    const location = document.getElementById("chLocation").value.trim();
    const expertise = document.getElementById("chExpertise").value.trim();
    const description = document.getElementById("chDescription").value.trim();
    const fileInput = document.getElementById("chImage");
    const submitBtn = document.getElementById("chSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("category", category);
        formData.append("location", location);
        formData.append("description", description);
        if (expertise) formData.append("requiredExpertise", expertise);
        if (fileInput.files[0]) formData.append("supportingImage", fileInput.files[0]);

        const response = await fetch(`${API_URL}/challenges`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to submit challenge.");

        closeSubmitModal();
        alert(data.message || "Challenge submitted successfully! 🎉");
        await loadChallenges();
    } catch (err) {
        alert(err.message || "Error submitting challenge.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Challenge 🚀";
    }
});

// =====================================
// CHALLENGE DETAIL & TIMELINE MODAL
// =====================================

async function openDetailModal(challengeId) {
    const modal = document.getElementById("detailModal");
    const body = document.getElementById("modalBody");
    const titleEl = document.getElementById("modalTitle");
    const catBadge = document.getElementById("modalCategoryBadge");

    body.innerHTML = `<div style="padding: 30px; text-align: center;">⏳ Loading details...</div>`;
    modal.style.display = "flex";

    try {
        const res = await fetch(`${API_URL}/challenges/${challengeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const ch = await res.json();
        if (!res.ok) throw new Error(ch.message || "Failed to fetch details.");

        titleEl.textContent = ch.title;
        catBadge.textContent = ch.category;

        const isCompleted = ch.status === "Completed";
        const hasPartner = Boolean(ch.selectedPartner);

        body.innerHTML = `
            <div style="font-size: 13px; color: #475569; margin-bottom: 18px; line-height: 1.6;">
                <p><strong>Description:</strong> ${escapeHTML(ch.description)}</p>
                <div style="display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap;">
                    <span>📍 <strong>Location:</strong> ${escapeHTML(ch.location)}</span>
                    <span>👤 <strong>Submitted By:</strong> ${escapeHTML(ch.createdBy?.name || "Student")}</span>
                    <span>❤️ <strong>Community Support:</strong> ${ch.supportCount || 0} students</span>
                </div>
            </div>

            ${ch.supportingImage ? `
                <div style="margin-bottom: 20px;">
                    <img src="${ch.supportingImage}" alt="Problem supporting photo" style="max-width: 100%; max-height: 240px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0;">
                </div>
            ` : ""}

            <h4 style="font-size: 15px; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                🔄 University–Industry Collaboration Lifecycle
            </h4>

            <div class="timeline-stepper">
                <div class="timeline-item done">
                    <div class="timeline-title">1. Crowdsourced & Supported by Campus Community</div>
                    <div class="timeline-desc">Submitted by ${escapeHTML(ch.createdBy?.name || "Student")} with ${ch.supportCount || 0} student upvotes.</div>
                </div>

                <div class="timeline-item ${["University Validated", "Seeking Industry Partner", "Proposal Received", "Partner Selected", "In Progress", "Completed"].includes(ch.status) ? 'done' : 'active'}">
                    <div class="timeline-title">2. University Validation</div>
                    <div class="timeline-desc">${ch.validationNotes ? escapeHTML(ch.validationNotes) : 'Reviewed by campus administration.'}</div>
                </div>

                <div class="timeline-item ${["Seeking Industry Partner", "Proposal Received", "Partner Selected", "In Progress", "Completed"].includes(ch.status) ? 'done' : ''}">
                    <div class="timeline-title">3. Industry Partner Sourcing</div>
                    <div class="timeline-desc">
                        ${ch.collaborationRequirements?.expectedOutcome ? `Requirements: ${escapeHTML(ch.collaborationRequirements.expectedOutcome)}` : 'University seeking external technology and specialized industry partners.'}
                    </div>
                </div>

                <div class="timeline-item ${["Partner Selected", "In Progress", "Completed"].includes(ch.status) ? 'done' : ''}">
                    <div class="timeline-title">4. Partner Selected</div>
                    <div class="timeline-desc">
                        ${hasPartner ? `Partner: <strong>${escapeHTML(ch.selectedPartner.companyName || ch.selectedPartner.name)}</strong> (${escapeHTML(ch.selectedPartner.industryCategory || "Industry")})` : 'Awaiting university selection of best proposal.'}
                    </div>
                </div>

                <div class="timeline-item ${isCompleted ? 'done' : (ch.status === 'In Progress' ? 'active' : '')}">
                    <div class="timeline-title">5. Joint Implementation & Progress</div>
                    <div class="timeline-desc">
                        ${ch.collaboration?.progressUpdates && ch.collaboration.progressUpdates.length > 0 ? `
                            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                                ${ch.collaboration.progressUpdates.map(u => `
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 12px;">
                                            <span>${escapeHTML(u.title)}</span>
                                            <span style="color: var(--college-primary);">${u.percentage}%</span>
                                        </div>
                                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">${escapeHTML(u.description)}</p>
                                    </div>
                                `).join("")}
                            </div>
                        ` : 'Active milestones tracked jointly.'}
                    </div>
                </div>
            </div>

            ${isCompleted && (ch.finalSolution?.summary || ch.impact?.studentsBenefited) ? `
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-top: 20px;">
                    <h4 style="font-size: 16px; color: #166534; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        🏆 Verified Solution & SIH Measurable Outcomes
                    </h4>
                    <p style="font-size: 13px; color: #15803d; line-height: 1.5; margin-bottom: 12px;">
                        ${escapeHTML(ch.finalSolution.summary || "This challenge was successfully solved in collaboration with the industry partner.")}
                    </p>

                    ${ch.finalSolution.implementationDetails ? `
                        <p style="font-size: 12px; color: #166534; margin-bottom: 14px;"><strong>Implementation:</strong> ${escapeHTML(ch.finalSolution.implementationDetails)}</p>
                    ` : ""}

                    <div class="impact-grid">
                        ${ch.impact.studentsBenefited ? `
                            <div class="impact-card">
                                <span class="val">${ch.impact.studentsBenefited}+</span>
                                <span class="lbl">Students Impacted</span>
                            </div>
                        ` : ""}
                        ${ch.impact.energySaved ? `
                            <div class="impact-card">
                                <span class="val">${escapeHTML(ch.impact.energySaved)}</span>
                                <span class="lbl">Energy Reduction</span>
                            </div>
                        ` : ""}
                        ${ch.impact.waterSaved ? `
                            <div class="impact-card">
                                <span class="val">${escapeHTML(ch.impact.waterSaved)}</span>
                                <span class="lbl">Water Saved</span>
                            </div>
                        ` : ""}
                        ${ch.impact.wasteReduced ? `
                            <div class="impact-card">
                                <span class="val">${escapeHTML(ch.impact.wasteReduced)}</span>
                                <span class="lbl">Waste Diverted</span>
                            </div>
                        ` : ""}
                        ${ch.impact.costSavings ? `
                            <div class="impact-card">
                                <span class="val">${escapeHTML(ch.impact.costSavings)}</span>
                                <span class="lbl">Cost Savings</span>
                            </div>
                        ` : ""}
                        ${ch.impact.timeSaved ? `
                            <div class="impact-card">
                                <span class="val">${escapeHTML(ch.impact.timeSaved)}</span>
                                <span class="lbl">Efficiency Gain</span>
                            </div>
                        ` : ""}
                    </div>
                </div>
            ` : ""}
        `;

    } catch (err) {
        body.innerHTML = `<p style="color: #ef4444; padding: 20px; text-align: center;">Error: ${err.message}</p>`;
    }
}

function closeDetailModal() {
    document.getElementById("detailModal").style.display = "none";
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("demoUser");
    localStorage.removeItem("selectedCollege");
    window.location.href = "index.html";
}

// Notifications handling
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
    const countText = document.getElementById("notificationCount");
    if (!list || !badge) return;

    const unread = notifications.filter(n => !n.isRead).length;
    if (unread > 0) {
        badge.textContent = unread > 9 ? "9+" : unread;
        badge.classList.remove("hidden");
        if (countText) countText.textContent = `${unread} new notification${unread > 1 ? "s" : ""}`;
    } else {
        badge.classList.add("hidden");
        if (countText) countText.textContent = "No new notifications";
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
loadChallenges();
loadNotifications();
