"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../modules/users/user.model");
const protect = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            const error = new Error('You are not logged in. Please log in to get access.');
            error.statusCode = 401;
            return next(error);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
        const currentUser = await user_model_1.User.findById(decoded.id);
        if (!currentUser) {
            const error = new Error('The user belonging to this token no longer exists.');
            error.statusCode = 401;
            return next(error);
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        const authError = new Error('Invalid token or token has expired.');
        authError.statusCode = 401;
        next(authError);
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            const error = new Error('Authentication required.');
            error.statusCode = 401;
            return next(error);
        }
        if (!roles.includes(req.user.role)) {
            const error = new Error('You do not have permission to perform this action.');
            error.statusCode = 403;
            return next(error);
        }
        next();
    };
};
exports.restrictTo = restrictTo;
