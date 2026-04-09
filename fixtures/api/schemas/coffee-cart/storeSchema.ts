import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/** Schema for a single store (GET /api/stores, GET /api/stores/:id) */
export const StoreSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  pickup_radius_miles: z.number().positive(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

/** Schema for GET /api/stores response */
export const StoreListResponseSchema = z.array(StoreSchema);

/** Schema for POST /api/stores/nearest response */
export const NearestStoreResponseSchema = z.strictObject({
  store: StoreSchema.nullable(),
  distance_miles: z.number().nullable(),
  is_within_radius: z.boolean(),
});

/** Schema for POST /api/stores/eligibility response */
export const StoreEligibilityResponseSchema = z.strictObject({
  store_id: z.number().int().positive(),
  store_name: z.string(),
  distance_miles: z.number(),
  is_within_radius: z.boolean(),
  pickup_radius_miles: z.number().positive(),
});

// Type exports
export type Store = zOutput<typeof StoreSchema>;
export type StoreListResponse = zOutput<typeof StoreListResponseSchema>;
export type NearestStoreResponse = zOutput<typeof NearestStoreResponseSchema>;
export type StoreEligibilityResponse = zOutput<typeof StoreEligibilityResponseSchema>;
