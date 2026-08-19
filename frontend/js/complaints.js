// =====================================
// CampusResolve - My Complaints
// =====================================

const API_URL =
    "http://localhost:5002/api";


// =====================================
// Authentication
// =====================================

const token =
    localStorage.getItem("token");

const collegeData =
    localStorage.getItem(
        "selectedCollege"
    );


if (!token || !collegeData) {

    window.location.href =
        "index.html";

}


const college =
    JSON.parse(collegeData);


// =====================================
// College Theme
// =====================================

document.documentElement.style.setProperty(
    "--college-primary",
    college.primaryColor || "#2563eb"
);

document.documentElement.style.setProperty(
    "--college-secondary",
    college.secondaryColor || "#7c3aed"
);


// =====================================
// College Information
// =====================================

document.getElementById(
    "collegeName"
).textContent =
    college.name;


document.getElementById(
    "collegeLogo"
).innerHTML = `
    <img
        src="${college.logo}"
        alt="${college.name}"
        onerror="this.style.display='none'"
    >
`;



// =====================================
// Store complaints
// =====================================

let complaints = [];


// =====================================
// Load Complaints
// =====================================

async function loadComplaints() {

    const container =
        document.getElementById(
            "complaintsContainer"
        );

    try {

        const response =
            await fetch(
                `${API_URL}/complaints/my`,
                {
                    headers: {
                        "Authorization":
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

        renderComplaints(
            complaints
        );


    } catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-state">

                <div>⚠️</div>

                <h3>
                    Unable to load complaints
                </h3>

                <p>
                    Please check your connection
                    and try again.
                </p>

            </div>

        `;

    }

}


// =====================================
// Render Complaints
// =====================================

function renderComplaints(
    list
) {

    const container =
        document.getElementById(
            "complaintsContainer"
        );


    if (list.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>📝</div>

                <h3>
                    No complaints found
                </h3>

                <p>
                    You haven't reported any
                    campus issues yet.
                </p>

                <a href="report.html">
                    Report an issue →
                </a>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    list.forEach(
        complaint => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "complaint-card";


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


                    <div class="
                        status
                        ${getStatusClass(
                complaint.status
            )}
                    ">

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
                ${complaint.statusHistory && complaint.statusHistory.length > 0 ? `

    <div class="status-timeline">

        <div class="timeline-title">
            📌 Complaint Progress
        </div>

        <div class="timeline">

            ${complaint.statusHistory.map(
                (history, index) => {

                    const isLast =
                        index ===
                        complaint.statusHistory.length - 1;

                    return `

                        <div class="
                            timeline-item
                            ${isLast ? "current" : ""}
                        ">

                            <div class="timeline-dot">

                                ${getTimelineIcon(
                        history.status
                    )}

                            </div>

                            <div class="timeline-content">

                                <div class="timeline-status">

                                    ${escapeHTML(
                        history.status
                    )}

                                </div>

                                <div class="timeline-message">

                                    ${escapeHTML(
                        history.message
                    )}

                                </div>

                                <div class="timeline-date">

                                    ${formatDateTime(
                        history.updatedAt
                    )}

                                </div>

                            </div>

                        </div>

                    `;

                }
            ).join("")}

        </div>

    </div>

` : ""}
                ${complaint.problemImage ? `
    <div class="complaint-image-section">

        <span class="image-label">
            📷 Problem Image
        </span>

        <img
            src="${escapeHTML(complaint.problemImage)}"
            alt="Problem reported by student"
            class="complaint-image"
            onclick="window.open('${escapeHTML(complaint.problemImage)}', '_blank')"
        >

    </div>
` : ""}


${complaint.resolutionImage ? `
    <div class="complaint-image-section">

        <span class="image-label">
            ✅ Resolution Proof
        </span>

        <img
            src="${escapeHTML(complaint.resolutionImage)}"
            alt="Resolution proof"
            class="complaint-image"
            onclick="window.open('${escapeHTML(complaint.resolutionImage)}', '_blank')"
        >

    </div>
` : ""}


                <div class="complaint-footer">

                    <div class="priority">

                        Priority:

                        <strong>
                            ${escapeHTML(
                complaint.priority
            )}
                        </strong>

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================
// Status CSS
// =====================================
function getTimelineIcon(status) {

    switch (status) {

        case "Reported":
            return "📝";

        case "Under Review":
            return "🔍";

        case "In Progress":
            return "🛠️";

        case "Resolved":
            return "✅";

        case "Rejected":
            return "❌";

        default:
            return "📌";

    }

}
function formatDateTime(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}

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

        default:
            return "status-reported";

    }

}


// =====================================
// Filter
// =====================================

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );


filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                const filter =
                    button.dataset.filter;


                if (filter === "All") {

                    renderComplaints(
                        complaints
                    );

                    return;

                }


                const filtered =
                    complaints.filter(
                        complaint =>
                            complaint.status ===
                            filter
                    );


                renderComplaints(
                    filtered
                );

            }
        );

    }
);


// =====================================
// Date
// =====================================

function formatDate(
    date
) {

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
// HTML Escape
// =====================================

function escapeHTML(
    value
) {

    if (!value) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================
// Logout
// =====================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
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