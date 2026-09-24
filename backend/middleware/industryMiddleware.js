// =======================================================
// CampusResolve - Industry Partner Authorization Middleware
// =======================================================

const industryOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required. Please login."
        });
    }

    if (req.user.role !== "industry") {
        return res.status(403).json({
            message: "Access denied. Industry partner account required."
        });
    }

    next();
};

module.exports = industryOnly;
