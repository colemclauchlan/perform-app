import { ComingSoon } from "@/components/ui/ComingSoon";

export default function CoachPage() {
  return (
    <ComingSoon
      title="AI Coach"
      subtitle="Personalised guidance powered by Claude"
      bullets={[
        "Suggested workouts based on your training history and equipment",
        "Protocol planning and nutrition recommendations",
        "Auto-generated meal plans matched to your macro targets",
        "Conversational coaching that references your logged data",
      ]}
    />
  );
}
