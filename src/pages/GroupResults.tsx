import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import PrimaryButton from '../components/PrimaryButton';
import {
  allMembersComplete,
  fetchGroupResults,
  type GroupRow,
  type MemberResult,
  type MemberRow,
} from '../lib/groups';
import {
  pairwiseCosineMatrix,
  recommendMovies,
  type Recommendation,
} from '../lib/scoring';
import { formatRating, formatRuntime, getCatalog } from '../lib/movies';

const POLL_INTERVAL_MS = 2500;
const SWIPE_THRESHOLD_PX = 48;
const MATCH_STROKE_GREEN = '#2A7A2A';

type State =
  | { kind: 'loading' }
  | { kind: 'waiting'; group: GroupRow; members: MemberRow[] }
  | { kind: 'ready'; group: GroupRow; members: MemberRow[]; results: MemberResult[] }
  | { kind: 'error'; message: string };

export default function GroupResults() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!groupId) {
      setState({ kind: 'error', message: 'Missing group id.' });
      return;
    }

    cancelledRef.current = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const { group, members, results } = await fetchGroupResults(groupId);
        if (cancelledRef.current) return;
        if (allMembersComplete(members) && results.length === members.length) {
          setState({ kind: 'ready', group, members, results });
          return;
        }
        setState({ kind: 'waiting', group, members });
        timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelledRef.current) return;
        setState({
          kind: 'error',
          message: e instanceof Error ? e.message : 'Could not load results.',
        });
      }
    };

    tick();

    return () => {
      cancelledRef.current = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [groupId]);

  return (
    <PhoneFrame>
      <div
        className="min-h-dvh flex flex-col px-5 pb-8 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#0f100d] from-[80.43%] to-[#2f2f2f]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
      >
        {state.kind === 'loading' && <Loading />}
        {state.kind === 'waiting' && <Waiting members={state.members} group={state.group} />}
        {state.kind === 'ready' && (
          <Ready members={state.members} results={state.results} group={state.group} />
        )}
        {state.kind === 'error' && (
          <ErrorState message={state.message} onHome={() => navigate('/home')} />
        )}
      </div>
    </PhoneFrame>
  );
}

function Loading() {
  return <p className="font-sans text-[14px] text-white/70 text-center">Loading results…</p>;
}

function Waiting({ members, group }: { members: MemberRow[]; group: GroupRow }) {
  const total = members.length;
  const done = members.filter((m) => m.completed_at !== null).length;
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-sans font-semibold text-[22px] text-white">{group.group_name}</h2>
        <p className="font-sans text-[12px] text-white/70">Room code {group.invite_code}</p>
      </div>

      <p className="font-sans text-[14px] text-white/80 text-center">
        {done} of {total} ready
      </p>

      <ul className="flex flex-col gap-2 w-full">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-[12px] bg-glass px-4 py-3"
          >
            <span className="font-sans text-[14px] text-white">{m.display_name}</span>
            <span className="font-sans text-[12px] text-white/70">
              {m.completed_at ? 'done' : 'swiping…'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ready({
  members,
  results,
  group,
}: {
  members: MemberRow[];
  results: MemberResult[];
  group: GroupRow;
}) {
  const ordered = members
    .map((m) => results.find((r) => r.member.id === m.id))
    .filter((r): r is MemberResult => !!r);

  const recsRef = useRef<Recommendation[] | null>(null);
  if (recsRef.current === null) {
    const memberVectors = ordered.map((r) => r.vector);
    recsRef.current = recommendMovies(
      memberVectors,
      getCatalog(),
      group.seed_movie_ids,
      3,
    );
    const names = ordered.map((r) => r.member.display_name);
    const matrix = pairwiseCosineMatrix(memberVectors);
    console.debug('[showtime] cosine matrix', { names, matrix });
    console.debug(
      '[showtime] recommendations',
      recsRef.current.map((r) => ({
        title: r.movie.title,
        matchPercent: r.matchPercent,
        groupScore: r.groupScore,
      })),
    );
  }
  const recs = recsRef.current;

  if (recs.length === 0) {
    return (
      <p className="font-sans text-[14px] text-white/70 text-center">
        No recommendations could be computed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[26px] w-full items-stretch">
      <h2
        className="font-sans font-bold text-[22px] text-white w-full text-center whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ letterSpacing: '-0.66px' }}
      >
        What the &ldquo;{group.group_name}&rdquo; should watch?
      </h2>

      <RecommendationCarousel recs={recs} />
    </div>
  );
}

/** Logo-style stroked text (see Logo.tsx) with green stroke instead of red. */
function MatchStrokeLabel({ label }: { label: string }) {
  return (
    <p
      className="font-sans font-black text-white leading-none whitespace-nowrap select-none text-center"
      style={{
        fontSize: '30px',
        letterSpacing: '0.3px',
        WebkitTextStroke: `7px ${MATCH_STROKE_GREEN}`,
        paintOrder: 'stroke fill',
      }}
    >
      {label}
    </p>
  );
}

function RecommendationCarousel({ recs }: { recs: Recommendation[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const active = recs[activeIndex];

  const goTo = (next: number) => {
    setActiveIndex(Math.max(0, Math.min(recs.length - 1, next)));
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (delta <= -SWIPE_THRESHOLD_PX) goTo(activeIndex + 1);
    else if (delta >= SWIPE_THRESHOLD_PX) goTo(activeIndex - 1);
    touchStartX.current = null;
  };

  const slideWidth = 260;
  const slideGap = 18;
  const step = slideWidth + slideGap;
  const viewportPad = `calc(50% - ${slideWidth / 2}px)`;

  return (
    <div className="flex flex-col gap-[10px] items-center w-full">
      <MatchStrokeLabel label={`${(active.groupScore * 100).toFixed(1)}% match`} />

      <div
        className="relative w-[calc(100%+2.5rem)] -mx-5 touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex items-center transition-transform duration-300 ease-out"
          style={{
            gap: `${slideGap}px`,
            paddingLeft: viewportPad,
            paddingRight: viewportPad,
            transform: `translateX(${-activeIndex * step}px)`,
          }}
        >
          {recs.map((rec, i) => (
            <button
              key={rec.movie.tmdb_id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-[260px] rounded-[10px] overflow-hidden transition-opacity ${
                i === activeIndex ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ aspectRatio: '260 / 388' }}
              aria-label={`View ${rec.movie.title}`}
              aria-current={i === activeIndex ? 'true' : undefined}
            >
              <img
                src={rec.movie.poster_url}
                alt={rec.movie.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[6px] items-center w-full mt-[10px]">
        <p
          className="font-sans font-bold text-[20px] text-white text-center"
          style={{ letterSpacing: '-0.6px' }}
        >
          {active.movie.title}
        </p>

        <div
          className="flex gap-5 items-center justify-center font-sans text-[12px]
            text-[#e2e2e2] whitespace-nowrap"
          style={{ letterSpacing: '-0.36px' }}
        >
          <span>{active.movie.year}</span>
          <span>{formatRuntime(active.movie.runtime)}</span>
          <span>IMDb {formatRating(active.movie.rating)}</span>
        </div>

        <p
          className="font-sans text-[12px] text-[#e2e2e2] text-center line-clamp-3"
          style={{ letterSpacing: '-0.36px' }}
        >
          {active.movie.overview}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, onHome }: { message: string; onHome: () => void }) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="font-sans text-[14px] text-red-300/90 text-center">{message}</p>
      <PrimaryButton label="Back to home" onClick={onHome} />
    </div>
  );
}
