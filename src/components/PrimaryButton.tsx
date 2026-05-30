type Props = { label: string; onClick?: () => void; disabled?: boolean };

export default function PrimaryButton({ label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[50px] rounded-[20px] bg-accent text-white font-sans font-semibold text-base
        transition-opacity duration-75 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
