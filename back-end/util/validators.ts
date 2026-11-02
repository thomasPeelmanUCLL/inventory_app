import { z } from 'zod';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { formatZodError } from '../middleware/error.middleware';

// ---- Params ----

const positiveId = (label: string) =>
    z.coerce.number().int().positive(`${label} must be a positive integer`);

export const idParam = z.object({ id: positiveId('ID') });
export const inventoryIdParam = z.object({ inventoryId: positiveId('Inventory ID') });
export const itemIdParam = z.object({ itemId: positiveId('Item ID') });
export const inventoryUserParams = z.object({
    id: positiveId('Inventory ID'),
    userId: z.string().min(1, 'User ID is required'),
});

// ---- Shared field types ----

const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;

/** Non-negative euro amount with at most 2 decimals, as a number or numeric string. */
const money = z
    .union([
        z.number(),
        z
            .string()
            .trim()
            .regex(/^\d+(\.\d{1,2})?$/, 'Value must be a non-negative number with at most 2 decimals')
            .transform(Number),
    ])
    .pipe(
        z
            .number()
            .finite()
            .nonnegative('Value must be non-negative')
            .refine(twoDecimals, 'Value must have at most 2 decimals'),
    );

/** Optional free text where '' and whitespace mean "clear it". */
const optionalText = z
    .string()
    .nullish()
    .transform((value) => (value == null ? value : value.trim() || null));

// ---- Items ----

const priceVariableFields = z.object({
    name: z.string().trim().min(1, 'Price variable name is required').max(255, 'Name too long'),
    value: z.coerce.number().finite().nonnegative('Value cannot be negative'),
    type: z.enum(['PERCENTAGE', 'FIXED'], {
        errorMap: () => ({ message: 'Type must be PERCENTAGE or FIXED' }),
    }),
    isDefault: z.coerce.boolean().optional().default(false),
});

const itemFields = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').default(''),
    buyPrice: z.coerce.number().finite().nonnegative('Buy price must be non-negative'),
    quantity: z.coerce.number().int().nonnegative('Quantity must be non-negative'),
    buyedAt: z.coerce.date().optional(),
    inventoryId: positiveId('Inventory ID').optional(),
    websiteCategory: optionalText,
    websiteEmoji: optionalText,
    websiteSortOrder: z.coerce.number().int('Website sort order must be an integer').optional(),
    memberPrice: money.nullish(),
    nonMemberPrice: money.nullish(),
    publishedToWebsite: z.coerce.boolean().optional(),
    priceVariables: z.array(priceVariableFields).optional(),
});

/** Publishing needs a category and both prices. Only checked when the body itself publishes. */
const requirePublishFields = (data: Partial<z.infer<typeof itemFields>>, ctx: z.RefinementCtx) => {
    if (!data.publishedToWebsite) return;
    const missing: Array<[keyof typeof data, string]> = [
        ['websiteCategory', 'Website category is required when publishing'],
        ['memberPrice', 'Member price is required when publishing'],
        ['nonMemberPrice', 'Non-member price is required when publishing'],
    ];
    for (const [field, message] of missing) {
        if (data[field] == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    }
};

export const itemInput = itemFields.superRefine(requirePublishFields);
export const itemUpdateInput = itemFields
    .omit({ priceVariables: true })
    .partial()
    .superRefine(requirePublishFields);

export type ItemInput = z.infer<typeof itemInput>;
export type ItemUpdateInput = z.infer<typeof itemUpdateInput>;

// ---- Sold items ----

/** The column is paidCash; older clients sent payedCash or paidWithCash. Accept all three. */
const normalizePaidCash = (body: unknown) => {
    if (!body || typeof body !== 'object' || 'paidCash' in body) return body;
    const { payedCash, paidWithCash, ...rest } = body as Record<string, unknown>;
    const paidCash = payedCash ?? paidWithCash;
    return paidCash === undefined ? rest : { ...rest, paidCash };
};

const soldItemFields = z.object({
    itemId: positiveId('Item ID'),
    finalSellPrice: z.coerce.number().finite().positive('Sell price must be positive'),
    priceVariableName: z.string().min(1).max(255).optional(),
    isCustomPrice: z.coerce.boolean().optional().default(false),
    paidCash: z.coerce.boolean().optional().default(false),
    quantity: z.coerce.number().int().positive('Quantity must be positive'),
    soldAt: z.coerce.date().optional(),
});

export const soldItemInput = z.preprocess(normalizePaidCash, soldItemFields);
export const soldItemUpdateInput = z.preprocess(
    normalizePaidCash,
    soldItemFields.omit({ itemId: true }).partial(),
);

export type SoldItemInput = z.infer<typeof soldItemFields>;
export type SoldItemUpdateInput = Partial<Omit<SoldItemInput, 'itemId'>>;

// ---- Price variables ----

export const priceVariableInput = priceVariableFields.extend({ itemId: positiveId('Item ID') });
export const priceVariableUpdateInput = priceVariableFields.partial();

// ---- Inventories ----

export const inventoryInput = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').default(''),
});
export const inventoryUpdateInput = inventoryInput.partial();

export const INVENTORY_ROLES = ['owner', 'editor', 'viewer'] as const;
export type InventoryRole = (typeof INVENTORY_ROLES)[number];

/** Add a member by email (what the UI sends) or by user id. */
export const addUserToInventoryInput = z
    .object({
        email: z.string().trim().email('Invalid email').optional(),
        userId: z.string().min(1).optional(),
        role: z.enum(INVENTORY_ROLES, {
            errorMap: () => ({ message: 'Role must be one of: owner, editor, viewer' }),
        }),
    })
    .refine((data) => data.email || data.userId, { message: 'Email or userId is required' });

// ---- Analytics ----

export const analyticsQuery = z
    .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    })
    .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
        message: 'Start date must be before end date',
    });

// ---- Middleware ----

const validate =
    (source: 'body' | 'params' | 'query', schema: z.ZodTypeAny): RequestHandler =>
    (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) return res.status(400).json(formatZodError(result.error));
        // req.query is a getter in newer Express; assign onto it instead of replacing it
        if (source === 'query') Object.assign(req.query, result.data);
        else req[source] = result.data;
        next();
    };

export const validateBody = (schema: z.ZodTypeAny) => validate('body', schema);
export const validateParams = (schema: z.ZodTypeAny) => validate('params', schema);
export const validateQuery = (schema: z.ZodTypeAny) => validate('query', schema);

/** Forwards rejected promises from async handlers to the error middleware. */
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
        fn(req, res, next).catch(next);
    };
