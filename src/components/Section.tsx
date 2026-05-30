type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function Section({ title, subtitle, children }: Props) {
  return (
    <section className="flex flex-col items-center gap-5 w-full min-w-0">
      <div className="flex flex-col items-center -space-y-1 w-full">
        <h2
          className="font-sans font-semibold text-[22px] text-white text-center"
          style={{ letterSpacing: '-0.66px' }}
        >
          {title}
        </h2>
        <p
          className="font-sans font-normal text-[12px] text-white text-center"
          style={{ letterSpacing: '-0.3px' }}
        >
          {subtitle}
        </p>
      </div>
      <div className="w-full flex flex-col gap-2 text-center">{children}</div>
    </section>
  );
}
