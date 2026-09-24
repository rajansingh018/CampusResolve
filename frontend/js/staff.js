// =======================================================
// CampusResolve - Department Staff Dashboard JS
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
    window.location.href = "login.html";
}

let user = null;
let college = null;

try {
    user = JSON.parse(userData);
    college = JSON.parse(collegeData);
} catch (e) {
    localStorage.clear();
    window.location.href = "login.html";
}

// Role authorization guard
if (user.role !== "department_staff") {
    alert("Department Staff access required.");
    window.location.href = user.role === "admin" ? "admin.html" : "dashboard.html";
}

// Apply college theme
if (college) {
    document.documentElement.style.setProperty(
        "--college-primary",
        college.primaryColor || "#1e3a8a"
    );
    document.documentElement.style.setProperty(
        "--college-secondary",
        college.secondaryColor || "#0ea5e9"
    );

    const nameEl = document.getElementById("collegeName");
    if (nameEl) nameEl.textContent = college.name;

    const logoEl = document.getElementById("collegeLogo");
    if (logoEl && college.logo) {
        logoEl.innerHTML = `<img src="${college.logo}" alt="${college.name}" onerror="this.style.display='none'">`;
    }
}

// Staff user details
if (user) {
    const staffNameEl = document.getElementById("staffName");
    if (staffNameEl) staffNameEl.textContent = user.name;

    const deptBadge = document.getElementById("staffDeptBadge");
    if (deptBadge) {
        deptBadge.textContent = user.department?.name ? `🏢 ${user.department.name}` : "🏢 Department";
    }
}

let complaints = [];
let currentFilter = "All";
let activeTargetComplaintId = null;
let activeTargetStatus = null;

