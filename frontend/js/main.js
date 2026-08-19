// =====================================
// CampusResolve - College System
// =====================================

let colleges = [];

let selectedCollege = null;


// =====================================
// Backend API
// =====================================

const API_URL = "http://localhost:5002/api";


// =====================================
// Fetch Colleges from MongoDB
// =====================================

async function loadColleges() {

    try {

        const response =
            await fetch(`${API_URL}/colleges`);


        if (!response.ok) {

            throw new Error(
                "Unable to fetch colleges"
            );

        }


        colleges = await response.json();


        console.log(
            "Colleges loaded:",
            colleges
        );


        renderColleges(colleges);


    } catch (error) {

        console.error(
            "College loading error:",
            error
        );


        const collegeList =
            document.getElementById(
                "collegeList"
            );


        if (collegeList) {

            collegeList.innerHTML = `

                <div style="
                    padding:20px;
                    text-align:center;
                    color:#ef4444;
                    font-size:13px;
                ">

                    Unable to load colleges.

                    <br>

                    Please make sure the
                    CampusResolve server is running.

                </div>

            `;

        }

    }
}


// =====================================
// Open Campus Selector
// =====================================

function openCampusSelector() {

    const modal =
        document.getElementById(
            "campusModal"
        );


    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";


    loadColleges();

}


// =====================================
// Close Campus Selector
// =====================================

function closeCampusSelector() {

    const modal =
        document.getElementById(
            "campusModal"
        );


    modal.classList.remove("active");

    document.body.style.overflow =
        "auto";

}


// =====================================
// Render Colleges
// =====================================

function renderColleges(list) {

    const collegeList =
        document.getElementById(
            "collegeList"
        );


    if (!collegeList) {
        return;
    }


    collegeList.innerHTML = "";


    if (list.length === 0) {

        collegeList.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
                color:#737e91;
                font-size:13px;
            ">

                No college found.

            </div>

        `;

        return;
    }


    list.forEach(college => {

        const option =
            document.createElement("div");


        option.className =
            "college-option";


        if (
            selectedCollege &&
            selectedCollege._id === college._id
        ) {

            option.classList.add(
                "selected"
            );

        }


        option.innerHTML = `

            <img
                src="${college.logo}"
                alt="${college.name}"
                onerror="this.style.display='none'"
            >

            <div class="college-info">

                <strong>
                    ${college.name}
                </strong>

                <span>
                    ${college.city},
                    ${college.state}
                </span>

            </div>

        `;


        option.addEventListener(
            "click",
            () => {

                selectCollege(college);

            }
        );


        collegeList.appendChild(option);

    });

}


// =====================================
// Search College
// =====================================

function searchCollege() {

    const searchInput =
        document.getElementById(
            "collegeSearch"
        );


    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    const filteredColleges =
        colleges.filter(college => {

            return (

                college.name
                    .toLowerCase()
                    .includes(searchValue)

                ||

                college.shortName
                    .toLowerCase()
                    .includes(searchValue)

                ||

                college.city
                    .toLowerCase()
                    .includes(searchValue)

                ||

                college.state
                    .toLowerCase()
                    .includes(searchValue)

            );

        });


    renderColleges(
        filteredColleges
    );

}


// =====================================
// Select College
// =====================================

function selectCollege(college) {

    selectedCollege =
        college;


    renderColleges(
        colleges.filter(c => {

            const searchValue =
                document
                    .getElementById(
                        "collegeSearch"
                    )
                    .value
                    .toLowerCase()
                    .trim();


            return (

                c.name
                    .toLowerCase()
                    .includes(searchValue)

                ||

                c.shortName
                    .toLowerCase()
                    .includes(searchValue)

                ||

                c.city
                    .toLowerCase()
                    .includes(searchValue)

                ||

                c.state
                    .toLowerCase()
                    .includes(searchValue)

            );

        })
    );


    const continueBtn =
        document.getElementById(
            "continueBtn"
        );


    continueBtn.disabled =
        false;


    continueBtn.innerHTML =
        `Continue to ${college.shortName} →`;

}


// =====================================
// Continue to Campus
// =====================================

function continueToCampus() {

    if (!selectedCollege) {

        return;

    }


    // Save selected college

    localStorage.setItem(

        "selectedCollege",

        JSON.stringify(
            selectedCollege
        )

    );


    // Go to login

    window.location.href =
        "login.html";

}


// =====================================
// Load Saved College
// =====================================

function loadSavedCollege() {

    const savedCollege =
        localStorage.getItem(
            "selectedCollege"
        );


    if (!savedCollege) {

        return;

    }


    try {

        selectedCollege =
            JSON.parse(
                savedCollege
            );


    } catch (error) {

        console.error(
            "Unable to load saved college."
        );

    }

}


// =====================================
// Close Modal on Outside Click
// =====================================

const campusModal =
    document.getElementById(
        "campusModal"
    );


if (campusModal) {

    campusModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target === this
            ) {

                closeCampusSelector();

            }

        }
    );

}


// =====================================
// Initialize
// =====================================

loadSavedCollege();