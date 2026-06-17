const jwt = require("jsonwebtoken");
const baseDTO = require("../dtos/base.dto");

/**
 * Middleware xác thực JWT token
 * Lấy token từ header Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json(
                baseDTO({
                    success: false,
                    message: "Access token is required",
                })
            );
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Gắn thông tin user vào request
        req.user = {
            _id: decoded.userId,
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json(
                baseDTO({
                    success: false,
                    message: "Token has expired",
                })
            );
        }

        return res.status(401).json(
            baseDTO({
                success: false,
                message: "Invalid token",
            })
        );
    }
}

/**
 * Middleware phân quyền theo role
 * @param  {...string} roles - Các role được phép truy cập
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(
                baseDTO({
                    success: false,
                    message: "Authentication required",
                })
            );
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json(
                baseDTO({
                    success: false,
                    message: "You do not have permission to access this resource",
                })
            );
        }

        next();
    };
}

/**
 * Middleware xác thực JWT tùy chọn
 * Nếu có token → gắn req.user, nếu không → tiếp tục bình thường
 */
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                _id: decoded.userId,
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
        }
    } catch {
        // Token invalid/expired — just continue without user
    }
    next();
}

module.exports = { authenticate, authorize, optionalAuth };
