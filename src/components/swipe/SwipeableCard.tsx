import { useEffect, useRef, useState } from 'react';
import type { Movie, Vote } from '../../types/movie';
import { formatGenres, formatRating, formatRuntime } from '../../lib/movies';
import {
  CARD_RADIUS_PX,
  COMMIT_THRESHOLD_PX,
  FLIP_MS,
  TILT_MAX_DEG,
} from './swipeTokens';

// Static "Where can you watch this?" providers (Figma node 7:105). Logos
// pulled from each service's public favicon — placeholder until the
// catalog gains real per-title availability data.
type WatchProvider = { name: string; action: 'Rent' | 'Buy' | 'Stream'; icon: string };
const WATCH_PROVIDERS: WatchProvider[] = [
  { name: 'Apple TV Store', action: 'Rent', icon: 'https://tv.apple.com/favicon.ico' },
  { name: 'Google Play Movies', action: 'Buy', icon: 'https://play.google.com/favicon.ico' },
  { name: 'Netflix', action: 'Stream', icon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico' },
  { name: 'HBO MAX', action: 'Stream', icon: 'https://www.max.com/favicon.ico' },
  { name: 'Amazon Prime Video', action: 'Rent', icon: 'https://www.amazon.com/favicon.ico' },
];

const TAP_MAX_PX = 8;
const EXIT_TRANSLATE_PX = 600;
const SPRING_MS = 220;
const EXIT_MS = 280;
const ENTER_MS = 280;

// Easing curves. Spring-back uses a slight overshoot so the card feels
// elastic on release; exit uses Material's standard ease for a clean
// fly-off; enter uses a smooth ease-out for the promote-from-peek effect.
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EXIT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const ENTER_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

type Props = {
  movie: Movie;
  onDragProgress: (signed: number) => void;
  onCommit: (vote: Vote) => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
};

export default function SwipeableCard({ movie, onDragProgress, onCommit }: Props) {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exiting, setExiting] = useState<Vote | null>(null);
  // Enter animation: starts false on mount (renders at the depth-1 peek
  // position), flips to true after first paint so the CSS transition
  // animates the card smoothly into the depth-0 front slot.
  const [hasEntered, setHasEntered] = useState(false);
  const drag = useRef<DragState | null>(null);

  // Reset transient state on new movie (next card promoted).
  useEffect(() => {
    setDx(0);
    setDy(0);
    setFlipped(false);
    setExiting(null);
    setTransitionMs(0);
    setHasEntered(false);
    onDragProgress(0);

    const raf = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [movie.tmdb_id, onDragProgress]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (exiting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
    };
    setTransitionMs(0);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    setDx(d.dx);
    setDy(d.dy);
    onDragProgress(Math.max(-1, Math.min(1, d.dx / COMMIT_THRESHOLD_PX)));
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const { dx: finalDx, dy: finalDy } = d;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already be released
    }

    const movedFar = Math.abs(finalDx) > TAP_MAX_PX || Math.abs(finalDy) > TAP_MAX_PX;
    if (!movedFar) {
      setFlipped((f) => !f);
      setDx(0);
      setDy(0);
      onDragProgress(0);
      return;
    }

    if (Math.abs(finalDx) >= COMMIT_THRESHOLD_PX) {
      const vote: Vote = finalDx > 0 ? 'yes' : 'no';
      setExiting(vote);
      setTransitionMs(EXIT_MS);
      const exitX = vote === 'yes' ? EXIT_TRANSLATE_PX : -EXIT_TRANSLATE_PX;
      setDx(exitX);
      // Zero out vertical drift so the card flies off cleanly along the
      // X axis (still tilted) — reads as decisive rather than wobbly.
      setDy(0);
      onDragProgress(vote === 'yes' ? 1 : -1);
      window.setTimeout(() => onCommit(vote), EXIT_MS);
      return;
    }

    setTransitionMs(SPRING_MS);
    setDx(0);
    setDy(0);
    onDragProgress(0);
  }

  const progress = Math.max(-1, Math.min(1, dx / COMMIT_THRESHOLD_PX));
  const rotation = progress * TILT_MAX_DEG;

  const outerTransition =
    transitionMs > 0
      ? `transform ${transitionMs}ms ${exiting ? EXIT_EASING : SPRING_EASING}`
      : 'none';

  const outerStyle: React.CSSProperties = {
    transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`,
    transition: outerTransition,
    touchAction: 'none',
    perspective: '1000px',
    willChange: 'transform',
  };

  // Enter wrapper sits between the drag-receiving outer and the flip
  // inner so the enter scale/translate composes cleanly with the drag
  // transform without competing for the same `transform` property.
  const enterStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    transform: hasEntered
      ? 'scale(1) translateY(0)'
      : 'scale(0.96) translateY(-12px)',
    transition: `transform ${ENTER_MS}ms ${ENTER_EASING}`,
    transformOrigin: 'center top',
    willChange: 'transform',
  };

  const innerStyle: React.CSSProperties = {
    transform: `rotateY(${flipped ? 180 : 0}deg)`,
    transition: `transform ${FLIP_MS}ms ease`,
    transformStyle: 'preserve-3d',
  };

  const faceBase: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: CARD_RADIUS_PX,
  };

  return (
    <div
      className="absolute inset-0 select-none cursor-grab active:cursor-grabbing"
      style={outerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div style={enterStyle}>
        <div className="relative w-full h-full" style={innerStyle}>
          {/* Front face: poster */}
          <div
            className="absolute inset-0 overflow-hidden shadow-2xl bg-black/40"
            style={faceBase}
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>

          {/* Back face: details — Figma node 7:105 */}
          <div
            className="absolute inset-0 overflow-hidden shadow-2xl text-[#E2E2E2]"
            style={{
              ...faceBase,
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(180deg, #030329 0%, #0F100D 100%)',
            }}
          >
            {/* Top poster — faded into the card background via mask */}
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0 overflow-hidden"
              style={{
                height: '35%',
                borderTopLeftRadius: CARD_RADIUS_PX,
                borderTopRightRadius: CARD_RADIUS_PX,
                WebkitMaskImage:
                  'linear-gradient(180deg, #000 55%, transparent 100%)',
                maskImage:
                  'linear-gradient(180deg, #000 55%, transparent 100%)',
              }}
            >
              <img
                src={movie.poster_url}
                alt=""
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>

            <div className="relative h-full flex flex-col items-center px-5 pb-6 pt-[35%]">
              <div className="flex flex-col items-center w-full">
                <h3
                  className="font-sans font-bold text-[20px] text-center text-white"
                  style={{ letterSpacing: '-0.6px', lineHeight: 'normal' }}
                >
                  {movie.title}
                </h3>
                <div
                  className="flex font-sans text-[12px] text-white/70 whitespace-nowrap mt-1"
                  style={{ letterSpacing: '-0.36px', lineHeight: 'normal' }}
                >
                  <span>{movie.year}</span>
                  <span aria-hidden className="px-2">·</span>
                  <span>{formatRuntime(movie.runtime)}</span>
                  <span aria-hidden className="px-2">·</span>
                  <span>IMDb {formatRating(movie.rating)}</span>
                </div>
              </div>

              <p
                className="font-sans text-[12px] text-center line-clamp-3 mt-4"
                style={{ letterSpacing: '-0.36px', lineHeight: 'normal' }}
              >
                {movie.overview}
              </p>

              <h4
                className="font-sans font-semibold text-[14px] text-center mt-4"
                style={{ letterSpacing: '-0.36px', lineHeight: 'normal' }}
              >
                Where can you watch this?
              </h4>

              <ul className="flex flex-col gap-[9px] w-[260px] max-w-full m-0 p-0 list-none mt-[18px]">
                {WATCH_PROVIDERS.map((p) => (
                  <li
                    key={p.name}
                    className="grid items-center w-full"
                    style={{ gridTemplateColumns: '42px 1fr 42px' }}
                  >
                    <span className="flex items-center justify-start">
                      <img
                        src={p.icon}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        draggable={false}
                        className="w-8 h-8 rounded-lg pointer-events-none"
                      />
                    </span>
                    <span
                      className="font-sans text-[12px] text-center"
                      style={{ letterSpacing: '-0.36px', lineHeight: 'normal' }}
                    >
                      {p.name}
                    </span>
                    <span
                      className="font-sans text-[12px] text-center whitespace-nowrap"
                      style={{ letterSpacing: '-0.36px', lineHeight: 'normal' }}
                    >
                      {p.action}
                    </span>
                  </li>
                ))}
              </ul>

              <span className="sr-only">{formatGenres(movie.genres)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
