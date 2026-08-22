const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");

const complaintRoutes =
    require("./routes/complaintRoutes");

const connectDB =
    require("./config/db");

const notificationRoutes =
    require("./routes/notificationRoutes");

const checkEscalations =
    require("./services/escalationService");


// Connect database

connectDB();


const app = express();


// Middleware

app.use(
    cors()
);

app.use(
    express.json()
);


// Routes

app.use(
    "/api/auth",
    require("./routes/authRoutes")
);

app.use(
    "/api/colleges",
    require("./routes/collegeRoutes")
);

app.use(
    "/api/complaints",
    complaintRoutes
);
app.use(
    "/api/admin/complaints",
    require("./routes/adminComplaintRoutes")
);

app.use(
    "/api/admin",
    require("./routes/adminRoutes")
);
app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/ai",
    require("./routes/aiRoutes")
);


// Health check

app.get("/", (req, res) => {

    res.json({
        message: "CampusResolve API is running 🚀"
    });

});


const PORT =
    process.env.PORT || 5002;


app.listen(PORT, () => {

    console.log(
        `CampusResolve server running on http://localhost:${PORT}`
    );

    // Run escalation check immediately when server starts
    checkEscalations();

    // Run escalation check every 10 minutes
    setInterval(
        checkEscalations,
        10 * 60 * 1000
    );

});