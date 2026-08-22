// =====================================
// CampusResolve Login
// =====================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5002/api"
        : "https://campus-resolve-backend.vercel.app/api";


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
// Selected Role
// =====================================

let selectedRole = "student";


// =====================================
// Role Buttons
// =====================================

const roleButtons =
    document.querySelectorAll(
        ".role-btn"
    );


const emailLabel =
    document.getElementById(
        "emailLabel"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const registerText =
    document.getElementById(
        "registerText"
    );


roleButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                // Remove active
                roleButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                // Add active
                button.classList.add(
                    "active"
                );


                // Store selected role
                selectedRole =
                    button.dataset.role;


                // =========================
                // STUDENT
                // =========================

                if (
                    selectedRole ===
                    "student"
                ) {

                    emailLabel.textContent =
                        "Student Email ID";

                    emailInput.placeholder =
                        "Enter your student email";


                    registerText.innerHTML = `
                        Don't have an account?
                        <a href="register.html">
                            Create one
                        </a>
                    `;

                }


                // =========================
                // ADMIN
                // =========================

                else {

                    emailLabel.textContent =
                        "Admin Email ID";

                    emailInput.placeholder =
                        "Enter your admin email";


                    registerText.innerHTML = `
                        Admin access is provided
                        by your college.
                    `;

                }

            }
        );

    }
);


// =====================================
// Change Campus
// =====================================

function changeCampus() {

    localStorage.removeItem(
        "selectedCollege"
    );

    window.location.href =
        "index.html";

}


// =====================================
// Login Form
// =====================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            emailInput.value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        // =================================
        // Validation
        // =================================

        if (!email || !password) {

            alert(
                "Please enter your email and password."
            );

            return;

        }


        // =================================
        // Button
        // =================================

        const button =
            loginForm.querySelector(
                ".auth-btn"
            );


        button.disabled = true;

        button.textContent =
            "Logging in...";


        try {

            // =================================
            // Login API
            // =================================

            const response =
                await fetch(
                    `${API_URL}/auth/login`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                email,

                                password,

                                role:
                                    selectedRole,

                                collegeId:
                                    college._id

                            })

                    }
                );


            const data =
                await response.json();


            // =================================
            // Error
            // =================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }


            // =================================
            // Store token
            // =================================

            localStorage.setItem(
                "token",
                data.token
            );


            // =================================
            // Store user
            // =================================

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );


            // =================================
            // Store demoUser
            // =================================

            localStorage.setItem(
                "demoUser",
                JSON.stringify(
                    data.user
                )
            );


            // =================================
            // Update selected college
            // =================================

            localStorage.setItem(
                "selectedCollege",
                JSON.stringify({

                    _id:
                        data.user.college.id,

                    name:
                        data.user.college.name,

                    shortName:
                        data.user.college.shortName,

                    logo:
                        data.user.college.logo,

                    primaryColor:
                        data.user.college.primaryColor,

                    secondaryColor:
                        data.user.college.secondaryColor

                })
            );


            // =================================
            // Redirect
            // =================================

            if (
                data.user.role ===
                "admin"
            ) {

                window.location.href =
                    "admin.html";

            }

            else {

                window.location.href =
                    "dashboard.html";

            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            alert(
                error.message ||
                "Unable to connect to server."
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "Login →";

        }

    }
);