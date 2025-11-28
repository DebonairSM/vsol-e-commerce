import { SEO_CONFIG } from "~/app";

export function HeroBadge() {
  return (
    <div
      className={`
        inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm
        font-semibold text-primary
      `}
    >
      {SEO_CONFIG.fullName}
    </div>
  );
}
