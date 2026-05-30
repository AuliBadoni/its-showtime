import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type RoomSession = {
  groupId: string;
  memberId: string;
  inviteCode: string;
  groupName: string;
  displayName: string;
  seedMovieIds: number[];
};

type RoomSessionContextValue = {
  session: RoomSession | null;
  setSession: (next: RoomSession) => void;
  clearSession: () => void;
};

const Ctx = createContext<RoomSessionContextValue | undefined>(undefined);

export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RoomSession | null>(null);
  const value = useMemo<RoomSessionContextValue>(
    () => ({
      session,
      setSession: (next) => setSession(next),
      clearSession: () => setSession(null),
    }),
    [session],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoomSession(): RoomSessionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRoomSession must be used within RoomSessionProvider');
  return ctx;
}

export type { RoomSession };
