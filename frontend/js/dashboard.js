// =====================================
// CampusResolve Student Dashboard
// =====================================

const API_URL = "https://campus-resolve-backend.vercel.app/api";


// =====================================
// Get authentication data
// =====================================

const token =
    localStorage.getItem("token");

const userData =
    localStorage.getItem("user");

const collegeData =
    localStorage.getItem("selectedCollege");


// =====================================
// Check login
// =====================================

if (!token || !userData || !collegeData) {

    window.location.href = "index.html";

}


// =====================================
// Parse stored data
// =====================================

const user =
    JSON.parse(userData);

const college =
    JSON.parse(collegeData);


// =====================================
// Apply college theme
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
// College information
// =====================================

const collegeName =
    document.getElementById("collegeName");

const collegeLogo =
    document.getElementById("collegeLogo");


if (collegeName) {

    collegeName.textContent =
        college.name;

}


if (collegeLogo) {

    collegeLogo.innerHTML = `
        <img
            src="${college.logo}"
            alt="${college.name}"
            onerror="this.style.display='none'"
        >
    `;

}


// =====================================
// Student information
// =====================================

const studentName =
    document.getElementById("studentName");


if (studentName && user.name) {

    studentName.textContent =
        user.name;

}

// =====================================
// NOTIFICATIONS
// =====================================

let notifications = [];


// =====================================
// Load Notifications
// =====================================

