import { useState } from 'react';

type Props = { label: string; onClick?: () => void };

export default function GlassButton({ label, onClick }: Props) {
  const [pressed, setPressed] = useState(false);
  const down = () => setPressed(true);
  const up = () => setPressed(false);
  return (
    <button
      type="button"
      onMouseDown={down}
      onMouseUp={up}
      onMouseLeave={up}
      onTouchStart={down}
      onTouchEnd={up}
      onTouchCancel={up}
      onClick={onClick}
      className={`w-full h-[50px] rounded-[20px] font-sans font-semibold text-white text-base
        transition-colors duration-75 active:scale-[0.99]
        ${pressed ? 'bg-accent border border-accent' : 'bg-glass border border-glassBorder'}`}
    >
      {label}
    </button>
  );
}
