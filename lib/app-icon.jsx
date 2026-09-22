// Artwork for every generated icon — favicon, Apple touch icon and the PWA
// icons. Defined once here so all sizes carry the same mark in the same
// palette instead of drifting apart across three route files.
//
// Drawn with plain divs rather than a font glyph or an external SVG: satori
// (the renderer behind next/og) would otherwise need to fetch a font at
// render time, which can fail on the edge.

const GROUND = "#24140D"; // cocoa
const MARK = "#C79A45"; // saffron
const CENTER = "#B51F24"; // brand red

/**
 * The 8-point rosette from the site logo, on the brand's cocoa ground.
 *
 * @param {number} size    canvas edge in px (square)
 * @param {number} inset   free margin on each side, as a fraction of `size`.
 *                         Maskable icons need a wide one: Android may crop
 *                         everything outside the inner 80% circle.
 * @param {number} radius  corner rounding, as a fraction of `size`. Pass 0
 *                         where the platform applies its own mask (Apple,
 *                         maskable) so the corners are not rounded twice.
 */
export function AppIconArtwork({ size, inset = 0.24, radius = 0.22 }) {
  // Full visual extent of the rosette, i.e. tip to tip.
  const span = Math.round(size * (1 - inset * 2));
  // Two overlapping squares make the rosette; the rotated one reaches
  // sqrt(2) further than its own edge, so the squares are scaled down to
  // keep the tips inside `span`.
  const side = Math.round(span / Math.SQRT2);
  const offset = Math.round((span - side) / 2);
  const squareRadius = Math.max(2, Math.round(side * 0.16));
  const dot = Math.round(span * 0.26);

  const square = {
    position: "absolute",
    top: offset,
    left: offset,
    width: side,
    height: side,
    background: MARK,
    borderRadius: squareRadius,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: GROUND,
        borderRadius: Math.round(size * radius),
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: span,
          height: span,
        }}
      >
        <div style={square} />
        <div style={{ ...square, transform: "rotate(45deg)" }} />
        <div
          style={{
            width: dot,
            height: dot,
            borderRadius: dot,
            background: CENTER,
          }}
        />
      </div>
    </div>
  );
}
