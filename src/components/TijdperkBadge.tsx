import { eraColorClass } from "@/lib/types";

export default function TijdperkBadge({
  tijdperk,
}: {
  tijdperk?: string | null;
}) {
  if (!tijdperk) return null;
  return (
    <span className={`chip ${eraColorClass(tijdperk)}`}>Tijdperk {tijdperk}</span>
  );
}
