import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import SwipeBackground from '../components/swipe/SwipeBackground';
import SwipeHeader from '../components/swipe/SwipeHeader';
import CardStack from '../components/swipe/CardStack';
import PrimaryButton from '../components/PrimaryButton';
import { useRoomSession } from '../context/RoomSessionContext';
import { useSwipeDeck } from '../hooks/useSwipeDeck';
import type { Vote } from '../types/movie';
import { computeTasteVector, vectorLookupFromMovies } from '../lib/scoring';
import { submitSwipes } from '../lib/groups';
import {
  SIDE_MARGIN_PX,
  STAGE_REF_H,
  STAGE_REF_W,
  STAGE_VERTICAL_RESERVE_PX,
} from '../components/swipe/swipeTokens';

type SubmitStatus = 'idle' | 'submitting' | 'error' | 'done';

export default function SwipeScreen() {
  const navigate = useNavigate();
  const { session } = useRoomSession();
  const { deck, index, votes, isDone, commit, reset } = useSwipeDeck(
    session?.seedMovieIds ?? [],
  );
  const [dragProgress, setDragProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (!isDone || !session) return;
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    const tasteVector = computeTasteVector(votes, vectorLookupFromMovies(deck));
    if (!tasteVector) {
      setSubmitStatus('error');
      setSubmitError('Could not compute taste vector from your swipes.');
      return;
    }

    setSubmitStatus('submitting');
    submitSwipes({ memberId: session.memberId, swipes: votes, tasteVector })
      .then(() => {
        setSubmitStatus('done');
        navigate(`/group/${session.groupId}/results`);
      })
      .catch((e: unknown) => {
        hasSubmittedRef.current = false;
        setSubmitStatus('error');
        setSubmitError(e instanceof Error ? e.message : 'Could not save your swipes.');
      });
  }, [isDone, session, votes, deck, navigate]);

  if (!session) {
    return <Navigate to="/join-room" replace />;
  }

  const handleCommit = (vote: Vote) => {
    commit(vote);
    setDragProgress(0);
  };

  const retrySubmit = () => {
    setSubmitError(null);
    setSubmitStatus('idle');
    hasSubmittedRef.current = false;
  };

  return (
    <PhoneFrame>
      <div className="relative min-h-dvh">
        <SwipeBackground dragProgress={dragProgress} />

        <div
          className="relative flex flex-col h-dvh pb-8"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
        >
          <SwipeHeader groupName={session.groupName} roomCode={session.inviteCode} />

          {isDone ? (
            <DoneState
              total={votes.length}
              status={submitStatus}
              error={submitError}
              onRetry={retrySubmit}
              onSeeResults={() => navigate(`/group/${session.groupId}/results`)}
              onRestart={() => {
                reset();
                setDragProgress(0);
                hasSubmittedRef.current = false;
                setSubmitStatus('idle');
                setSubmitError(null);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center w-full">
              <div
                style={{
                  width: `min(${STAGE_REF_W}px, calc(100% - ${SIDE_MARGIN_PX * 2}px), calc((100dvh - ${STAGE_VERTICAL_RESERVE_PX}px) * ${STAGE_REF_W} / ${STAGE_REF_H}))`,
                  aspectRatio: `${STAGE_REF_W} / ${STAGE_REF_H}`,
                  maxWidth: '100%',
                }}
              >
                <div className="relative w-full h-full">
                  <CardStack
                    deck={deck}
                    index={index}
                    onDragProgress={setDragProgress}
                    onCommit={handleCommit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function DoneState({
  total,
  status,
  error,
  onRetry,
  onSeeResults,
  onRestart,
}: {
  total: number;
  status: SubmitStatus;
  error: string | null;
  onRetry: () => void;
  onSeeResults: () => void;
  onRestart: () => void;
}) {
  const subtitle = (() => {
    if (status === 'submitting') return 'Saving your swipes…';
    if (status === 'done') return 'Heading to results…';
    if (status === 'error') return error ?? 'Something went wrong saving your swipes.';
    return `${total} swipes ready.`;
  })();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-sans font-semibold text-[24px] text-white text-center">
          You’re done.
        </h2>
        <p className="font-sans text-[14px] text-white/70 text-center">{subtitle}</p>
      </div>
      <div className="w-full flex flex-col gap-3">
        {status === 'error' && <PrimaryButton label="Try again" onClick={onRetry} />}
        {status === 'done' && <PrimaryButton label="See results" onClick={onSeeResults} />}
        <button
          type="button"
          onClick={onRestart}
          disabled={status === 'submitting'}
          className="w-full h-[44px] rounded-[20px] bg-glass border border-glassBorder
            text-white font-sans text-[14px] disabled:opacity-50"
        >
          Swipe again
        </button>
      </div>
    </div>
  );
}
