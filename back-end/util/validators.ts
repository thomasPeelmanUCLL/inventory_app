import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Parameter validators
export const idParam = z.object({
    id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const inventoryIdParam = z.object({
    inventoryId: z.coerce.number().int().positive('Inventory ID must be a positive integer'),
});

export const itemIdParam = z.object({
    itemId: z.coerce.number().int().positive('Item ID must be a positive integer'),
});

// Item validators
export const itemInput = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').default(''),
    buyPrice: z.coerce.number().nonnegative('Buy price must be non-negative').finite(),
    quantity: z.coerce.number().int().nonnegative('Quantity must be non-negative'),
    buyedAt: z.coerce.date().optional(),
    inventoryId: z.coerce.number().int().positive().optional(),
});

export const itemUpdateInput = itemInput.partial();

// Sold item validators
export const soldItemInput = z.object({
    itemId: z.coerce.number().int().positive('Item ID must be a positive integer'),
    finalSellPrice: z.coerce.number().positive('Sell price must be positive').finite(),
    priceVariableName: z.string().min(1).max(255).optional(),
    isCustomPrice: z.coerce.boolean().optional().default(false),
    payedCash: z.coerce.boolean().optional().default(false),
    quantity: z.coerce.number().int().positive('Quantity must be positive'),
    soldAt: z.coerce.date().optional(),
});

export const soldItemUpdateInput = soldItemInput.partial().extend({
    itemId: z.never().optional(), // Can't change itemId on update
});

// Price variable validators
export const priceVariableInput = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    value: z.coerce.number().positive('Value must be positive').finite(),
    type: z.string().min(1, 'Type is required').max(100, 'Type too long'),
    isDefault: z.coerce.boolean().optional().default(false),
    itemId: z.coerce.number().int().positive('Item ID must be a positive integer'),
});

export const priceVariableUpdateInput = priceVariableInput.partial().extend({
    itemId: z.never().optional(), // Can't change itemId on update
});

// Inventory validators
export const inventoryInput = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').default(''),
});

export const inventoryUpdateInput = inventoryInput.partial();

// User management validators
export const addUserToInventoryInput = z.object({
    userId: z.string().uuid('Invalid user ID format'),
    role: z.enum(['owner', 'admin', 'editor', 'viewer'], {
        errorMap: () => ({ message: 'Role must be one of: owner, admin, editor, viewer' }),
    }),
});

// Analytics query validators
export const analyticsQuery = z
    .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.startDate <= data.endDate;
            }
            return true;
        },
        {
            message: 'Start date must be before end date',
        },
    );

// Pagination validators
export const paginationQuery = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Generic error handler for Zod validation
export const handleZodError = (error: z.ZodError) => {
    const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }));

    return {
        error: 'Validation failed',
        details: errors,
    };
};

// Middleware wrapper for validation
export const validateBody = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json(handleZodError(error));
            }
            next(error);
        }
    };
};

export const validateParams = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json(handleZodError(error));
            }
            next(error);
        }
    };
};

export const validateQuery = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json(handleZodError(error));
            }
            next(error);
        }
    };
};

// Async error wrapper to catch async route handler errors
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
