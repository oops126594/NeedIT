import type { CategoryId } from "@/lib/types";
import type { ReactNode } from "react";

function Glyph({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "size-6"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16.5 20 20.5" />
    </Glyph>
  );
}

export function CartIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="M6 7h12l-1 11H7L6 7Z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </Glyph>
  );
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Glyph>
  );
}

export function PinIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </Glyph>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </Glyph>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M7 10.5V19h10v-8.5" />
    </Glyph>
  );
}

export function BagIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="M6.5 8h11l-.8 11h-9.4L6.5 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </Glyph>
  );
}

export function HelpIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.9-1.2 1.6V14" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <Glyph className={className}>
      <path d="m12 4 1.8 4.2L18.4 9l-3.3 2.9.9 4.6L12 14.8 7.9 16.5l.9-4.6L5.6 9l4.6-.8L12 4Z" />
    </Glyph>
  );
}

const CATEGORY_PATHS: Record<CategoryId, ReactNode> = {
  school: (
    <>
      <path d="M4 8.5 12 5l8 3.5L12 12 4 8.5Z" />
      <path d="M8 10.5v4.2c0 .8 1.8 2.3 4 2.3s4-1.5 4-2.3v-4.2" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M7 10.5V19h10v-8.5" />
    </>
  ),
  tech: (
    <>
      <rect x="8" y="3.5" width="8" height="17" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  car: (
    <>
      <path d="M4 14h16l-1.2-4.2a2 2 0 0 0-1.9-1.3H7.1a2 2 0 0 0-1.9 1.3L4 14Z" />
      <path d="M6 14v2.5M18 14v2.5" />
      <circle cx="7.5" cy="16.5" r="1.2" />
      <circle cx="16.5" cy="16.5" r="1.2" />
    </>
  ),
  gifts: (
    <>
      <rect x="4" y="10" width="16" height="9" rx="1.5" />
      <path d="M4 13.5h16M12 10v9" />
      <path d="M12 10c-2 0-3.2-2.2-2-3.2S12 8 12 10c0-2 1.2-3.4 2.4-2.2S14 10 12 10Z" />
    </>
  ),
  party: (
    <>
      <path d="M12 14c2.8 0 4-2.2 4-4.2C16 6.5 13.5 4 12 4S8 6.5 8 9.8C8 11.8 9.2 14 12 14Z" />
      <path d="M12 14c.4 2.2-.2 4.2-1.5 6" />
    </>
  ),
  pets: (
    <>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6.5" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <path d="M8.2 14.5c.8-2 2.2-3 3.8-3s3 .9 3.8 3c.6 1.6-.4 3.5-3.8 3.5s-4.4-1.9-3.8-3.5Z" />
    </>
  ),
  stationery: (
    <>
      <path d="M14.5 5.5 18.5 9.5 9 19l-4.5 1 1-4.5 9-10Z" />
      <path d="M13 7 17 11" />
    </>
  ),
};

export function CategoryIcon({ id, className }: { id: CategoryId; className?: string }) {
  return <Glyph className={className}>{CATEGORY_PATHS[id]}</Glyph>;
}

export const CATEGORY_COLOR: Record<CategoryId, string> = {
  school: "#1d4e89",
  home: "#6f4518",
  tech: "#0f6e56",
  car: "#3d4a40",
  gifts: "#9a3e4a",
  party: "#a16207",
  pets: "#6941a0",
  stationery: "#1f6f8b",
};

export function CategoryMark({
  id,
  className,
  iconClassName,
}: {
  id: CategoryId;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center text-white ${className ?? "size-14 rounded-2xl"}`}
      style={{ background: CATEGORY_COLOR[id] }}
    >
      <CategoryIcon id={id} className={iconClassName} />
    </span>
  );
}
