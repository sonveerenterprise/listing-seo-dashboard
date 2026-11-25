// Simple line icons (own drawings).
const PATHS: Record<string, React.ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  find: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
  doc: <path d="M6 3h8l4 4v14H6zM9 12h6M9 16h6" />,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" /></>,
  cup: <path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4c0 4 2 5 4 5M16 6h4c0 4-2 5-4 5M12 14v4M8 20h8" />,
  tick: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  tri: <path d="M12 4l9 16H3zM12 10v4M12 17h.01" />,
  coin: <><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.700 3 3 7 3s7-1.300 7-3V7M5 12v5c0 1.700 3 3 7 3s7-1.300 7-3v-5" /></>,
};
export default function Icon({ name, className = "" }: { name: keyof typeof PATHS | string; className?: string }) {
  return <svg className={`i ${className}`} viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>;
}
