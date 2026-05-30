import { useMemo } from 'react';
import { lerpColor } from '../../lib/color';
import {
  GRADIENT_BOTTOM,
  GRADIENT_DEFAULT_TOP,
  GRADIENT_FADE_START_PCT,
  GRADIENT_LEFT_TOP,
  GRADIENT_RIGHT_TOP,
} from './swipeTokens';

type Props = {
  /** Signed drag progress in [-1, 1]. Negative = left (dislike), positive = right (like). */
  dragProgress: number;
};

/**
 * Background per Figma node 2:2: the top color holds solid until ~82% and
 * only fades to the dark grey in the bottom band. During drag the top
 * color is lerped toward red (left) or green (right); the fade band is
 * preserved so the screen still grounds out the same color at the bottom.
 */
export default function SwipeBackground({ dragProgress }: Props) {
  const top = useMemo(() => {
    const t = Math.min(1, Math.abs(dragProgress));
    if (t === 0) return GRADIENT_DEFAULT_TOP;
    const target = dragProgress < 0 ? GRADIENT_LEFT_TOP : GRADIENT_RIGHT_TOP;
    return lerpColor(GRADIENT_DEFAULT_TOP, target, t);
  }, [dragProgress]);

  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, ${top} 0%, ${top} ${GRADIENT_FADE_START_PCT}%, ${GRADIENT_BOTTOM} 100%)`,
      }}
    />
  );
}
