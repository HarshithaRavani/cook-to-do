import type { PlanRequest } from "@/types/request";
import type { Plan } from "@/types/plan";
import { PlanSchema } from "@/types/plan";
import { getOpenAIClient } from "@/services/openai";

const PlanJsonSchema = {
  name: "daily_cooking_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "breakfast",
      "lunch",
      "dinner",
      "grocery_list",
      "substitutions",
      "budget",
      "todo",
    ],
    properties: {
      breakfast: { $ref: "#/$defs/meal" },
      lunch: { $ref: "#/$defs/meal" },
      dinner: { $ref: "#/$defs/meal" },
      grocery_list: {
        type: "object",
        additionalProperties: false,
        required: ["available", "buy"],
        properties: {
          available: { type: "array", items: { type: "string" } },
          buy: { type: "array", items: { type: "string" } },
        },
      },
      substitutions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["from", "to"],
          properties: {
            from: { type: "string" },
            to: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
      budget: {
        type: "object",
        additionalProperties: false,
        required: ["estimated_total_cost", "budget", "remaining_budget"],
        properties: {
          estimated_total_cost: { type: "number" },
          budget: { type: "number" },
          remaining_budget: { type: "number" },
        },
      },
      todo: { type: "array", items: { type: "string" } },
    },
    $defs: {
      meal: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "description",
          "cooking_time_minutes",
          "estimated_cost",
          "ingredients",
          "steps",
        ],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          cooking_time_minutes: { type: "integer" },
          estimated_cost: { type: "number" },
          ingredients: { type: "array", items: { type: "string" } },
          steps: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

function buildPrompt(req: PlanRequest, retryForBudget: boolean): string {
  const cuisineLine = req.cuisine ? `Preferred cuisine: ${req.cuisine}\n` : "";
  const ingredients =
    req.ingredients.length === 0 ? "None" : req.ingredients.join(", ");

  return [
    "Generate ONE structured daily cooking plan for a single day.",
    "",
    `Daily budget: ${req.budget}`,
    `Number of people: ${req.people}`,
    `Dietary preference: ${req.dietary_preference}`,
    cuisineLine.trimEnd(),
    `Ingredients already available: ${ingredients}`,
    "",
    "Hard requirements:",
    "- Return valid JSON only (no markdown, no commentary).",
    "- Use available ingredients first before adding grocery items.",
    "- Grocery list MUST be split into: available, buy.",
    "- Include affordable ingredient substitutions only when appropriate.",
    "- Budget object must include: estimated_total_cost, budget, remaining_budget.",
    "- remaining_budget = budget - estimated_total_cost.",
    "- Todo must be an ordered list of short checklist items.",
    retryForBudget
      ? "- The previous plan exceeded budget. Regenerate a more economical plan that stays within budget."
      : "",
  ]
    .filter((l) => l.length > 0)
    .join("\n");
}

export async function generatePlan(req: PlanRequest): Promise<Plan> {
  const client = getOpenAIClient();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retryForBudget = attempt > 0;
    const prompt = buildPrompt(req, retryForBudget);

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a careful meal planner. Follow the JSON schema strictly and never output anything except the JSON object.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: PlanJsonSchema },
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty AI response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Malformed AI JSON response");
    }

    const plan = PlanSchema.parse(parsed);
    const withinBudget = plan.budget.estimated_total_cost <= req.budget + 1e-9;
    if (withinBudget) return plan;
  }

  throw new Error("Unable to generate a plan within budget");
}
