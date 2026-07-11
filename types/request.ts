import { z } from "zod";

export const PlanRequestSchema = z.object({
  budget: z.number().finite().positive().max(100000),
  people: z.number().int().min(1).max(20),
  ingredients: z.array(z.string()).max(80),
  dietary_preference: z.string().trim().min(1).max(80),
  cuisine: z.string().trim().min(1).max(80).optional(),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

