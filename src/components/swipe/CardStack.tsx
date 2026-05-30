import type { Movie, Vote } from '../../types/movie';
import SwipeableCard from './SwipeableCard';
import {
  CARD_RADIUS_PX,
  FRONT_CARD_HEIGHT_PCT,
  FRONT_CARD_TOP_PCT,
  STACK_LAYERS,
  VISIBLE_CARDS,
} from './swipeTokens';

type Props = {
  deck: Movie[];
  index: number;
  onDragProgress: (signed: number) => void;
  onCommit: (vote: Vote) => void;
};

/**
 * Renders up to `VISIBLE_CARDS` movies as a 3D stack. Every layer occupies
 * the same front-card slot; depth comes from each layer's
 * scale/translateY/opacity in `STACK_LAYERS`, applied around
 * `transform-origin: top center` so back cards peek above the front card.
 * Only the front card is interactive.
 */
export default function CardStack({ deck, index, onDragProgress, onCommit }: Props) {
  const slice = deck.slice(index, index + VISIBLE_CARDS);

  return (
    <div className="relative w-full h-full">
      {slice
        .map((movie, depth) => {
          const layer = STACK_LAYERS[depth];
          if (!layer) return null;
          const isFront = depth === 0;
          const layerStyle: React.CSSProperties = {
            position: 'absolute',
            top: `${FRONT_CARD_TOP_PCT}%`,
            left: 0,
            width: '100%',
            height: `${FRONT_CARD_HEIGHT_PCT}%`,
            transform: `translateY(${layer.translateY}px) scale(${layer.scale})`,
            transformOrigin: 'top center',
            opacity: layer.opacity,
            zIndex: VISIBLE_CARDS - depth,
            pointerEvents: isFront ? undefined : 'none',
            willChange: 'transform, opacity',
          };
          return (
            <div key={movie.tmdb_id} style={layerStyle}>
              {isFront ? (
                <SwipeableCard
                  movie={movie}
                  onDragProgress={onDragProgress}
                  onCommit={onCommit}
                />
              ) : (
                <div
                  className="absolute inset-0 overflow-hidden bg-black/40"
                  style={{ borderRadius: CARD_RADIUS_PX }}
                >
                  <img
                    src={movie.poster_url}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })
        .reverse()}
    </div>
  );
}
