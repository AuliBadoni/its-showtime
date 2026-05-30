import { useRef } from 'react';

type SizeVariant = 'sm' | 'lg';

type Props =
  | { mode: 'display'; value: string; size?: SizeVariant }
  | { mode: 'input'; value: string; onChange: (next: string) => void; size?: SizeVariant };

const SIZE: Record<SizeVariant, { box: string; gap: string }> = {
  sm: { box: 'w-[50px] h-[50px] rounded-[20px] text-base', gap: 'gap-2' },
  lg: { box: 'w-[68px] h-[68px] rounded-[27.2px] text-[21.76px]', gap: 'gap-[11px]' },
};

export default function CodeBoxes(props: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  const chars = [0, 1, 2, 3].map((i) => props.value[i] ?? '');
  const size = props.size ?? 'sm';
  const boxBase = `${SIZE[size].box} bg-glass flex items-center justify-center text-white font-sans font-semibold`;

  function update(i: number, v: string) {
    if (props.mode !== 'input') return;
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = chars.slice();
    next[i] = digit;
    props.onChange(next.join(''));
    if (digit && i < 3) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
  }

  return (
    <div className={`flex ${SIZE[size].gap} justify-center`}>
      {chars.map((c, i) =>
        props.mode === 'display' ? (
          <div key={i} className={boxBase}>
            {c}
          </div>
        ) : (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            className={`${boxBase} text-center outline-none focus:ring-2 focus:ring-white/30`}
          />
        ),
      )}
    </div>
  );
}
