import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-dvh w-full bg-bg flex justify-center items-center gap-2">
      <main className="relative w-full max-w-[390px] min-h-dvh overflow-hidden text-white font-sans">
        {children}
      </main>
    </div>
  );
}
