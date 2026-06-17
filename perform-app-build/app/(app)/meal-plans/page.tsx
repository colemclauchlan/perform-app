import { ComingSoon } from "@/components/ui/ComingSoon";

export default function MealPlansPage() {
  return (
    <ComingSoon
      title="Meal Plans"
      subtitle="Reusable daily meal templates with full macro breakdowns"
      bullets={[
        "Macro and calorie overview for each plan",
        "Slots for breakfast, lunch, dinner, pre- and post-workout",
        "One-tap add a plan to today's food log",
        "Build from your food catalog or AI suggestions",
      ]}
    />
  );
}
