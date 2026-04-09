import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/** Schema for a checkout item in the request/response */
export const CheckoutItemSchema = z.strictObject({
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

/** Schema for the order object in the checkout response */
export const CheckoutOrderSchema = z.strictObject({
  orderId: z.string().startsWith('ORD-'),
  name: z.string(),
  email: z.string(),
  subscribe: z.boolean(),
  items: z.array(CheckoutItemSchema).min(1),
  total: z.number().nonnegative(),
  createdAt: z.string(),
  store_id: z.string().nullable(),
  store_name: z.string().nullable(),
});

/** Schema for POST /api/checkout response */
export const CheckoutResponseSchema = z.strictObject({
  message: z.string(),
  order: CheckoutOrderSchema,
});

/** Schema for checkout request payload */
export const CheckoutRequestSchema = z.strictObject({
  name: z.string().min(1),
  email: z.string().email(),
  subscribe: z.boolean().optional(),
  items: z.array(CheckoutItemSchema).min(1),
});

// Type exports
export type CheckoutItem = zOutput<typeof CheckoutItemSchema>;
export type CheckoutOrder = zOutput<typeof CheckoutOrderSchema>;
export type CheckoutResponse = zOutput<typeof CheckoutResponseSchema>;
export type CheckoutRequest = zOutput<typeof CheckoutRequestSchema>;
