"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../users/user.model");
const traveler_model_1 = require("../users/traveler.model");
const signToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production', {
        expiresIn: (process.env.JWT_EXPIRES_IN || '30d'),
    });
};
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email is already registered');
            error.statusCode = 400;
            return next(error);
        }
        const user = await user_model_1.User.create({
            name,
            email,
            password,
            role,
            phone,
        });
        // If traveler, initialize traveler profile
        if (role === 'TRAVELER') {
            await traveler_model_1.TravelerProfile.create({
                user: user._id,
                isVerified: false,
                trustScore: 50,
                completedDeliveries: 0,
            });
        }
        const token = signToken(user._id.toString(), user.role);
        // Remove password from output
        const userJson = user.toJSON();
        delete userJson.password;
        res.status(201).json({
            success: true,
            token,
            data: {
                user: userJson,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            const error = new Error('Incorrect email or password');
            error.statusCode = 401;
            return next(error);
        }
        const token = signToken(user._id.toString(), user.role);
        const userJson = user.toJSON();
        delete userJson.password;
        res.status(200).json({
            success: true,
            token,
            data: {
                user: userJson,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            return next(error);
        }
        let profile = null;
        if (req.user.role === 'TRAVELER') {
            profile = await traveler_model_1.TravelerProfile.findOne({ user: req.user._id });
        }
        res.status(200).json({
            success: true,
            data: {
                user: req.user,
                ...(profile && { travelerProfile: profile }),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