// =======================================================
// Load Department Complaints
// =======================================================
async function loadComplaints() {
    const container = document.getElementById("complaintsContainer");
    container.innerHTML = `
        <div class="empty-state">
            <div class="icon">⏳</div>
            <h3>Loading department complaints...</h3>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/staff/complaints`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load complaints.");
        }

        complaints = data;
        updateStatistics();
        renderComplaints();

    } catch (err) {
        console.error("Fetch complaints error:", err);
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <h3>Failed to load complaints</h3>
                <p>${err.message}</p>
                <button class="btn btn-primary" onclick="loadComplaints()" style="margin-top:12px;">Try Again</button>
            </div>
        `;
    }
}

// =======================================================
// Statistics KPIs
// =======================================================
function updateStatistics() {
    const total = complaints.length;
    const review = complaints.filter(c => c.status === "Under Review").length;
    const progress = complaints.filter(c => c.status === "In Progress").length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statReview").textContent = review;
    document.getElementById("statProgress").textContent = progress;
    document.getElementById("statResolved").textContent = resolved;
}

// =======================================================
// Render Complaints List
// =======================================================
function renderComplaints() {
    const container = document.getElementById("complaintsContainer");

    const filtered = currentFilter === "All"
        ? complaints
        : complaints.filter(c => c.status === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <h3>No complaints found</h3>
                <p>No complaints match the filter "${currentFilter}".</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    filtered.forEach(c => {
        const card = document.createElement("div");
        card.className = "complaint-card";

        const statusClass = getStatusClass(c.status);
        const priorityClass = getPriorityClass(c.priority);
        const student = c.student || {};

        card.innerHTML = `
            <div class="complaint-header">
                <div>
                    <div class="complaint-title">${escapeHTML(c.title)}</div>
                    <div class="complaint-meta">
                        <span>📍 ${escapeHTML(c.location)}</span>
                        <span>•</span>
                        <span>📅 ${formatDate(c.createdAt)}</span>
                        <span>•</span>
                        <span class="priority-badge ${priorityClass}">⚡ ${c.priority} Priority</span>
                    </div>
                </div>
                <div class="status-badge ${statusClass}">
                    ${escapeHTML(c.status)}
                </div>
            </div>

            <!-- Student Info -->
            <div class="student-bar">
                <span>Student: <strong>${escapeHTML(student.name || "Student")}</strong></span>
                <span>ID: <strong>${escapeHTML(student.studentId || "N/A")}</strong></span>
                <span>Email: <strong>${escapeHTML(student.email || "N/A")}</strong></span>
            </div>

            <!-- AI Insights -->
            <div class="ai-triage-box">
                <div class="ai-triage-header">
                    <span class="ai-triage-title">🤖 AI Triage Analysis: ${escapeHTML(c.issueType || "Campus Issue")}</span>
                    <span class="ai-confidence-pill">${Math.round((c.aiConfidence || 0.8) * 100)}% Confidence</span>
                </div>
                <div class="ai-summary-text"><strong>Summary:</strong> ${escapeHTML(c.aiSummary || c.title)}</div>
                ${c.aiReason ? `<div class="ai-reason-text"><strong>Rationale:</strong> ${escapeHTML(c.aiReason)}</div>` : ""}
            </div>

            <!-- Complaint Body -->
            <div class="complaint-body">
                ${escapeHTML(c.description)}
            </div>

            <!-- Photos Section -->
            <div class="photos-row">
                ${c.problemImage ? `
                    <div class="photo-block">
                        <label>📷 Student Proof:</label>
                        <img src="${escapeHTML(c.problemImage)}" class="photo-thumb" alt="Problem Photo" onclick="previewPhoto('${escapeHTML(c.problemImage)}')">
                    </div>
                ` : ""}

                ${c.resolutionImage ? `
                    <div class="photo-block">
                        <label>✅ Resolution Proof:</label>
                        <img src="${escapeHTML(c.resolutionImage)}" class="photo-thumb" alt="Resolution Photo" onclick="previewPhoto('${escapeHTML(c.resolutionImage)}')">
                    </div>
                ` : ""}
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
                ${getActionButtons(c)}
            </div>
        `;

        container.appendChild(card);
    });
}

function getActionButtons(complaint) {
    const status = complaint.status;
    const id = complaint._id;
    let buttons = "";

    if (status === "Reported") {
        buttons += `
            <button class="btn btn-primary" onclick="updateStatusDirect('${id}', 'Under Review')">
                🔍 Accept & Review
            </button>
        `;
    }

    if (status === "Under Review") {
        buttons += `
            <button class="btn btn-primary" onclick="openStatusModal('${id}', 'In Progress')">
                🛠️ Start Work (In Progress)
            </button>
        `;
    }

    if (status === "In Progress" || status === "Under Review") {
        buttons += `
            <button class="btn btn-success" onclick="openResolveModal('${id}')">
                ✓ Mark Resolved
            </button>
        `;
    }

    if (status !== "Resolved" && status !== "Rejected") {
        buttons += `
            <button class="btn btn-danger" onclick="openStatusModal('${id}', 'Rejected')">
                ✕ Reject
            </button>
        `;
    }

    if (status === "Resolved") {
        buttons += `
            <span style="font-size:13px; color:#166534; font-weight:600;">
                ✓ Completed & Resolved
            </span>
        `;
    }

    if (status === "Rejected") {
        buttons += `
            <span style="font-size:13px; color:#991b1b; font-weight:600;">
                ✕ Complaint Rejected
            </span>
        `;
    }

    return buttons;
}

// =======================================================
// Status Update Handlers
// =======================================================
async function updateStatusDirect(complaintId, status) {
    try {
        const response = await fetch(`${API_URL}/staff/complaints/${complaintId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Update failed.");

        // Update local complaint
        const idx = complaints.findIndex(c => c._id === complaintId);
        if (idx !== -1) complaints[idx] = data.complaint;

        updateStatistics();
        renderComplaints();
    } catch (err) {
        alert(err.message || "Failed to update complaint status.");
    }
}

// Modals: Status Remarks Modal
function openStatusModal(complaintId, targetStatus) {
    activeTargetComplaintId = complaintId;
    activeTargetStatus = targetStatus;

    document.getElementById("statusModalTitle").textContent =
        targetStatus === "In Progress" ? "🛠️ Start Work / Add Notes" : "✕ Reject Complaint";
    document.getElementById("statusRemarks").value = "";
    document.getElementById("statusModal").style.display = "flex";
}

function closeStatusModal() {
    document.getElementById("statusModal").style.display = "none";
    activeTargetComplaintId = null;
    activeTargetStatus = null;
}

