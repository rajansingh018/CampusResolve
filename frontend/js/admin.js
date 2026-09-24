// =====================================
// CampusResolve Admin Dashboard
// =====================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5002/api"
        : "https://campus-resolve-backend.vercel.app/api";


// =====================================
// Get logged-in admin
// =====================================

const token =
    localStorage.getItem("token");

const userData =
    localStorage.getItem("user");


// =====================================
// Authentication check
// =====================================

if (!token) {

    window.location.href =
        "login.html";

}


// =====================================
// Decode JWT
// =====================================

let adminUser = null;

try {

    adminUser =
        JSON.parse(
            atob(
                token.split(".")[1]
            )
        );

} catch (error) {

    console.error(
        "Invalid token."
    );

    localStorage.removeItem("token");

    window.location.href =
        "login.html";

}


// =====================================
// Admin check
// =====================================

if (
    !adminUser ||
    adminUser.role !== "admin"
) {

    alert(
        "Admin access required."
    );

    window.location.href =
        "dashboard.html";

}


// =====================================
// Get selected college
// =====================================

const collegeData =
    localStorage.getItem(
        "selectedCollege"
    );


if (!collegeData) {

    window.location.href =
        "index.html";

}


let college = null;

try {

    college =
        JSON.parse(collegeData);

} catch (error) {

    console.error(
        "Invalid college data."
    );

    window.location.href =
        "index.html";

}


// =====================================
// Apply college theme
// =====================================

if (college) {

    document.documentElement.style.setProperty(
        "--college-primary",
        college.primaryColor
    );

    document.documentElement.style.setProperty(
        "--college-secondary",
        college.secondaryColor
    );

}


// =====================================
// College information
// =====================================

if (college) {

    const collegeName =
        document.getElementById(
            "collegeName"
        );

    if (collegeName) {

        collegeName.textContent =
            college.name;

    }


    const collegeLogo =
        document.getElementById(
            "collegeLogo"
        );

    if (
        collegeLogo &&
        college.logo
    ) {

        collegeLogo.innerHTML = `

            <img
                src="${college.logo}"
                alt="${college.name}"
                onerror="this.style.display='none'"
            >

        `;

    }

}


// =====================================
// Admin information
// =====================================

if (userData) {

    try {

        const user =
            JSON.parse(userData);


        if (user.name) {

            document.getElementById(
                "adminName"
            ).textContent =
                user.name;

        }

    } catch (error) {

        console.error(
            "Unable to load admin data."
        );

    }

}


// =====================================
// Complaints
// =====================================

let complaints = [];

let currentFilter = "All";


// =====================================
// Load Complaints
// =====================================

