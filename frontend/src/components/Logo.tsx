import Link from "next/link";

export default function Logo({ href = "/", compact = false }: {
  href?: string; compact?: boolean;
}) {
  return (
    <Link href={href} className="logo" aria-label="CareerCanvas home">
      <span className="logo-mark">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M12 6h18l8 8v28H12z" fill="none" stroke="currentColor"
            strokeWidth="3" strokeLinejoin="round"/>
          <path d="M30 6v9h8M18 22h13M18 28h13M18 34h8" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="m9 10 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" fill="currentColor"/>
        </svg>
      </span>
      {!compact && (
        <span className="logo-copy">
          <strong>CareerCanvas</strong>
          <small>AI Resume Studio</small>
        </span>
      )}
    </Link>
  );
}
