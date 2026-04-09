import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/** Schema for a single cart item */
export const CartItemSchema = z.strictObject({
  name: z.string(),
  quantity: z.number().int().positive(),
});

/** Schema for cart responses (GET /api/cart, POST /api/cart, DELETE /api/cart/*) */
export const CartResponseSchema = z.array(CartItemSchema);

// Type exports
export type CartItem = zOutput<typeof CartItemSchema>;
export type CartResponse = zOutput<typeof CartResponseSchema>;
