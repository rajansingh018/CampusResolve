// =====================================
// CampusResolve Registration
// =====================================

const API_URL = "http://localhost:5002/api";


// =====================================
// Get selected college
// =====================================

const collegeData =
    localStorage.getItem("selectedCollege");


if (!collegeData) {

    window.location.href = "index.html";

}


const college =
    JSON.parse(collegeData);


// =====================================
// Apply college theme
// =====================================

document.documentElement.style.setProperty(
    "--college-primary",
    college.primaryColor
);

document.documentElement.style.setProperty(
    "--college-secondary",
    college.secondaryColor
);


// =====================================
// College information
// =====================================

document.getElementById("collegeName")
    .textContent = college.name;


document.getElementById("collegeLogo")
    .innerHTML = `
        <img
            src="${college.logo}"
            alt="${college.name}"
            onerror="this.style.display='none'"
        >
    `;


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
// Register
// =====================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


registerForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const name =
            document
                .getElementById("name")
                .value
                .trim();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const studentId =
            document
                .getElementById("studentId")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        if (
            !name ||
            !email ||
            !studentId ||
            !password
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        // Disable button

        const button =
            registerForm.querySelector(
                ".auth-btn"
            );


        button.disabled = true;

        button.textContent =
            "Creating account...";


        try {

            const response =
                await fetch(
                    `${API_URL}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name,

                            email,

                            studentId,

                            password,

                            collegeId:
                                college._id

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Registration failed."
                );

            }


            // Save user

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );


            alert(
                "Account created successfully! 🎉"
            );


            // Go login

            window.location.href =
                "login.html";


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to connect to server."
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "Create Account →";

        }

    }
);