import { Navigate } from "react-router-dom";
import { useExperience } from "@/lib/experience-store";

// Blocks direct/deep-link access to the experience pages — only users who've
// actually signed in via a /login/:code invite link get past this.
export function RequireExperienceAuth({ children }) {
  const user = useExperience((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  return children;
}
