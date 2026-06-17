import { ComingSoon } from "@/components/ui/ComingSoon";

export default function CheckinPage() {
  return (
    <ComingSoon
      title="Check-in"
      subtitle="Track your physique with progress photos over time"
      bullets={[
        "Upload front, side, and back photos per check-in",
        "Record weight and body-fat alongside each entry",
        "Compare any two dates side-by-side",
        "Slideshow view to watch your progress",
      ]}
    />
  );
}