async function loadComplaints() {

    const container =
        document.getElementById(
            "complaintsContainer"
        );


    container.innerHTML = `

        <div class="loading-state">

            <div>
                ⏳
            </div>

            <p>
                Loading complaints...
            </p>

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_URL}/admin/complaints`,
                {

                    method: "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load complaints."
            );

        }


        complaints = data;


        // Update dashboard statistics

        updateStatistics();


        // Update analytics

        updateAnalytics();


        // Render complaints

        renderComplaints();


    } catch (error) {

        console.error(
            "Complaint loading error:",
            error
        );


        container.innerHTML = `

            <div class="error-state">

                <div>
                    ⚠️
                </div>

                <h3>
                    Unable to load complaints
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


// =====================================
// Statistics
// =====================================

function updateStatistics() {

    const total =
        complaints.length;


    const review =
        complaints.filter(
            complaint =>
                complaint.status ===
                "Under Review"
        ).length;


    const progress =
        complaints.filter(
            complaint =>
                complaint.status ===
                "In Progress"
        ).length;


    const resolved =
        complaints.filter(
            complaint =>
                complaint.status ===
                "Resolved"
        ).length;


    const totalElement =
        document.getElementById(
            "totalComplaints"
        );

    const reviewElement =
        document.getElementById(
            "reviewComplaints"
        );

    const progressElement =
        document.getElementById(
            "progressComplaints"
        );

    const resolvedElement =
        document.getElementById(
            "resolvedComplaints"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (reviewElement) {

        reviewElement.textContent =
            review;

    }


    if (progressElement) {

        progressElement.textContent =
            progress;

    }


    if (resolvedElement) {

        resolvedElement.textContent =
            resolved;

    }

}


// =====================================
// ANALYTICS
// =====================================

function updateAnalytics() {

    updateAnalyticsSummary();

    renderStatusAnalytics();

    renderCategoryAnalytics();

    renderPriorityAnalytics();

}


// =====================================
// Analytics Summary
// =====================================

function updateAnalyticsSummary() {

    const total =
        complaints.length;


    const resolved =
        complaints.filter(
            complaint =>
                complaint.status ===
                "Resolved"
        );


    const pending =
        complaints.filter(
            complaint =>
                complaint.status !== "Resolved" &&
                complaint.status !== "Rejected"
        );


    const highPriority =
        complaints.filter(
            complaint =>
                complaint.priority === "High" ||
                complaint.priority === "Critical"
        );


    const resolutionRate =
        total === 0
            ? 0
            : Math.round(
                (resolved.length / total) * 100
            );


    const resolutionRateElement =
        document.getElementById(
            "resolutionRate"
        );

    const highPriorityElement =
        document.getElementById(
            "highPriorityCount"
        );

    const pendingElement =
        document.getElementById(
            "pendingCount"
        );

    const avgResolutionElement =
        document.getElementById(
            "avgResolutionTime"
        );


    if (resolutionRateElement) {

        resolutionRateElement.textContent =
            `${resolutionRate}%`;

    }


    if (highPriorityElement) {

        highPriorityElement.textContent =
            highPriority.length;

    }


    if (pendingElement) {

        pendingElement.textContent =
            pending.length;

    }


    if (avgResolutionElement) {

        avgResolutionElement.textContent =
            calculateAverageResolutionTime(
                resolved
            );

    }

}


// =====================================
// Average Resolution Time
// =====================================

function calculateAverageResolutionTime(
    resolvedComplaints
) {

    if (
        resolvedComplaints.length === 0
    ) {

        return "0 days";

    }


    let totalTime = 0;

    let validComplaints = 0;


    resolvedComplaints.forEach(
        complaint => {

            if (
                !complaint.statusHistory ||
                complaint.statusHistory.length === 0
            ) {

                return;

            }


            const resolvedEntry =
                [...complaint.statusHistory]
                    .reverse()
                    .find(
                        history =>
                            history.status ===
                            "Resolved"
                    );


            if (!resolvedEntry) {

                return;

            }


            const created =
                new Date(
                    complaint.createdAt
                );


            const resolved =
                new Date(
                    resolvedEntry.updatedAt
                );


            const difference =
                resolved - created;


            if (
                difference >= 0
            ) {

                totalTime +=
                    difference;

                validComplaints++;

            }

        }
    );


    if (
        validComplaints === 0
    ) {

        return "0 days";

    }


    const average =
        totalTime /
        validComplaints;


    const days =
        average /
        (1000 * 60 * 60 * 24);


    if (
        days < 1
    ) {

        const hours =
            Math.max(
                1,
                Math.round(
                    days * 24
                )
            );

        return `${hours} hrs`;

    }


    return `${days.toFixed(1)} days`;

}


// =====================================
// Status Analytics
// =====================================

function renderStatusAnalytics() {

    const container =
        document.getElementById(
            "statusAnalytics"
        );


    if (!container) {

        return;

    }


    const statuses = [

        "Reported",

        "Under Review",

        "In Progress",

        "Resolved",

        "Rejected"

    ];


    const total =
        complaints.length;


    container.innerHTML =
        statuses.map(
            status => {

                const count =
                    complaints.filter(
                        complaint =>
                            complaint.status ===
                            status
                    ).length;


                const percentage =
                    total === 0
                        ? 0
                        : Math.round(
                            (count / total) * 100
                        );


                return `

                    <div class="status-row">

                        <span class="status-name">
                            ${escapeHTML(status)}
                        </span>

                        <div class="status-bar">

                            <div
                                class="status-bar-fill"
                                style="width:${percentage}%"
                            ></div>

                        </div>

                        <span class="status-count">
                            ${count}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


// =====================================
// Category Analytics
// =====================================

function renderCategoryAnalytics() {

    const container =
        document.getElementById(
            "categoryAnalytics"
        );


    if (!container) {

        return;

    }


    const categoryCounts = {};


    complaints.forEach(
        complaint => {

            const category =
                complaint.category ||
                "Other";


            categoryCounts[category] =
                (
                    categoryCounts[category] ||
                    0
                ) + 1;

        }
    );


    const categories =
        Object.entries(
            categoryCounts
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 6);


    if (
        categories.length === 0
    ) {

        container.innerHTML = `

            <p class="analytics-empty">
                No category data available.
            </p>

        `;

        return;

    }


    const maxCount =
        categories[0][1];


    container.innerHTML =
        categories.map(
            ([category, count]) => {

                const percentage =
                    Math.round(
                        (count / maxCount) * 100
                    );


                return `

                    <div class="category-row">

                        <span
                            class="category-name"
                            title="${escapeHTML(category)}"
                        >
                            ${escapeHTML(category)}
                        </span>

                        <div class="category-bar">

                            <div
                                class="category-bar-fill"
                                style="width:${percentage}%"
                            ></div>

                        </div>

                        <span class="category-count">
                            ${count}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


// =====================================
// Priority Analytics
// =====================================

function renderPriorityAnalytics() {

    const container =
        document.getElementById(
            "priorityAnalytics"
        );


    if (!container) {

        return;

    }


    const priorities = [

        {
            name: "Low",
            className: "low"
        },

        {
            name: "Medium",
            className: "medium"
        },

        {
            name: "High",
            className: "high"
        },

        {
            name: "Critical",
            className: "critical"
        }

    ];


    container.innerHTML =
        priorities.map(
            priority => {

                const count =
                    complaints.filter(
                        complaint =>
                            complaint.priority ===
                            priority.name
                    ).length;


                return `

                    <div
                        class="priority-item ${priority.className}"
                    >

                        <strong>
                            ${count}
                        </strong>

                        <span>
                            ${priority.name}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


// =====================================
// Render Complaints
// =====================================

function renderComplaints() {

    const container =
        document.getElementById(
            "complaintsContainer"
        );


    const unassignedCount = complaints.filter(c => c.requiresManualAssignment || !c.department).length;
    const unassignedBadge = document.getElementById("unassignedCount");
    if (unassignedBadge) {
        unassignedBadge.textContent = unassignedCount;
    }

    const filteredComplaints =
        currentFilter === "All"
            ? complaints
            : currentFilter === "Unassigned"
                ? complaints.filter(c => c.requiresManualAssignment || !c.department)
                : complaints.filter(
                    complaint =>
                        complaint.status ===
                        currentFilter
                );


    if (
        filteredComplaints.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📋
                </div>

                <h3>
                    No complaints found
                </h3>

                <p>
                    There are no complaints
                    matching "${escapeHTML(currentFilter)}".
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    filteredComplaints.forEach(
        complaint => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "complaint-card";


            const statusClass =
                getStatusClass(
                    complaint.status
                );


            const student =
                complaint.student || {};


            card.innerHTML = `

                <div class="complaint-top">

                    <div>

                        <div class="complaint-title">

                            ${escapeHTML(
                                complaint.title
                            )}

                        </div>

                        <div class="complaint-meta">

                            <span style="background:${complaint.department ? '#e0e7ff; color:#3730a3;' : '#fef3c7; color:#92400e;'} font-weight:700; padding:2px 8px; border-radius:10px; font-size:11px;">
                                🏢 ${escapeHTML(complaint.department?.name || "⚠️ Unassigned")}
                            </span>

                            ${complaint.issueType ? `• <span>🏷️ ${escapeHTML(complaint.issueType)}</span>` : ""}

                            •

                            ${escapeHTML(
                                complaint.location
                            )}

                            •

                            ${formatDate(
                                complaint.createdAt
                            )}

                        </div>

                    </div>


                    <div
                        class="status ${statusClass}"
                    >

                        ${escapeHTML(
                            complaint.status
                        )}

                    </div>

                </div>


                <!-- AI Triage Analysis -->
                <div style="background:linear-gradient(135deg, rgba(79,70,229,0.04), rgba(14,165,233,0.04)); border:1px solid rgba(79,70,229,0.15); border-radius:10px; padding:12px 14px; margin:12px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <strong style="font-size:12px; color:#4338ca;">🤖 AI Triage: ${escapeHTML(complaint.issueType || "General Grievance")}</strong>
                        <span style="font-size:11px; font-weight:700; background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:10px;">${Math.round((complaint.aiConfidence || 0.8) * 100)}% Confidence</span>
                    </div>
                    <div style="font-size:12px; color:#334155; margin-bottom:4px;"><strong>Summary:</strong> ${escapeHTML(complaint.aiSummary || complaint.title)}</div>
                    ${complaint.aiReason ? `<div style="font-size:11px; color:#64748b; font-style:italic;"><strong>Reason:</strong> ${escapeHTML(complaint.aiReason)}</div>` : ""}
                </div>


                <div class="complaint-description">

                    ${escapeHTML(
                        complaint.description
                    )}

                </div>


                ${
                    complaint.problemImage
                        ? `

                    <div class="complaint-image-section">

                        <span class="image-label">
                            📷 Problem Image
                        </span>

                        <img
                            src="${escapeHTML(
                                complaint.problemImage
                            )}"
                            alt="Problem reported by student"
                            class="complaint-image"
                            onclick="window.open(
                                '${escapeHTML(
                                    complaint.problemImage
                                )}',
                                '_blank'
                            )"
                        >

                    </div>

                    `
                        : ""
                }


                ${
                    complaint.resolutionImage
                        ? `

                    <div class="complaint-image-section">

                        <span class="image-label">
                            ✅ Resolution Proof
                        </span>

                        <img
                            src="${escapeHTML(
                                complaint.resolutionImage
                            )}"
                            alt="Resolution proof"
                            class="complaint-image"
                            onclick="window.open(
                                '${escapeHTML(
                                    complaint.resolutionImage
                                )}',
                                '_blank'
                            )"
                        >

                    </div>

                    `
                        : ""
                }


                <div class="student-info">

                    <div>

                        Student:

                        <strong>

                            ${escapeHTML(
                                student.name ||
                                "Unknown"
                            )}

                        </strong>

                    </div>


                    <div>

                        Student ID:

                        <strong>

                            ${escapeHTML(
                                student.studentId ||
                                "N/A"
                            )}

                        </strong>

                    </div>


                    <div>

                        Priority:

                        <strong>

                            ${escapeHTML(
                                complaint.priority
                            )}

                        </strong>

                    </div>

                    ${
                        complaint.assignedStaff
                            ? `
                        <div>
                            Staff:
                            <strong>${escapeHTML(complaint.assignedStaff.name)}</strong>
                        </div>
                        `
                            : ""
                    }

                </div>


                <div class="complaint-actions">

                    <button
                        type="button"
                        class="action-btn"
                        onclick="openAssignModal('${complaint._id}')"
                        style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;"
                    >
                        🏢 Change Dept
                    </button>

                    <button
                        type="button"
                        class="action-btn"
                        onclick="openPriorityModal('${complaint._id}', '${complaint.priority}')"
                        style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;"
                    >
                        ⚡ Change Priority
                    </button>

                    ${getActionButtons(
                        complaint
                    )}

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================
// Status Buttons
// =====================================

function getActionButtons(
    complaint
) {

    const status =
        complaint.status;


    let buttons = "";


    if (
        status === "Reported"
    ) {

        buttons += `

            <button
                class="action-btn primary"
                onclick="
                    updateStatus(
                        '${complaint._id}',
                        'Under Review'
                    )
                "
            >

                🔍 Review

            </button>

        `;

    }


    if (
        status === "Under Review"
    ) {

        buttons += `

            <button
                class="action-btn primary"
                onclick="
                    updateStatus(
                        '${complaint._id}',
                        'In Progress'
                    )
                "
            >

                🛠️ Start Work

            </button>

        `;

    }


    if (
        status === "In Progress"
    ) {

        buttons += `

            <button
                class="action-btn success"
                onclick="
                    openResolutionUpload(
                        '${complaint._id}'
                    )
                "
            >

                ✓ Mark Resolved

            </button>

        `;

    }


    if (
        status !== "Rejected" &&
        status !== "Resolved"
    ) {

        buttons += `

            <button
                class="action-btn danger"
                onclick="
                    updateStatus(
                        '${complaint._id}',
                        'Rejected'
                    )
                "
            >

                ✕ Reject

            </button>

        `;

    }


    if (
        status === "Resolved"
    ) {

        buttons += `

            <span
                style="
                    font-size:11px;
                    color:#26944b;
                    padding:8px 0;
                "
            >

                ✓ Complaint resolved

            </span>

        `;

    }


    if (
        status === "Rejected"
    ) {

        buttons += `

            <span
                style="
                    font-size:11px;
                    color:#d64545;
                    padding:8px 0;
                "
            >

                Complaint rejected

            </span>

        `;

    }


    return buttons;

}


// =====================================
// Resolution Photo Upload
// =====================================

function openResolutionUpload(
    complaintId
) {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        "image/*";


    input.style.display =
        "none";


    input.addEventListener(
        "change",
        async function () {

            const file =
                input.files[0];


            if (!file) {

                return;

            }


            // 5 MB limit

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "Image must be smaller than 5 MB."
                );

                return;

            }


            await resolveComplaint(
                complaintId,
                file
            );

        }
    );


    document.body.appendChild(
        input
    );


    input.click();


    setTimeout(() => {

        input.remove();

    }, 1000);

}


// =====================================
// Update Complaint Status
// =====================================

async function updateStatus(
    complaintId,
    newStatus
) {

    try {

        const response =
            await fetch(

                `${API_URL}/admin/complaints/${complaintId}/status`,

                {

                    method: "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            status:
                                newStatus

                        })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update status."
            );

        }


        const index =
            complaints.findIndex(
                complaint =>
                    complaint._id ===
                    complaintId
            );


        if (index !== -1) {

            complaints[index] =
                data.complaint;

        }


        // Update dashboard statistics

        updateStatistics();


        // Update analytics

        updateAnalytics();


        // Re-render complaints

        renderComplaints();


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            error.message
        );

    }

}


// =====================================
// Resolve Complaint With Photo
// =====================================

async function resolveComplaint(
    complaintId,
    imageFile
) {

    try {

        const formData =
            new FormData();


        formData.append(
            "status",
            "Resolved"
        );


        formData.append(
            "resolutionImage",
            imageFile
        );


        const response =
            await fetch(

                `${API_URL}/admin/complaints/${complaintId}/status`,

                {

                    method: "PATCH",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        formData

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to resolve complaint."
            );

        }


        // Update complaint locally

        const index =
            complaints.findIndex(
                complaint =>
                    complaint._id ===
                    complaintId
            );


        if (index !== -1) {

            complaints[index] =
                data.complaint;

        }


        // Update dashboard statistics

        updateStatistics();


        // Update analytics

        updateAnalytics();


        // Re-render complaints

        renderComplaints();


        alert(
            "Complaint resolved successfully! ✅"
        );


    } catch (error) {

        console.error(
            "Resolution error:",
            error
        );


        alert(
            error.message ||
            "Unable to resolve complaint."
        );

    }

}


// =====================================
// Status CSS class
// =====================================

function getStatusClass(
    status
) {

    switch (status) {

        case "Reported":
            return "status-reported";

        case "Under Review":
            return "status-review";

        case "In Progress":
            return "status-progress";

        case "Resolved":
            return "status-resolved";

        case "Rejected":
            return "status-rejected";

        default:
            return "";

    }

}


// =====================================
// Date
// =====================================

function formatDate(
    date
) {

    if (!date) {

        return "";

    }


    return new Date(
        date
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================
// Prevent HTML injection
// =====================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================
// Filters
// =====================================

document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-btn"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter;


                    renderComplaints();

                }
            );

        }
    );


// =====================================
// Logout
// =====================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "demoUser"
    );

    localStorage.removeItem(
        "selectedCollege"
    );


    window.location.href =
        "index.html";

}


// =====================================
// DEPARTMENT MANAGEMENT
// =====================================

let departments = [];

async function loadDepartments() {
    const container = document.getElementById("departmentsContainer");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/departments/admin/all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load departments.");

        departments = data;
        renderDepartments();
        populateDepartmentDropdowns();
    } catch (err) {
        console.error("Load departments error:", err);
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 20px; background: white; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center;">
                <p style="color: #ef4444;">Failed to load departments: ${err.message}</p>
                <button class="action-btn" onclick="loadDepartments()" style="margin-top: 8px;">Retry</button>
            </div>
        `;
    }
}

