import type {ReactNode} from 'react';

const ICONS: Record<string, ReactNode> = {
  plugin: (
    <>
      <path d="M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-10 0V8Z" />
      <path d="M12 17v4" />
    </>
  ),
  cookie: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="9.5" cy="10" r="0.7" />
      <circle cx="13.8" cy="8.8" r="0.7" />
      <circle cx="11.6" cy="14.2" r="0.7" />
      <circle cx="15" cy="12.8" r="0.7" />
    </>
  ),
  swap: (
    <>
      <path d="M7 8.5h10M14.5 6 17 8.5 14.5 11" />
      <path d="M17 15.5H7M9.5 13 7 15.5 9.5 18" />
    </>
  ),
  audio: (
    <>
      <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
      <rect x="3.5" y="14" width="4" height="6" rx="1.6" />
      <rect x="16.5" y="14" width="4" height="6" rx="1.6" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="9.8" r="1.4" />
      <path d="m3.5 16.5 5-4 3.5 2.8 4-3.8 4.5 4.3" />
    </>
  ),
  motion: (
    <path d="M2.5 12c2-4 4-4 6.2 0s4.2 4 6.4 0 4.2-4 6.4 0" />
  ),
};

export default function FeatureIcon({name}: {name: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      {ICONS[name] ?? ICONS.plugin}
    </svg>
  );
}
