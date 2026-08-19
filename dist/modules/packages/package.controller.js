"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageById = exports.getAllPackages = exports.getMyPackages = exports.createPackage = void 0;
const package_model_1 = require("./package.model");
const matching_service_1 = require("../matching/matching.service");
const createPackage = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        const { pickupLocation, destination, description, category, weight, declaredValue, recipient } = req.body;
        const pkg = await package_model_1.Package.create({
            user: req.user._id,
            pickupLocation,
            destination,
            description,
            category,
            weight,
            declaredValue,
            recipient,
            status: 'CREATED',
        });
        // Run matching engine synchronously for the MVP response
        const matches = await (0, matching_service_1.findMatchesForPackage)(pkg);
        res.status(201).json({
            success: true,
            message: 'Package created and matched successfully',
            data: {
                package: pkg,
                matches,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPackage = createPackage;
const getMyPackages = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        const packages = await package_model_1.Package.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: {
                packages,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPackages = getMyPackages;
const getAllPackages = async (_req, res, next) => {
    try {
        const packages = await package_model_1.Package.find().populate('user', 'name email phone').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: {
                packages,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPackages = getAllPackages;
const getPackageById = async (req, res, next) => {
    try {
        const pkg = await package_model_1.Package.findById(req.params.id).populate('user', 'name email phone');
        if (!pkg) {
            const error = new Error('Package not found');
            error.statusCode = 404;
            return next(error);
        }
        res.status(200).json({
            success: true,
            data: {
                package: pkg,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPackageById = getPackageById;
