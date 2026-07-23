import Link from "next/link";

import Icon from "@/components/Icon";

export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section
      className="page-hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--surface) 98%, transparent) 0%,
            color-mix(in srgb, var(--surface) 92%, transparent) 42%,
            color-mix(in srgb, var(--surface) 48%, transparent) 66%,
            color-mix(in srgb, var(--surface) 10%, transparent) 100%
          ),
          url("${image}")
        `,
      }}
    >
      <div className="page-hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {(primaryHref || secondaryHref) && (
          <div className="page-hero-actions">
            {primaryHref && primaryLabel && (
              <Link href={primaryHref} className="primary-button">
                {primaryLabel}
                <Icon name="arrow" size={18} />
              </Link>
            )}

            {secondaryHref && secondaryLabel && (
              <Link href={secondaryHref} className="secondary-button">
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