async function loadNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );

    if (!list) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/notifications`,
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
                "Unable to load notifications."
            );

        }


        notifications = data;

        renderNotifications();


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

        list.innerHTML = `

            <div class="notification-empty">

                ⚠️

                <p>
                    Unable to load notifications.
                </p>

            </div>

        `;

    }

}


// =====================================
// Render Notifications
// =====================================

function renderNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    const countText =
        document.getElementById(
            "notificationCount"
        );


    if (!list) {
        return;
    }


    // ---------------------------------
    // Unread count
    // ---------------------------------

    const unreadCount =
        notifications.filter(
            notification =>
                !notification.isRead
        ).length;


    if (badge) {

        if (unreadCount > 0) {

            badge.textContent =
                unreadCount > 99
                    ? "99+"
                    : unreadCount;

            badge.classList.remove(
                "hidden"
            );

        } else {

            badge.classList.add(
                "hidden"
            );

        }

    }


    if (countText) {

        countText.textContent =
            unreadCount === 0
                ? "No new notifications"
                : `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`;

    }


    // ---------------------------------
    // Empty
    // ---------------------------------

    if (notifications.length === 0) {

        list.innerHTML = `

            <div class="notification-empty">

                🔔

                <p>
                    No notifications yet.
                </p>

            </div>

        `;

        return;

    }


    // ---------------------------------
    // Render
    // ---------------------------------

    list.innerHTML = "";


    notifications.forEach(
        notification => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                `notification-item
                ${notification.isRead ? "" : "unread"}
                ${notification.type || ""}`;


            item.innerHTML = `

                <div class="notification-icon">

                    ${getNotificationIcon(
                        notification.type
                    )}

                </div>


                <div class="notification-content">

                    <div class="notification-title">

                        ${escapeHTML(
                            notification.title
                        )}

                    </div>


                    <div class="notification-message">

                        ${escapeHTML(
                            notification.message
                        )}

                    </div>


                    <div class="notification-time">

                        ${formatNotificationTime(
                            notification.createdAt
                        )}

                    </div>

                </div>


                ${
                    !notification.isRead
                        ? `<div class="notification-dot"></div>`
                        : ""
                }

            `;


            item.addEventListener(
                "click",
                () => {

                    markNotificationRead(
                        notification._id
                    );

                }
            );


            list.appendChild(
                item
            );

        }
    );

}


// =====================================
// Notification Icon
// =====================================

function getNotificationIcon(type) {

    switch (type) {

        case "success":
            return "✅";

        case "warning":
            return "⚠️";

        case "info":
        default:
            return "🔔";

    }

}


// =====================================
// Notification Time
// =====================================

function formatNotificationTime(
    date
) {

    if (!date) {
        return "";
    }


    return new Date(
        date
    ).toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =====================================
// Mark One Notification Read
// =====================================

async function markNotificationRead(
    notificationId
) {

    try {

        const response =
            await fetch(

                `${API_URL}/notifications/${notificationId}/read`,

                {

                    method: "PATCH",

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
                "Unable to mark notification as read."
            );

        }


        const notification =
            notifications.find(
                item =>
                    item._id ===
                    notificationId
            );


        if (notification) {

            notification.isRead =
                true;

        }


        renderNotifications();


    } catch (error) {

        console.error(
            "Mark notification read error:",
            error
        );

    }

}


// =====================================
// Mark All Notifications Read
// =====================================

async function markAllNotificationsRead() {

    try {

        const response =
            await fetch(
                `${API_URL}/notifications/read-all`,
                {

                    method: "PATCH",

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
                "Unable to mark notifications as read."
            );

        }


        notifications.forEach(
            notification => {

                notification.isRead =
                    true;

            }
        );


        renderNotifications();


    } catch (error) {

        console.error(
            "Mark all notifications error:",
            error
        );

    }

}


// =====================================
// Notification Button
// =====================================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const markAllReadBtn =
    document.getElementById(
        "markAllReadBtn"
    );


if (
    notificationBtn &&
    notificationPanel
) {

    notificationBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            notificationPanel.classList.toggle(
                "show"
            );

        }
    );

}


if (markAllReadBtn) {

    markAllReadBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            markAllNotificationsRead();

        }
    );

}


// =====================================
// Close Notification Panel
// =====================================

document.addEventListener(
    "click",
    event => {

        if (
            notificationPanel &&
            !notificationPanel.contains(
                event.target
            ) &&
            !notificationBtn.contains(
                event.target
            )
        ) {

            notificationPanel.classList.remove(
                "show"
            );

        }

    }
);


// -------------------------------------
// Load complaints from MongoDB
// -------------------------------------

async function loadComplaints() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "login.html";

        return;

    }


    const container =
        document.getElementById(
            "complaintsContainer"
        );


    try {

        // Show loading state

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    ⏳
                </div>

                <h3>
                    Loading complaints...
                </h3>

                <p>
                    Please wait.
                </p>

            </div>

        `;


        // Fetch complaints from backend

        const response =
            await fetch(
                "https://campus-resolve-backend.vercel.app/api/complaints/my",
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
                "Unable to fetch complaints."
            );

        }


        const complaints =
            data;


        // ---------------------------------
        // Statistics
        // ---------------------------------

        const total =
            complaints.length;


        const inProgress =
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


        document.getElementById(
            "totalReports"
        ).textContent = total;


        document.getElementById(
            "progressReports"
        ).textContent = inProgress;


        document.getElementById(
            "resolvedReports"
        ).textContent = resolved;


        // ---------------------------------
        // No complaints
        // ---------------------------------

        if (
            complaints.length === 0
        ) {

            container.innerHTML = `

                <div class="empty-state">

                    <div>
                        📝
                    </div>

                    <h3>
                        No complaints yet
                    </h3>

                    <p>
                        Your reported issues
                        will appear here.
                    </p>

                    <a href="report.html">
                        Report your first issue →
                    </a>

                </div>

            `;

            return;

        }


        // ---------------------------------
        // Recent complaints
        // ---------------------------------

        container.innerHTML = "";


        const recent =
            complaints
                .slice(0, 5);


        recent.forEach(
            complaint => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "dashboard-complaint";


                item.innerHTML = `

                    <div>

                        <strong>
                            ${complaint.title}
                        </strong>

                        <span>
                            ${complaint.category}
                            •
                            ${complaint.location}
                        </span>

                    </div>

                    <div class="complaint-status">

                        ${complaint.status}

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Complaint loading error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

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
// Update Statistics
// =====================================

function updateStatistics(
    complaints
) {

    const total =
        complaints.length;


    const inProgress =
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


    document.getElementById(
        "totalReports"
    ).textContent = total;


    document.getElementById(
        "progressReports"
    ).textContent = inProgress;


    document.getElementById(
        "resolvedReports"
    ).textContent = resolved;

}


// =====================================
// Display Recent Complaints
// =====================================

function displayRecentComplaints(
    complaints
) {

    const container =
        document.getElementById(
            "complaintsContainer"
        );


    if (!container) {

        return;

    }


    if (complaints.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📝
                </div>

                <h3>
                    No complaints yet
                </h3>

                <p>
                    Your reported issues will appear here.
                </p>

                <a href="report.html">
                    Report your first issue →
                </a>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    const recent =
        complaints
            .slice(0, 5);


    recent.forEach(
        complaint => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-complaint";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            complaint.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            complaint.category
                        )}

                        •

                        ${escapeHTML(
                            complaint.location
                        )}
                    </span>

                </div>


                <div class="complaint-status">
                    ${escapeHTML(
                        complaint.status
                    )}
                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


// =====================================
// Basic HTML escaping
// =====================================

function escapeHTML(value) {

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
// Initialize Dashboard
// =====================================

loadComplaints();

loadNotifications();