function renderDepartments() {
    const container = document.getElementById("departmentsContainer");
    if (!container) return;

    if (departments.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 36px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🏢</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No departments found</h4>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Seed standard departments to enable automated AI routing.</p>
                <button class="action-btn primary" onclick="seedDefaultDepartments()" style="padding: 8px 16px; border-radius: 8px;">
                    🌱 Seed Standard Departments
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = departments.map(d => `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <strong style="font-size: 16px; color: #0f172a;">${escapeHTML(d.name)}</strong>
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; background: ${d.isActive ? '#dcfce7; color:#166534;' : '#f1f5f9; color:#64748b;'}">
                        ${d.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 14px; min-height: 32px; line-height: 1.4;">
                    ${escapeHTML(d.description || "No description provided.")}
                </p>
                <div style="display: flex; gap: 12px; font-size: 12px; color: #334155; margin-bottom: 16px; flex-wrap: wrap;">
                    <span>👥 Staff: <strong>${d.staffCount || 0}</strong></span>
                    <span>📋 Total: <strong>${d.totalComplaints || 0}</strong></span>
                    <span>⏳ Pending: <strong>${d.pendingComplaints || 0}</strong></span>
                    <span>✓ Resolved: <strong>${d.resolvedComplaints || 0}</strong></span>
                </div>
            </div>
            <div style="display: flex; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                <button type="button" class="action-btn" onclick="openDepartmentModal('${d._id}')" style="background: #f8fafc; border: 1px solid #cbd5e1; font-size: 12px; padding: 5px 10px; border-radius: 6px;">
                    ✏️ Edit
                </button>
                <button type="button" class="action-btn" onclick="toggleDepartment('${d._id}')" style="background: ${d.isActive ? '#fee2e2; color:#b91c1c; border: 1px solid #fecaca;' : '#dcfce7; color:#166534; border: 1px solid #bbf7d0;'} font-size: 12px; padding: 5px 10px; border-radius: 6px;">
                    ${d.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" class="action-btn" onclick="openStaffModalForDept('${d._id}')" style="background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; font-size: 12px; padding: 5px 10px; border-radius: 6px; margin-left: auto;">
                    + Staff
                </button>
            </div>
        </div>
    `).join("");
}

async function toggleDepartment(id) {
    try {
        const response = await fetch(`${API_URL}/departments/admin/${id}/toggle`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to toggle status.");
        await loadDepartments();
    } catch (err) {
        alert(err.message || "Error toggling department status.");
    }
}

async function seedDefaultDepartments() {
    if (!confirm("Seed default departments for this college? Existing departments will not be overwritten.")) return;

    try {
        const response = await fetch(`${API_URL}/departments/admin/seed`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to seed departments.");
        alert(data.message || "Departments seeded successfully!");
        await loadDepartments();
    } catch (err) {
        alert(err.message || "Error seeding departments.");
    }
}

function openDepartmentModal(deptId = null) {
    const modal = document.getElementById("deptModal");
    const title = document.getElementById("deptModalTitle");
    const idInput = document.getElementById("deptModalId");
    const nameInput = document.getElementById("deptModalName");
    const descInput = document.getElementById("deptModalDesc");

    if (deptId) {
        const dept = departments.find(d => d._id === deptId);
        if (!dept) return;
        title.textContent = "✏️ Edit Department";
        idInput.value = dept._id;
        nameInput.value = dept.name;
        descInput.value = dept.description || "";
    } else {
        title.textContent = "+ Add Department";
        idInput.value = "";
        nameInput.value = "";
        descInput.value = "";
    }
    modal.style.display = "flex";
}

function closeDepartmentModal() {
    document.getElementById("deptModal").style.display = "none";
}

document.getElementById("deptForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("deptModalId").value;
    const name = document.getElementById("deptModalName").value.trim();
    const description = document.getElementById("deptModalDesc").value.trim();
    const submitBtn = document.getElementById("deptSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
        const url = id ? `${API_URL}/departments/admin/${id}` : `${API_URL}/departments/admin`;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to save department.");

        closeDepartmentModal();
        await loadDepartments();
    } catch (err) {
        alert(err.message || "Error saving department.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Department";
    }
});

// =====================================
// DEPARTMENT STAFF MANAGEMENT
// =====================================

let allStaffMembers = [];

async function loadStaffMembers() {
    const container = document.getElementById("staffContainer");
    if (!container) return;

    try {
        // Collect staff across all departments
        const staffPromises = departments.map(async (d) => {
            const res = await fetch(`${API_URL}/departments/admin/${d._id}/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const staffArr = await res.json();
                return staffArr.map(s => ({ ...s, departmentName: d.name }));
            }
            return [];
        });

        const nestedStaff = await Promise.all(staffPromises);
        allStaffMembers = nestedStaff.flat();

        renderStaffTable();
    } catch (err) {
        console.error("Load staff error:", err);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                Failed to load staff members.
            </div>
        `;
    }
}

function renderStaffTable() {
    const container = document.getElementById("staffContainer");
    if (!container) return;

    if (allStaffMembers.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No staff accounts created yet</h4>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Add department staff members to assign and resolve campus complaints.</p>
                <button class="action-btn primary" onclick="openStaffModal()" style="padding: 8px 16px; border-radius: 8px;">
                    + Add Staff Member
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600;">
                    <th style="padding: 12px 16px;">Staff Name</th>
                    <th style="padding: 12px 16px;">Email</th>
                    <th style="padding: 12px 16px;">Department</th>
                    <th style="padding: 12px 16px; text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${allStaffMembers.map(s => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${escapeHTML(s.name)}</td>
                        <td style="padding: 12px 16px; color: #475569;">${escapeHTML(s.email)}</td>
                        <td style="padding: 12px 16px;">
                            <span style="background: #ede9fe; color: #5b21b6; padding: 2px 8px; border-radius: 10px; font-weight: 600; font-size: 11px;">
                                🏢 ${escapeHTML(s.departmentName || "General")}
                            </span>
                        </td>
                        <td style="padding: 12px 16px; text-align: right;">
                            <button type="button" onclick="deleteStaffMember('${s._id}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">
                                Remove
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function populateDepartmentDropdowns() {
    const assignSelect = document.getElementById("assignDeptSelect");
    const staffSelect = document.getElementById("staffFormDept");

    const activeDepts = departments.filter(d => d.isActive);

    if (assignSelect) {
        assignSelect.innerHTML = `
            <option value="" disabled selected>Choose active department...</option>
            ${activeDepts.map(d => `<option value="${d._id}">${escapeHTML(d.name)}</option>`).join("")}
        `;
    }

    if (staffSelect) {
        staffSelect.innerHTML = `
            <option value="" disabled selected>Select Department...</option>
            ${activeDepts.map(d => `<option value="${d._id}">${escapeHTML(d.name)}</option>`).join("")}
        `;
    }
}

function openStaffModal() {
    populateDepartmentDropdowns();
    document.getElementById("staffFormName").value = "";
    document.getElementById("staffFormEmail").value = "";
    document.getElementById("staffFormPassword").value = "";
    document.getElementById("staffModal").style.display = "flex";
}

function openStaffModalForDept(deptId) {
    openStaffModal();
    const select = document.getElementById("staffFormDept");
    if (select) select.value = deptId;
}

function closeStaffModal() {
    document.getElementById("staffModal").style.display = "none";
}

document.getElementById("staffForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("staffFormName").value.trim();
    const email = document.getElementById("staffFormEmail").value.trim();
    const password = document.getElementById("staffFormPassword").value;
    const deptId = document.getElementById("staffFormDept").value;
    const submitBtn = document.getElementById("staffSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
        const response = await fetch(`${API_URL}/departments/admin/${deptId}/staff`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to create staff member.");

        closeStaffModal();
        alert("Department staff member created successfully! 🎉");
        await loadDepartments();
        await loadStaffMembers();
    } catch (err) {
        alert(err.message || "Error creating staff account.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Staff Member";
    }
});

async function deleteStaffMember(staffId) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
        const response = await fetch(`${API_URL}/departments/admin/staff/${staffId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to remove staff.");

        await loadDepartments();
        await loadStaffMembers();
    } catch (err) {
        alert(err.message || "Error removing staff member.");
    }
}

// =====================================
// MANUAL ASSIGNMENT & PRIORITY MODALS
// =====================================

let activeComplaintIdForAssign = null;
let activeComplaintIdForPriority = null;

function openAssignModal(complaintId) {
    activeComplaintIdForAssign = complaintId;
    populateDepartmentDropdowns();

    const complaint = complaints.find(c => c._id === complaintId);
    if (complaint && complaint.department) {
        const select = document.getElementById("assignDeptSelect");
        if (select) select.value = complaint.department._id || complaint.department;
    }

    document.getElementById("assignModal").style.display = "flex";
}

function closeAssignModal() {
    document.getElementById("assignModal").style.display = "none";
    activeComplaintIdForAssign = null;
}

document.getElementById("assignForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const deptId = document.getElementById("assignDeptSelect").value;
    const submitBtn = document.getElementById("assignSubmitBtn");

    if (!deptId) {
        alert("Please select a department.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Assigning...";

    try {
        const response = await fetch(`${API_URL}/admin/complaints/${activeComplaintIdForAssign}/assign`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ departmentId: deptId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Assignment failed.");

        const idx = complaints.findIndex(c => c._id === activeComplaintIdForAssign);
        if (idx !== -1) complaints[idx] = data.complaint;

        closeAssignModal();
        updateStatistics();
        renderComplaints();
        await loadDepartments();
        alert("Complaint assigned to department successfully! 🎉");
    } catch (err) {
        alert(err.message || "Error assigning department.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Assign Department";
    }
});

function openPriorityModal(complaintId, currentPriority = "Medium") {
    activeComplaintIdForPriority = complaintId;
    const select = document.getElementById("prioritySelect");
    if (select) select.value = currentPriority;
    document.getElementById("priorityModal").style.display = "flex";
}

function closePriorityModal() {
    document.getElementById("priorityModal").style.display = "none";
    activeComplaintIdForPriority = null;
}

document.getElementById("priorityForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const priority = document.getElementById("prioritySelect").value;
    const submitBtn = document.getElementById("prioritySubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";

    try {
        const response = await fetch(`${API_URL}/admin/complaints/${activeComplaintIdForPriority}/priority`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ priority })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Priority update failed.");

        const idx = complaints.findIndex(c => c._id === activeComplaintIdForPriority);
        if (idx !== -1) complaints[idx] = data.complaint;

        closePriorityModal();
        updateStatistics();
        updateAnalytics();
        renderComplaints();
    } catch (err) {
        alert(err.message || "Error updating priority.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Priority";
    }
});

// =====================================
// NOTIFICATIONS
// =====================================

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

    if (!list || !badge || !countEl) return;

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
        <div class="notification-item ${!n.isRead ? "unread" : ""} ${n.type || "info"}" onclick="markAdminNotificationRead('${n._id}')">
            <div class="notification-icon">${n.type === "warning" ? "⚠️" : n.type === "success" ? "✓" : "📋"}</div>
            <div class="notification-content">
                <div class="notification-title">${escapeHTML(n.title)}</div>
                <div class="notification-message">${escapeHTML(n.message)}</div>
                <div class="notification-time">${formatDate(n.createdAt)}</div>
            </div>
            ${!n.isRead ? `<span class="notification-dot"></span>` : ""}
        </div>
    `).join("");
}

async function markAdminNotificationRead(id) {
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

document.getElementById("notificationBtn")?.addEventListener("click", () => {
    document.getElementById("notificationPanel")?.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    const wrapper = document.querySelector(".notification-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById("notificationPanel")?.classList.remove("show");
    }
});

document.getElementById("markAllReadBtn")?.addEventListener("click", async () => {
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

// =====================================
// ADMIN CHALLENGES & INDUSTRY COLLABORATION
// =====================================

let adminChallenges = [];
let activeAdminChallengeFilter = "All";

async function loadAdminChallenges() {
    const container = document.getElementById("adminChallengesContainer");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/admin/challenges`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load challenges.");

        adminChallenges = data;
        renderAdminChallenges();
    } catch (err) {
        console.error("Admin load challenges error:", err);
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 24px; background: white; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center; color: #ef4444;">
                <p>Failed to load challenges: ${err.message}</p>
                <button class="action-btn" onclick="loadAdminChallenges()" style="margin-top: 8px;">Retry</button>
            </div>
        `;
    }
}

function setAdminChallengeFilter(filter, btn) {
    activeAdminChallengeFilter = filter;
    document.querySelectorAll(".admin-ch-filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderAdminChallenges();
}

function renderAdminChallenges() {
    const container = document.getElementById("adminChallengesContainer");
    if (!container) return;

    const list = adminChallenges.filter(ch => {
        if (activeAdminChallengeFilter === "All") return true;
        return ch.status === activeAdminChallengeFilter;
    });

    if (list.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
                <h4 style="font-size: 16px; color: #0f172a; margin-bottom: 4px;">No campus challenges found</h4>
                <p style="font-size: 13px; color: #64748b;">Crowdsourced challenges submitted by students will appear here for review and industry matching.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(ch => {
        const isOpen = ch.status === "Open";
        const isValidated = ch.status === "University Validated";
        const isSeeking = ch.status === "Seeking Industry Partner" || ch.status === "Proposal Received";
        const hasCollab = ch.status === "Partner Selected" || ch.status === "In Progress" || ch.status === "Completed";
        const isCompleted = ch.status === "Completed";

        return `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 700; background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 10px;">
                            ${escapeHTML(ch.category)}
                        </span>
                        <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; ${getAdminChallengeStatusStyle(ch.status)}">
                            ${escapeHTML(ch.status)}
                        </span>
                    </div>

                    <strong style="font-size: 16px; color: #0f172a; display: block; margin-bottom: 6px; line-height: 1.35;">${escapeHTML(ch.title)}</strong>

                    <div style="font-size: 12px; color: #64748b; margin-bottom: 10px; display: flex; gap: 12px;">
                        <span>📍 ${escapeHTML(ch.location)}</span>
                        <span>👤 ${escapeHTML(ch.createdBy?.name || "Student")}</span>
                        <span>❤️ <strong>${ch.supportCount || 0}</strong> votes</span>
                    </div>

                    <p style="font-size: 13px; color: #475569; line-height: 1.45; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${escapeHTML(ch.description)}
                    </p>

                    ${ch.requiredExpertise && ch.requiredExpertise.length > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
                            ${ch.requiredExpertise.map(e => `<span style="background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px;">${escapeHTML(e)}</span>`).join("")}
                        </div>
                    ` : ""}

                    ${ch.selectedPartner ? `
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 12px; color: #166534;">
                            🤝 Partner: <strong>${escapeHTML(ch.selectedPartner.companyName || ch.selectedPartner.name)}</strong>
                        </div>
                    ` : ""}
                </div>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${isOpen ? `
                        <button type="button" class="action-btn" onclick="validateAdminChallenge('${ch._id}')" style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; font-size: 12px; padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                            ✓ Validate Challenge
                        </button>
                        <button type="button" class="action-btn" onclick="rejectAdminChallenge('${ch._id}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-size: 12px; padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                            Reject
                        </button>
                    ` : ""}

                    ${(isValidated || isOpen) ? `
                        <button type="button" class="action-btn primary" onclick="openRequestCollabModal('${ch._id}', '${escapeHTML(ch.title)}', '${escapeHTML(ch.category)}')" style="font-size: 12px; padding: 5px 12px; border-radius: 6px; font-weight: 600;">
                            🤝 Request Industry Partner
                        </button>
                    ` : ""}

                    ${isSeeking ? `
                        <button type="button" class="action-btn" onclick="openReviewProposalsModal('${ch._id}', '${escapeHTML(ch.title)}')" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 12px; padding: 5px 12px; border-radius: 6px; font-weight: 600;">
                            💼 Review Proposals (${ch.proposalCount || 0})
                        </button>
                    ` : ""}

                    ${hasCollab ? `
                        <button type="button" class="action-btn" onclick="openManageCollabModal('${ch._id}')" style="background: #f0fdf4; color: #15803d; border: 1px solid #86efac; font-size: 12px; padding: 5px 12px; border-radius: 6px; font-weight: 600; margin-left: auto;">
                            ${isCompleted ? '🏆 View Impact Report' : '⚙️ Manage Project & Impact →'}
                        </button>
                    ` : ""}
                </div>
            </div>
        `;
    }).join("");
}

function getAdminChallengeStatusStyle(status) {
    switch (status) {
        case "Open": return "background: #f1f5f9; color: #475569;";
        case "University Validated": return "background: #dbeafe; color: #1e40af;";
        case "Seeking Industry Partner": return "background: #fef3c7; color: #92400e; border: 1px solid #fde68a;";
        case "Proposal Received": return "background: #ffedd5; color: #9a3412;";
        case "Partner Selected": return "background: #e0e7ff; color: #3730a3;";
        case "In Progress": return "background: #ede9fe; color: #5b21b6;";
        case "Completed": return "background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;";
        case "Rejected": return "background: #fee2e2; color: #991b1b;";
        default: return "background: #f1f5f9; color: #475569;";
    }
}

// =====================================
// VALIDATE & REJECT ACTIONS
// =====================================

async function validateAdminChallenge(id) {
    const notes = prompt("Enter University Validation remarks for this challenge:", "Validated as high-priority campus societal problem.");
    if (notes === null) return;

    try {
        const res = await fetch(`${API_URL}/admin/challenges/${id}/validate`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ validationNotes: notes })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to validate.");

        alert("Challenge validated successfully! 🎓");
        await loadAdminChallenges();
    } catch (err) {
        alert(err.message || "Error validating challenge.");
    }
}

async function rejectAdminChallenge(id) {
    const reason = prompt("Enter reason for rejection:", "Does not fit university problem solving scope.");
    if (reason === null) return;

    try {
        const res = await fetch(`${API_URL}/admin/challenges/${id}/reject`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reject.");

        await loadAdminChallenges();
    } catch (err) {
        alert(err.message || "Error rejecting challenge.");
    }
}

// =====================================
// REQUEST COLLABORATION MODAL
// =====================================

function openRequestCollabModal(challengeId, challengeTitle, category) {
    document.getElementById("reqCollabChallengeId").value = challengeId;
    document.getElementById("reqCollabTitle").textContent = `Request Partner: ${challengeTitle}`;
    document.getElementById("reqCollabCategory").value = category || "Information Technology";
    document.getElementById("reqCollabExpertise").value = "";
    document.getElementById("reqCollabOutcome").value = "";
    document.getElementById("requestCollabModal").style.display = "flex";
}

function closeRequestCollabModal() {
    document.getElementById("requestCollabModal").style.display = "none";
}

document.getElementById("requestCollabForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("reqCollabChallengeId").value;
    const requiredIndustryCategory = document.getElementById("reqCollabCategory").value;
    const requiredExpertise = document.getElementById("reqCollabExpertise").value.trim();
    const timelineMonths = document.getElementById("reqCollabTimeline").value;
    const estimatedBudget = document.getElementById("reqCollabBudget").value.trim();
    const expectedOutcome = document.getElementById("reqCollabOutcome").value.trim();
    const submitBtn = document.getElementById("reqCollabSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing...";

    try {
        const res = await fetch(`${API_URL}/admin/challenges/${id}/request-collaboration`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                requiredIndustryCategory,
                requiredExpertise,
                timelineMonths,
                estimatedBudget,
                expectedOutcome
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to publish request.");

        closeRequestCollabModal();
        alert("Challenge published to Industry Collaboration network! 🚀");
        await loadAdminChallenges();
    } catch (err) {
        alert(err.message || "Error requesting collaboration.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publish to Industry Network 🚀";
    }
});

// =====================================
// REVIEW PROPOSALS MODAL
// =====================================

async function openReviewProposalsModal(challengeId, challengeTitle) {
    document.getElementById("reviewPropModalTitle").textContent = `Proposals for: ${challengeTitle}`;
    const container = document.getElementById("proposalsListContainer");
    container.innerHTML = `<div style="padding: 30px; text-align: center;">⏳ Loading proposals...</div>`;
    document.getElementById("reviewProposalsModal").style.display = "flex";

    try {
        const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/proposals`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const proposals = await res.json();
        if (!res.ok) throw new Error(proposals.message || "Failed to load proposals.");

        if (proposals.length === 0) {
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    No industry proposals received yet for this challenge.
                </div>
            `;
            return;
        }

        container.innerHTML = proposals.map(p => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <strong style="font-size: 16px; color: #0f172a;">${escapeHTML(p.companyName)}</strong>
                        <div style="font-size: 12px; color: #64748b;">
                            👤 ${escapeHTML(p.industryUser?.name || "Contact")} • ✉️ ${escapeHTML(p.industryUser?.email || p.contactEmail)} ${p.industryUser?.website ? `• 🌐 <a href="${p.industryUser.website}" target="_blank">Website</a>` : ''}
                        </div>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 8px; ${p.status === 'Accepted' ? 'background:#dcfce7; color:#166534;' : 'background:#f1f5f9; color:#475569;'}">
                        ${escapeHTML(p.status)}
                    </span>
                </div>

                <div style="font-size: 13px; color: #334155; margin-bottom: 12px; line-height: 1.5;">
                    <strong style="color: #0f172a; display: block; margin-bottom: 2px;">Proposed Technical Solution:</strong>
                    ${escapeHTML(p.proposedSolution)}
                </div>

                <div style="font-size: 13px; color: #334155; margin-bottom: 12px; line-height: 1.5;">
                    <strong style="color: #0f172a; display: block; margin-bottom: 2px;">Implementation Approach:</strong>
                    ${escapeHTML(p.implementationApproach)}
                </div>

                <div style="display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-bottom: 14px; flex-wrap: wrap;">
                    <span>⏱️ Timeline: <strong>${escapeHTML(p.estimatedTimeline)}</strong></span>
                    <span>💰 Funding/Cost: <strong>${escapeHTML(p.estimatedCost)}</strong></span>
                    <span>🎯 Expected Impact: <strong>${escapeHTML(p.expectedImpact)}</strong></span>
                </div>

                ${p.status !== "Accepted" ? `
                    <div style="display: flex; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                        <button type="button" class="action-btn primary" onclick="acceptIndustryProposal('${p._id}', '${challengeId}')" style="background: #16a34a; font-size: 12px; padding: 6px 14px; border-radius: 6px; font-weight: 600;">
                            ✓ Accept Proposal & Start Collaboration
                        </button>
                        <button type="button" class="action-btn" onclick="rejectIndustryProposal('${p._id}', '${challengeId}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-size: 12px; padding: 6px 12px; border-radius: 6px; font-weight: 600;">
                            Reject
                        </button>
                    </div>
                ` : `
                    <div style="color: #166534; font-size: 12px; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                        ✓ Accepted Partner for this Project Cycle
                    </div>
                `}
            </div>
        `).join("");

    } catch (err) {
        container.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
    }
}

function closeReviewProposalsModal() {
    document.getElementById("reviewProposalsModal").style.display = "none";
}

async function acceptIndustryProposal(proposalId, challengeId) {
    if (!confirm("Accept this proposal and establish joint collaboration with this industry partner?")) return;

    try {
        const res = await fetch(`${API_URL}/admin/challenges/proposals/${proposalId}/accept`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to accept proposal.");

        alert(data.message || "Proposal accepted! Collaboration project started. 🎉");
        closeReviewProposalsModal();
        await loadAdminChallenges();
    } catch (err) {
        alert(err.message || "Error accepting proposal.");
    }
}

async function rejectIndustryProposal(proposalId, challengeId) {
    const feedback = prompt("Enter feedback for this industry partner:", "Proposal did not match current university technical requirements.");
    if (feedback === null) return;

    try {
        const res = await fetch(`${API_URL}/admin/challenges/proposals/${proposalId}/reject`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ feedback })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reject proposal.");

        await openReviewProposalsModal(challengeId, "Challenge");
    } catch (err) {
        alert(err.message || "Error rejecting proposal.");
    }
}

// =====================================
// MANAGE COLLABORATION & RECORD IMPACT MODAL
// =====================================

async function openManageCollabModal(challengeId) {
    const modal = document.getElementById("manageCollabModal");
    const body = document.getElementById("collabModalBody");
    body.innerHTML = `<div style="padding: 30px; text-align: center;">⏳ Loading collaboration project...</div>`;
    modal.style.display = "flex";

    try {
        const res = await fetch(`${API_URL}/admin/challenges/${challengeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load collaboration.");

        const { challenge, collaboration } = data;

        if (!collaboration) {
            body.innerHTML = `<p style="padding:20px; color:#64748b;">No active collaboration record found.</p>`;
            return;
        }

        const isCompleted = collaboration.status === "Completed";

        body.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="font-size: 17px; color: #0f172a;">${escapeHTML(collaboration.title)}</strong>
                        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                            🏢 Industry Partner: <strong>${escapeHTML(collaboration.industryUser?.companyName || collaboration.industryUser?.name)}</strong>
                        </div>
                    </div>
                    <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 10px; ${isCompleted ? 'background:#dcfce7; color:#166534;' : 'background:#ede9fe; color:#5b21b6;'}">
                        ${escapeHTML(collaboration.status)}
                    </span>
                </div>
            </div>

            <!-- Milestone Progress Log -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <h4 style="font-size: 14px; color: #0f172a; margin: 0 0 12px 0;">📊 Milestone & Progress History</h4>
                ${collaboration.progressUpdates && collaboration.progressUpdates.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${collaboration.progressUpdates.map(u => `
                            <div style="background: white; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 12px;">
                                <div style="display: flex; justify-content: space-between; font-weight: 600;">
                                    <span>${escapeHTML(u.title)}</span>
                                    <span style="color: #0f766e;">${u.percentage}%</span>
                                </div>
                                <p style="margin: 4px 0 0 0; color: #475569;">${escapeHTML(u.description)}</p>
                                <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                                    Posted by: ${u.postedByRole === 'admin' ? 'University Admin' : 'Industry Partner'} • ${new Date(u.createdAt).toLocaleString("en-IN")}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                ` : `<p style="font-size: 12px; color: #64748b; margin: 0;">No progress milestones logged yet.</p>`}
            </div>

            <!-- Impact & Final Solution Section -->
            ${!isCompleted ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                    <h4 style="font-size: 15px; color: #166534; margin: 0 0 10px 0;">🏆 Finalize Project & Record Measurable SIH Impact</h4>
                    <p style="font-size: 12px; color: #15803d; margin-bottom: 14px;">
                        When implementation is complete, record the verified solution report and real measurable outcomes for the campus.
                    </p>

                    <form id="completeCollabForm" onsubmit="submitCompleteCollaboration(event, '${collaboration._id}')">
                        <div style="margin-bottom: 12px;">
                            <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Final Solution Summary *</label>
                            <textarea id="finalSolSummary" required rows="2" placeholder="Describe the implemented solution (e.g. Automated smart water monitoring network with 40 IoT flow meters)..." style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;"></textarea>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Implementation & Deployment Details</label>
                            <textarea id="finalSolDetails" rows="2" placeholder="Technical specs, server deployment, maintenance handover notes..." style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;"></textarea>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom: 12px;">
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Students / Users Benefited (Count)</label>
                                <input type="number" id="impactStudents" placeholder="e.g. 2400" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Energy Saved / Reduction</label>
                                <input type="text" id="impactEnergy" placeholder="e.g. 18% monthly electricity saved" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom: 12px;">
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Water Saved / Leakage Fixed</label>
                                <input type="text" id="impactWater" placeholder="e.g. 12,000 Liters / day" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Cost Savings</label>
                                <input type="text" id="impactCost" placeholder="e.g. ₹3,20,000 / year" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom: 14px;">
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Waste Reduced</label>
                                <input type="text" id="impactWaste" placeholder="e.g. 35% plastic waste reduced" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Time Saved / Efficiency</label>
                                <input type="text" id="impactTime" placeholder="e.g. 50% faster issue resolution" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <label style="display:block; font-size:12px; font-weight:600; color:#166534; margin-bottom:4px;">Solution Photo / Proof Diagram</label>
                            <input type="file" id="finalSolImage" accept="image/*" style="font-size:12px;">
                        </div>

                        <button type="submit" id="completeCollabBtn" class="action-btn primary" style="background:#16a34a; width:100%; padding:10px; border-radius:8px; font-weight:600; cursor:pointer;">
                            🏆 Approve & Mark Collaboration Completed
                        </button>
                    </form>
                </div>
            ` : `
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px;">
                    <h4 style="font-size: 15px; color: #166534; margin: 0 0 8px 0;">🏆 Verified Solution & SIH Measured Outcomes</h4>
                    <p style="font-size: 13px; color: #15803d; line-height: 1.5; margin-bottom: 12px;">
                        ${escapeHTML(collaboration.finalSolution?.summary || "Project completed successfully.")}
                    </p>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px;">
                        ${collaboration.impact?.studentsBenefited ? `
                            <div style="background: white; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
                                <strong style="font-size: 18px; color: #166534; display: block;">${collaboration.impact.studentsBenefited}+</strong>
                                <span style="font-size: 11px; color: #15803d;">Students Impacted</span>
                            </div>
                        ` : ""}
                        ${collaboration.impact?.energySaved ? `
                            <div style="background: white; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
                                <strong style="font-size: 16px; color: #166534; display: block;">${escapeHTML(collaboration.impact.energySaved)}</strong>
                                <span style="font-size: 11px; color: #15803d;">Energy Saved</span>
                            </div>
                        ` : ""}
                        ${collaboration.impact?.waterSaved ? `
                            <div style="background: white; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
                                <strong style="font-size: 16px; color: #166534; display: block;">${escapeHTML(collaboration.impact.waterSaved)}</strong>
                                <span style="font-size: 11px; color: #15803d;">Water Saved</span>
                            </div>
                        ` : ""}
                        ${collaboration.impact?.costSavings ? `
                            <div style="background: white; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
                                <strong style="font-size: 16px; color: #166534; display: block;">${escapeHTML(collaboration.impact.costSavings)}</strong>
                                <span style="font-size: 11px; color: #15803d;">Cost Savings</span>
                            </div>
                        ` : ""}
                    </div>
                </div>
            `}
        `;

    } catch (err) {
        body.innerHTML = `<p style="color:red; padding:20px;">${err.message}</p>`;
    }
}

function closeManageCollabModal() {
    document.getElementById("manageCollabModal").style.display = "none";
}

async function submitCompleteCollaboration(e, collabId) {
    e.preventDefault();
    const summary = document.getElementById("finalSolSummary").value.trim();
    const implementationDetails = document.getElementById("finalSolDetails").value.trim();
    const studentsBenefited = document.getElementById("impactStudents").value;
    const energySaved = document.getElementById("impactEnergy").value.trim();
    const waterSaved = document.getElementById("impactWater").value.trim();
    const costSavings = document.getElementById("impactCost").value.trim();
    const wasteReduced = document.getElementById("impactWaste").value.trim();
    const timeSaved = document.getElementById("impactTime").value.trim();
    const fileInput = document.getElementById("finalSolImage");
    const btn = document.getElementById("completeCollabBtn");

    btn.disabled = true;
    btn.textContent = "Finalizing...";

    try {
        const formData = new FormData();
        formData.append("summary", summary);
        formData.append("implementationDetails", implementationDetails);
        if (studentsBenefited) formData.append("studentsBenefited", studentsBenefited);
        if (energySaved) formData.append("energySaved", energySaved);
        if (waterSaved) formData.append("waterSaved", waterSaved);
        if (costSavings) formData.append("costSavings", costSavings);
        if (wasteReduced) formData.append("wasteReduced", wasteReduced);
        if (timeSaved) formData.append("timeSaved", timeSaved);
        if (fileInput.files[0]) formData.append("solutionImage", fileInput.files[0]);

        const res = await fetch(`${API_URL}/admin/challenges/collaborations/${collabId}/complete`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to complete collaboration.");

        closeManageCollabModal();
        alert("Collaboration completed and measurable outcomes verified! 🏆");
        await loadAdminChallenges();
    } catch (err) {
        alert(err.message || "Error completing collaboration.");
    } finally {
        btn.disabled = false;
        btn.textContent = "🏆 Approve & Mark Collaboration Completed";
    }
}

// =====================================
// Initialize Everything
// =====================================

loadComplaints();
loadDepartments();
loadStaffMembers();
loadAdminChallenges();
loadNotifications();