"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyPackage = void 0;
const ai_service_1 = require("./ai.service");
const classifyPackage = async (req, res, next) => {
    try {
        const { description } = req.body;
        if (!description || typeof description !== 'string') {
            const error = new Error('Package description string is required');
            error.statusCode = 400;
            return next(error);
        }
        const classification = await (0, ai_service_1.classifyPackageDescription)(description);
        res.status(200).json({
            success: true,
            data: classification,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.classifyPackage = classifyPackage;
