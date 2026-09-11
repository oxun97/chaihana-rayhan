// Small ornamental rosette mark used as the brand logo — an 8-point
// star inscribed in a ring, evoking Central Asian girih/majolica motifs,
// drawn as plain SVG so it renders crisply at any size with no image asset.
export default function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" stroke="#c89b3c" strokeWidth="1" />
      <g stroke="#c89b3c" strokeWidth="1.4" strokeLinecap="round">
        <path d="M20 7v26M7 20h26M11 11l18 18M29 11L11 29" />
      </g>
      <circle cx="20" cy="20" r="4" fill="#c89b3c" />
    </svg>
  );
}
