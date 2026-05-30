type Size = 'lg' | 'sm';
type Props = { className?: string; size?: Size };

// Stroke width scales proportionally with font size (12/45 ≈ 0.267).
const PRESETS: Record<Size, { fontSize: number; stroke: number }> = {
  lg: { fontSize: 45, stroke: 12 },
  sm: { fontSize: 27.3, stroke: 7.3 },
};

export default function Logo({ className = '', size = 'lg' }: Props) {
  const { fontSize, stroke } = PRESETS[size];
  return (
    <h1
      className={`font-sans font-black text-white leading-none tracking-[0.01em] select-none whitespace-nowrap ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        WebkitTextStroke: `${stroke}px #D40000`,
        paintOrder: 'stroke fill',
      }}
    >
      it’s showtime
    </h1>
  );
}
