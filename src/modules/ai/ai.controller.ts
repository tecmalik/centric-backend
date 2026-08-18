import { Request, Response, NextFunction } from 'express';
import { classifyPackageDescription } from './ai.service';
import { AppError } from '../../middleware/error';

export const classifyPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      const error: AppError = new Error('Package description string is required');
      error.statusCode = 400;
      return next(error);
    }

    const classification = await classifyPackageDescription(description);

    res.status(200).json({
      success: true,
      data: classification,
    });
  } catch (error) {
    next(error);
  }
};
