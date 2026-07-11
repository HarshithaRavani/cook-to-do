import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const MealSchema = z.object({
  name: nonEmptyString,
  description: nonEmptyString,
  cooking_time_minutes: z.number().int().min(1).max(24 * 60),
  estimated_cost: z.number().nonnegative(),
  ingredients: z.array(nonEmptyString).min(1).max(50),
  steps: z.array(nonEmptyString).min(1).max(30),
});

export const GroceryListSchema = z.object({
  available: z.array(nonEmptyString).max(200),
  buy: z.array(nonEmptyString).max(200),
});

export const SubstitutionSchema = z.object({
  from: nonEmptyString,
  to: nonEmptyString,
  reason: nonEmptyString.optional(),
});

export const BudgetSchema = z.object({
  estimated_total_cost: z.number().nonnegative(),
  budget: z.number().nonnegative(),
  remaining_budget: z.number(),
});

export const PlanSchema = z.object({
  breakfast: MealSchema,
  lunch: MealSchema,
  dinner: MealSchema,
  grocery_list: GroceryListSchema,
  substitutions: z.array(SubstitutionSchema).max(50),
  budget: BudgetSchema,
  todo: z.array(nonEmptyString).min(1).max(60),
});

export type Plan = z.infer<typeof PlanSchema>;

