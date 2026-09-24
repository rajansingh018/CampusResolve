// =======================================================
// CampusResolve - Industry Partner Registration Client
// =======================================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5002/api"
        : "https://campus-resolve-backend.vercel.app/api";

const registerForm = document.getElementById("industryRegisterForm");

registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const companyName = document.getElementById("companyName").value.trim();
    const industryCategory = document.getElementById("industryCategory").value;
    const expertise = document.getElementById("expertise").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const website = document.getElementById("website").value.trim();
    const description = document.getElementById("description").value.trim();
    const submitBtn = document.getElementById("submitBtn");

    if (!companyName || !name || !email || !password) {
        alert("Please fill all required fields.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Industry Account...";

    try {
        const response = await fetch(`${API_URL}/auth/register-industry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                companyName,
                industryCategory,
                expertise,
                name,
                email,
                password,
                website,
                description
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Industry registration failed.");
        }

        // Store session
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Industry partner account created successfully! 🎉 Welcome to CampusResolve.");
        window.location.href = "industry.html";

    } catch (error) {
        console.error("Registration error:", error);
        alert(error.message || "Failed to create account. Please check your internet connection.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register as Industry Partner →";
    }
});
