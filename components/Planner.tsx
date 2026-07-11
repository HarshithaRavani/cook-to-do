"use client";

import { useMemo, useState } from "react";
import { PlanSchema, type Plan } from "@/types/plan";

type UiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; plan: Plan };

function parseIngredients(text: string): string[] {
  return text
    .split(/\r?\n|,/g)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function Planner() {
  const [budget, setBudget] = useState<string>("30");
  const [people, setPeople] = useState<string>("2");
  const [dietaryPreference, setDietaryPreference] = useState<string>("Vegetarian");
  const [cuisine, setCuisine] = useState<string>("");
  const [ingredientsText, setIngredientsText] = useState<string>("");
  const [ui, setUi] = useState<UiState>({ status: "idle" });

  const ingredientsPreview = useMemo(
    () => parseIngredients(ingredientsText).slice(0, 12),
    [ingredientsText],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUi({ status: "loading" });

    const budgetNum = Number(budget);
    const peopleNum = Number(people);
    const ingredients = parseIngredients(ingredientsText);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          budget: budgetNum,
          people: peopleNum,
          ingredients,
          dietary_preference: dietaryPreference,
          cuisine: cuisine.trim().length > 0 ? cuisine : undefined,
        }),
      });

      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Request failed";
        setUi({ status: "error", message });
        return;
      }

      const plan = PlanSchema.parse(data);
      setUi({ status: "success", plan });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected client error";
      setUi({ status: "error", message });
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Cook To-Do Planner
        </h1>
        <p className="mt-2 text-zinc-600">
          Generate a one-day cooking plan with groceries, substitutions, budget
          breakdown, and an interactive cooking checklist.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Budget</span>
              <input
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="e.g., 30"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">
                Number of people
              </span>
              <input
                inputMode="numeric"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="e.g., 2"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">
                Dietary preference
              </span>
              <input
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="e.g., Vegetarian, Vegan, Keto"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">
                Preferred cuisine (optional)
              </span>
              <input
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="e.g., Indian, Italian"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">
                Ingredients already available
              </span>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className="min-h-28 resize-y rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder={"One per line (or comma-separated)\nRice\nEggs\nTomatoes"}
              />
              {ingredientsPreview.length > 0 ? (
                <p className="text-xs text-zinc-500">
                  Preview: {ingredientsPreview.join(", ")}
                  {parseIngredients(ingredientsText).length > 12 ? "…" : ""}
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Tip: Add what you already have to reduce the grocery list.
                </p>
              )}
            </label>

            <button
              type="submit"
              disabled={ui.status === "loading"}
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ui.status === "loading" ? "Generating…" : "Generate Plan"}
            </button>

            {ui.status === "error" ? (
              <div
                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {ui.message}
              </div>
            ) : null}
          </div>
        </form>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          {ui.status === "idle" ? (
            <div className="grid gap-3">
              <h2 className="text-lg font-semibold text-zinc-950">
                Your plan will appear here
              </h2>
              <p className="text-sm text-zinc-600">
                Fill out the form and click Generate Plan. The plan includes
                breakfast, lunch, dinner, grocery list, substitutions, budget
                breakdown, and a cooking checklist.
              </p>
            </div>
          ) : null}

          {ui.status === "loading" ? (
            <div className="grid gap-2" aria-live="polite">
              <h2 className="text-lg font-semibold text-zinc-950">
                Generating…
              </h2>
              <p className="text-sm text-zinc-600">
                This usually takes a few seconds.
              </p>
            </div>
          ) : null}

          {ui.status === "success" ? <PlanView plan={ui.plan} /> : null}
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-zinc-950">{children}</h3>;
}

function Money({ value }: { value: number }) {
  return (
    <span className="tabular-nums">{Number.isFinite(value) ? value.toFixed(2) : value}</span>
  );
}

function PlanView({ plan }: { plan: Plan }) {
  const [done, setDone] = useState<Set<number>>(() => new Set());

  function toggle(idx: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <SectionTitle>Budget</SectionTitle>
        <div className="grid gap-1 text-sm text-zinc-700">
          <div>
            Estimated total: <Money value={plan.budget.estimated_total_cost} />
          </div>
          <div>
            Budget: <Money value={plan.budget.budget} />
          </div>
          <div>
            Remaining: <Money value={plan.budget.remaining_budget} />
          </div>
        </div>
      </div>

      <MealCard title="Breakfast" meal={plan.breakfast} />
      <MealCard title="Lunch" meal={plan.lunch} />
      <MealCard title="Dinner" meal={plan.dinner} />

      <div className="grid gap-4">
        <SectionTitle>Grocery List</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ListCard title="Already Available" items={plan.grocery_list.available} />
          <ListCard title="Need to Buy" items={plan.grocery_list.buy} />
        </div>
      </div>

      <div className="grid gap-3">
        <SectionTitle>Ingredient Substitutions</SectionTitle>
        {plan.substitutions.length === 0 ? (
          <p className="text-sm text-zinc-600">No substitutions suggested.</p>
        ) : (
          <ul className="grid gap-2 text-sm text-zinc-700">
            {plan.substitutions.map((s, i) => (
              <li key={`${s.from}-${s.to}-${i}`} className="rounded-md border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">
                  {s.from} → {s.to}
                </div>
                {s.reason ? (
                  <div className="mt-1 text-zinc-600">{s.reason}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3">
        <SectionTitle>Cooking To-Do Checklist</SectionTitle>
        <ul className="grid gap-2">
          {plan.todo.map((item, idx) => {
            const checked = done.has(idx);
            return (
              <li key={`${idx}-${item}`} className="flex items-start gap-3 rounded-md border border-zinc-200 p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-zinc-900"
                  checked={checked}
                  onChange={() => toggle(idx)}
                />
                <span className={checked ? "text-zinc-500 line-through" : "text-zinc-800"}>
                  {item}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function MealCard({
  title,
  meal,
}: {
  title: string;
  meal: Plan["breakfast"];
}) {
  return (
    <div className="grid gap-3">
      <SectionTitle>{title}</SectionTitle>
      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-lg font-semibold text-zinc-950">{meal.name}</div>
          <div className="text-sm text-zinc-600">
            {meal.cooking_time_minutes} min · <Money value={meal.estimated_cost} />
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-700">{meal.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-zinc-900">Ingredients</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
              {meal.ingredients.map((ing, i) => (
                <li key={`${ing}-${i}`}>{ing}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-900">Steps</div>
            <ol className="mt-2 list-decimal pl-5 text-sm text-zinc-700">
              {meal.steps.map((step, i) => (
                <li key={`${i}-${step}`}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="text-sm font-medium text-zinc-900">{title}</div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600">None</p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
          {items.map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

