import { Timer, ShieldCheck, CreditCard, Users, Lock, TrendingUp, CheckCircle, Zap } from "lucide-react";

// Shared between the admin "Why Features" icon picker and the customer-facing
// Why page (src/pages/experience/Why.jsx) — keep both in sync when adding options.
export const WHY_ICON_OPTIONS = [
  { value: "Timer", label: "Timer (speed / time saved)", Icon: Timer },
  { value: "ShieldCheck", label: "ShieldCheck (security / compliance)", Icon: ShieldCheck },
  { value: "CreditCard", label: "CreditCard (payment / pricing)", Icon: CreditCard },
  { value: "Users", label: "Users (people / team)", Icon: Users },
  { value: "Lock", label: "Lock (access control)", Icon: Lock },
  { value: "TrendingUp", label: "TrendingUp (growth / ROI)", Icon: TrendingUp },
  { value: "CheckCircle", label: "CheckCircle (reliability)", Icon: CheckCircle },
  { value: "Zap", label: "Zap (automation / speed)", Icon: Zap },
];

const ICON_MAP = Object.fromEntries(WHY_ICON_OPTIONS.map((o) => [o.value, o.Icon]));

export function resolveWhyIcon(name) {
  return ICON_MAP[name] || Zap;
}
