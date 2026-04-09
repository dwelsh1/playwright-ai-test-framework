import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';
import { CheckoutItemSchema } from './checkoutSchema';

/** Schema for a single order (GET /api/orders/:id, items in GET /api/orders) */
export const OrderSchema = z.strictObject({
  id: z.number().int().positive(),
  order_id: z.string().startsWith('ORD-'),
  name: z.string(),
  email: z.string(),
  subscribe: z.boolean(),
  items: z.array(CheckoutItemSchema).min(1),
  total: z.number().nonnegative(),
  created_at: z.string(),
  store_id: z.union([z.string(), z.number().int()]).nullable(),
  store_name: z.string().nullable(),
  pickup_address: z.string().nullable(),
  user_latitude: z.number().nullable(),
  user_longitude: z.number().nullable(),
  distance_miles: z.number().nullable(),
  eligibility_status: z.string().nullable(),
});

/** Schema for GET /api/orders response */
export const OrderListResponseSchema = z.array(OrderSchema);

// Type exports
export type Order = zOutput<typeof OrderSchema>;
export type OrderListResponse = zOutput<typeof OrderListResponseSchema>;
