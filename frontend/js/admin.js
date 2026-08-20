// =====================================
// CampusResolve Admin Dashboard
// =====================================

const API_URL =
    "https://campus-resolve-backend.vercel.app/api";


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


    const filteredComplaints =
        currentFilter === "All"

            ? complaints

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
                    in this category.
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

                            ${escapeHTML(
                                complaint.category
                            )}

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

                </div>


                <div class="complaint-actions">

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
// Initialize
// =====================================

loadComplaints();