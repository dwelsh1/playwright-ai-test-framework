import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/** Schema for a single recipe ingredient */
export const RecipeItemSchema = z.strictObject({
  name: z.string(),
  quantity: z.number().positive(),
});

/** Schema for a single coffee item */
export const CoffeeSchema = z.strictObject({
  name: z.string(),
  price: z.number().positive(),
  recipe: z.array(RecipeItemSchema).min(1),
  discounted: z.boolean().optional(),
});

/** Schema for GET /api/coffees response */
export const CoffeeListResponseSchema = z.array(CoffeeSchema);

// Type exports
export type RecipeItem = zOutput<typeof RecipeItemSchema>;
export type Coffee = zOutput<typeof CoffeeSchema>;
export type CoffeeListResponse = zOutput<typeof CoffeeListResponseSchema>;
