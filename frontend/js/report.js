// =====================================
// CampusResolve - Report Issue
// =====================================

const API_URL =
    "https://campus-resolve-backend.vercel.app/api";


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
// Character Counter
// =====================================

const description =
    document.getElementById(
        "description"
    );

const characterCount =
    document.getElementById(
        "characterCount"
    );


description.addEventListener(
    "input",
    function () {

        characterCount.textContent =
            description.value.length;

    }
);

// =====================================
// Problem Image
// =====================================

const imageInput =
    document.getElementById(
        "problemImage"
    );

const imagePreview =
    document.getElementById(
        "imagePreview"
    );

const previewImage =
    document.getElementById(
        "previewImage"
    );

const removeImage =
    document.getElementById(
        "removeImage"
    );

imageInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        if (!file) {
            return;
        }


        // Check image type

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please select a valid image."
            );

            this.value = "";

            return;

        }


        // Check 5MB limit

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Image size must be less than 5MB."
            );

            this.value = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                previewImage.src =
                    event.target.result;

                imagePreview.style.display =
                    "block";

            };


        reader.readAsDataURL(
            file
        );

    }
);

removeImage.addEventListener(
    "click",
    function () {

        imageInput.value = "";

        previewImage.src = "";

        imagePreview.style.display =
            "none";

    }
);


// =====================================
// Report Form
// =====================================

const reportForm =
    document.getElementById(
        "reportForm"
    );

const submitBtn =
    document.getElementById(
        "submitBtn"
    );


reportForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const title =
            document.getElementById(
                "title"
            ).value.trim();


        const category =
            document.getElementById(
                "category"
            ).value;


        const priority =
            document.getElementById(
                "priority"
            ).value;


        const location =
            document.getElementById(
                "location"
            ).value.trim();


        const descriptionValue =
            description.value.trim();


        if (
            !title ||
            !category ||
            !location ||
            !descriptionValue
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        // Disable button

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Submitting...";


        try {
            const formData =
                new FormData();


            formData.append(
                "title",
                title
            );


            formData.append(
                "description",
                descriptionValue
            );


            formData.append(
                "category",
                category
            );


            formData.append(
                "location",
                location
            );


            formData.append(
                "priority",
                priority
            );


            // Add image if selected

            if (
                imageInput.files.length > 0
            ) {

                formData.append(
                    "problemImage",
                    imageInput.files[0]
                );

            }

            const response =
                await fetch(
                    `${API_URL}/complaints`,
                    {

                        method: "POST",
                        headers: {

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body: formData



                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to submit report."
                );

            }


            // Success

            alert(
                "Issue reported successfully! 🎉"
            );


            // Go dashboard

            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Report error:",
                error
            );


            alert(
                error.message ||
                "Unable to connect to server."
            );


            submitBtn.disabled =
                false;

            submitBtn.textContent =
                "Submit Report →";

        }

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
        "user"
    );

    localStorage.removeItem(
        "selectedCollege"
    );


    window.location.href =
        "index.html";

}