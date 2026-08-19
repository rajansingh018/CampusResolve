// =====================================
// CampusResolve Authentication Frontend
// =====================================

const collegeData =
    localStorage.getItem("selectedCollege");


// -------------------------------------
// Make sure college was selected
// -------------------------------------

if (!collegeData) {

    window.location.href = "index.html";

}


// -------------------------------------
// Load college
// -------------------------------------

const college =
    JSON.parse(collegeData);


// -------------------------------------
// Apply college theme
// -------------------------------------

document.documentElement.style.setProperty(
    "--college-primary",
    college.primaryColor
);

document.documentElement.style.setProperty(
    "--college-secondary",
    college.secondaryColor
);


// -------------------------------------
// College name
// -------------------------------------

const collegeName =
    document.getElementById("collegeName");

if (collegeName) {

    collegeName.textContent =
        college.name;

}


// -------------------------------------
// College logo
// -------------------------------------

const collegeLogo =
    document.getElementById("collegeLogo");

if (collegeLogo) {

    collegeLogo.innerHTML = `
        <img
            src="${college.logo}"
            alt="${college.name}"
            onerror="this.style.display='none'"
        >
    `;

}


// -------------------------------------
// Change Campus
// -------------------------------------

function changeCampus() {

    localStorage.removeItem("selectedCollege");

    window.location.href = "index.html";

}


// -------------------------------------
// Login form
// -------------------------------------

const loginForm =
    document.getElementById("loginForm");


loginForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        alert("Please fill all fields.");

        return;

    }


    /*
        TEMPORARY LOGIN

        Backend authentication will be connected later.
    */

    localStorage.setItem(
        "demoUser",
        JSON.stringify({
            email: email,
            collegeId: college.id,
            collegeName: college.name
        })
    );


    window.location.href = "dashboard.html";

});