import { z } from 'zod/v4';
import { RecipeItemSchema } from './coffeeSchema';

/** One GraphQL error entry (extensions left loose for servers that add codes). */
export const GraphQLErrorItemSchema = z.object({
  message: z.string(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GraphQL exposes `discounted` as `null` for non-discounted items,
 * while the REST API omits the field entirely. Normalize null -> undefined
 * so GraphQL and REST payloads can be compared consistently.
 */
export const GraphQLCoffeeSchema = z
  .strictObject({
    name: z.string(),
    price: z.number().positive(),
    recipe: z.array(RecipeItemSchema).min(1),
    discounted: z.boolean().nullable().optional(),
  })
  .transform((coffee) => {
    if (coffee.discounted === null) {
      const rest = { ...coffee };
      delete rest.discounted;
      return rest;
    }

    return coffee;
  });

export const GraphQLCoffeeListResponseSchema = z.array(GraphQLCoffeeSchema);

/** `data` shape for `query { coffees { ... } }` against Coffee Cart. */
export const CoffeesQueryDataSchema = z.strictObject({
  coffees: GraphQLCoffeeListResponseSchema,
});

export const CoffeesGraphQLResponseSchema = z.strictObject({
  data: CoffeesQueryDataSchema.optional(),
  errors: z.array(GraphQLErrorItemSchema).optional(),
});

export type CoffeesGraphQLResponse = z.infer<typeof CoffeesGraphQLResponseSchema>;
