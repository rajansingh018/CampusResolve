// =======================================================
// CampusResolve - Department Staff Authorization Middleware
// =======================================================

const staffOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required. Please login."
        });
    }

    if (req.user.role !== "department_staff") {
        return res.status(403).json({
            message: "Access denied. Department Staff access required."
        });
    }

    if (!req.user.departmentId && !req.user.department) {
        return res.status(403).json({
            message: "No department assigned to this staff account."
        });
    }

    next();
};

module.exports = staffOnly;
