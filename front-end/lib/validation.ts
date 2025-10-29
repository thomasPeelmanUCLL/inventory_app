import { z } from 'zod';

// ========================================
// INVENTORY VALIDATION
// ========================================

export const inventorySchema = z.object({
  name: z.string().min(3, 'Inventory name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
});

export const inventoryUpdateSchema = inventorySchema.partial();

export type InventoryInput = z.infer<typeof inventorySchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;

// ========================================
// ITEM VALIDATION
// ========================================

export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  buyPrice: z.union([
    z.number().min(0, 'Buy price cannot be negative'),
    z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Buy price must be a positive number')
  ]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  buyedAt: z.string().datetime('Invalid date format').optional().or(z.literal('')),
  inventoryId: z.number().int().positive('Invalid inventory ID').optional(),
});

export const itemUpdateSchema = itemSchema.partial().extend({
  buyedAt: z.string().datetime().optional().or(z.literal('').transform(() => undefined)),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

// ========================================
// SOLD ITEM VALIDATION
// ========================================

export const soldItemSchema = z.object({
  itemId: z.number().int().positive('Invalid item ID'),
  finalSellPrice: z.union([
    z.number().min(0.01, 'Sell price must be positive'),
    z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Sell price must be positive')
  ]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  priceVariableName: z.string().max(100, 'Price variable name too long').optional(),
  isCustomPrice: z.boolean().default(false),
  payedCash: z.boolean().default(false),
  soldAt: z.string().datetime('Invalid date format').optional(),
});

export const soldItemUpdateSchema = soldItemSchema.partial().extend({
  itemId: z.number().int().positive().optional(), // Can't change itemId in updates
});

export type SoldItemInput = z.infer<typeof soldItemSchema>;
export type SoldItemUpdateInput = z.infer<typeof soldItemUpdateSchema>;

// ========================================
// PRICE VARIABLE VALIDATION
// ========================================

export const priceVariableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  value: z.union([
    z.number().min(0, 'Value cannot be negative'),
    z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Value must be a positive number')
  ]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  type: z.enum(['PERCENTAGE', 'FIXED'], { errorMap: () => ({ message: 'Type must be PERCENTAGE or FIXED' }) }),
  isDefault: z.boolean().default(false),
  itemId: z.number().int().positive('Invalid item ID'),
});

export const priceVariableUpdateSchema = priceVariableSchema.partial().extend({
  itemId: z.number().int().positive().optional(), // Can't change itemId in updates
});

export type PriceVariableInput = z.infer<typeof priceVariableSchema>;
export type PriceVariableUpdateInput = z.infer<typeof priceVariableUpdateSchema>;

// ========================================
// ANALYTICS VALIDATION
// ========================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'Start date must be before end date');

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

// ========================================
// USER MANAGEMENT VALIDATION
// ========================================

export const userInviteSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.enum(['owner', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be owner, editor, or viewer' })
  }),
});

export type UserInviteInput = z.infer<typeof userInviteSchema>;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Parse and validate form data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: { field: string; message: string }[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Safe parse with defaults for optional fields
 */
export function safeParseWithDefaults<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaults: Partial<T> = {}
): T {
  const result = schema.safeParse({ ...defaults, ...data });
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}

/**
 * Format validation errors for display in UI
 */
export function formatValidationErrors(errors: { field: string; message: string }[]): string {
  if (errors.length === 1) {
    return errors[0].message;
  }
  return errors.map(err => `${err.field}: ${err.message}`).join('\n');
}