document.getElementById("statusForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const remarks = document.getElementById("statusRemarks").value;
    const btn = document.getElementById("statusSubmitBtn");

    btn.disabled = true;
    btn.textContent = "Updating...";

    try {
        const response = await fetch(`${API_URL}/staff/complaints/${activeTargetComplaintId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                status: activeTargetStatus,
                remarks
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Update failed.");

        const idx = complaints.findIndex(c => c._id === activeTargetComplaintId);
        if (idx !== -1) complaints[idx] = data.complaint;

        closeStatusModal();
        updateStatistics();
        renderComplaints();
    } catch (err) {
        alert(err.message || "Error updating status.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Confirm Status Update";
    }
});

// Modals: Resolve Modal (with resolution photo upload)
function openResolveModal(complaintId) {
    activeTargetComplaintId = complaintId;
    document.getElementById("resolvePhoto").value = "";
    document.getElementById("resolveRemarks").value = "";
    document.getElementById("resolveModal").style.display = "flex";
}

function closeResolveModal() {
    document.getElementById("resolveModal").style.display = "none";
    activeTargetComplaintId = null;
}

document.getElementById("resolveForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const photoInput = document.getElementById("resolvePhoto");
    const remarks = document.getElementById("resolveRemarks").value;
    const btn = document.getElementById("resolveSubmitBtn");

    if (!photoInput.files || photoInput.files.length === 0) {
        alert("Please upload a resolution proof photo.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Uploading Proof & Resolving...";

    const formData = new FormData();
    formData.append("status", "Resolved");
    formData.append("remarks", remarks);
    formData.append("resolutionImage", photoInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/staff/complaints/${activeTargetComplaintId}/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Resolution upload failed.");

        const idx = complaints.findIndex(c => c._id === activeTargetComplaintId);
        if (idx !== -1) complaints[idx] = data.complaint;

        closeResolveModal();
        updateStatistics();
        renderComplaints();
        alert("Complaint marked as resolved successfully! 🎉");
    } catch (err) {
        alert(err.message || "Failed to resolve complaint.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Upload Proof & Resolve ✓";
    }
});

// Modal: Image Preview
function previewPhoto(url) {
    document.getElementById("photoModalImg").src = url;
    document.getElementById("photoModal").style.display = "flex";
}

function closePhotoModal() {
    document.getElementById("photoModal").style.display = "none";
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderComplaints();
    });
});

// =======================================================
// Notifications
// =======================================================
let notifications = [];

async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        notifications = await response.json();
        renderNotifications();
    } catch (e) {
        console.error("Notifications fetch error:", e);
    }
}

function renderNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");
    const countEl = document.getElementById("notificationCount");

    const unread = notifications.filter(n => !n.isRead).length;

    if (unread > 0) {
        badge.textContent = unread > 9 ? "9+" : unread;
        badge.classList.remove("hidden");
        countEl.textContent = `${unread} new notification${unread > 1 ? "s" : ""}`;
    } else {
        badge.classList.add("hidden");
        countEl.textContent = "No new notifications";
    }

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                🔔
                <p>No notifications yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${!n.isRead ? "unread" : ""} ${n.type || "info"}" onclick="markNotificationRead('${n._id}')">
            <div class="notification-icon">${getNotificationIcon(n.type)}</div>
            <div class="notification-content">
                <div class="notification-title">${escapeHTML(n.title)}</div>
                <div class="notification-message">${escapeHTML(n.message)}</div>
                <div class="notification-time">${formatDate(n.createdAt)}</div>
            </div>
            ${!n.isRead ? `<span class="notification-dot"></span>` : ""}
        </div>
    `).join("");
}

function getNotificationIcon(type) {
    if (type === "complaint") return "📋";
    if (type === "success") return "✓";
    if (type === "warning") return "⚠️";
    return "ℹ️";
}

async function markNotificationRead(id) {
    try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });
        const n = notifications.find(x => x._id === id);
        if (n) n.isRead = true;
        renderNotifications();
    } catch (e) {
        console.error("Mark read error:", e);
    }
}

document.getElementById("notificationBtn").addEventListener("click", () => {
    document.getElementById("notificationPanel").classList.toggle("show");
});

document.addEventListener("click", (e) => {
    const wrapper = document.querySelector(".notification-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById("notificationPanel").classList.remove("show");
    }
});

document.getElementById("markAllReadBtn").addEventListener("click", async () => {
    try {
        await fetch(`${API_URL}/notifications/read-all`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });
        notifications.forEach(n => n.isRead = true);
        renderNotifications();
    } catch (e) {
        console.error("Mark all read error:", e);
    }
});

// =======================================================
// Helper Utilities
// =======================================================
function getStatusClass(status) {
    switch (status) {
        case "Reported": return "status-reported";
        case "Under Review": return "status-under-review";
        case "In Progress": return "status-in-progress";
        case "Resolved": return "status-resolved";
        case "Rejected": return "status-rejected";
        default: return "";
    }
}

function getPriorityClass(priority) {
    switch (priority) {
        case "Critical": return "priority-critical";
        case "High": return "priority-high";
        case "Medium": return "priority-medium";
        case "Low": return "priority-low";
        default: return "priority-medium";
    }
}

function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCollege");
    window.location.href = "index.html";
}

// Initialize
loadComplaints();
loadNotifications();
