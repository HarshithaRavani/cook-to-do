import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PlanRequestSchema } from "@/types/request";
import { generatePlan } from "@/services/planGenerator";
import { sanitizeIngredients, sanitizeText, clampArray } from "@/utils/sanitize";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = PlanRequestSchema.parse(raw);

    const safeReq = {
      ...parsed,
      dietary_preference: sanitizeText(parsed.dietary_preference, 80),
      cuisine: parsed.cuisine ? sanitizeText(parsed.cuisine, 80) : undefined,
      ingredients: clampArray(sanitizeIngredients(parsed.ingredients), 80),
    };

    const plan = await generatePlan(safeReq);
    return NextResponse.json(plan, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.flatten() },
        { status: 400 },
      );
    }

    const message =
      err instanceof Error ? err.message : "Unexpected server error";

    const status =
      message.includes("rate") || message.includes("429") ? 429 : 500;

    return NextResponse.json(
      { error: "Failed to generate plan", message },
      { status },
    );
  }
}

