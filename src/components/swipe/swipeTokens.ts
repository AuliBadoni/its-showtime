/**
 * Visual tokens for the swipe screen — calibrated to Figma node 2:2
 * (it's-showtime / no action state, frame size 402x874).
 *
 * The stage is sized fluidly so it always fits the device viewport. Layer
 * positions are expressed as percentages of the stage so the stack scales
 * uniformly without distorting Figma's relative geometry.
 */

export const CARD_RADIUS_PX = 20;
// Gutter on each side of the card inside the PhoneFrame (not the viewport).
// The stage width calc in SwipeScreen uses calc(100% - SIDE_MARGIN_PX * 2px),
// where 100% resolves against the PhoneFrame's content box (max-w-[390px]).
export const SIDE_MARGIN_PX = 10;

/**
 * Stage reference frame. Real CSS size is derived from this via aspect-
 * ratio so widths/heights of inner layers (in %) translate directly to
 * the Figma values when the stage renders at full reference size.
 */
export const STAGE_REF_W = 420;
export const STAGE_REF_H = 650;

/**
 * Vertical space the stage must NOT consume (header + page paddings).
 * Used in the stage's `width` clamp so the resulting stage height fits
 * in `100dvh - STAGE_VERTICAL_RESERVE_PX`.
 */
export const STAGE_VERTICAL_RESERVE_PX = 150;

/**
 * 3D card stack: front card sits at the bottom of the stage, back cards
 * scale down toward `transform-origin: top center` and translate up so
 * only their top edges peek above the front card. Back cards are
 * decorative — they never animate.
 *
 * All layers occupy the same absolute box (the front-card slot
 * defined by FRONT_CARD_TOP_PCT / FRONT_CARD_HEIGHT_PCT below). The
 * scale/translateY/opacity here is what makes them recede visually.
 */
// Tight 10-card stack: front is dominant, back is small but still visible.
// Each row peeks 5px above the one in front of it, with a 2.5% scale step
// and a graduated opacity falloff so the depth reads clearly.
export type StackLayer = { scale: number; translateY: number; opacity: number };
export const STACK_LAYERS: StackLayer[] = [
  { scale: 1.000, translateY:   0, opacity: 1.00 }, // 0 — front / active
  { scale: 0.975, translateY:  -5, opacity: 0.93 },
  { scale: 0.950, translateY: -10, opacity: 0.86 },
  { scale: 0.925, translateY: -15, opacity: 0.79 },
  { scale: 0.900, translateY: -20, opacity: 0.72 },
  { scale: 0.875, translateY: -25, opacity: 0.65 },
  { scale: 0.850, translateY: -30, opacity: 0.57 },
  { scale: 0.825, translateY: -35, opacity: 0.50 },
  { scale: 0.800, translateY: -40, opacity: 0.43 },
  { scale: 0.775, translateY: -45, opacity: 0.35 }, // 9 — back / deepest
];
export const VISIBLE_CARDS = STACK_LAYERS.length;

// Front card slot leaves a 10% band at the top of the stage for the
// back-card peek (deepest card translates up 45px; 10% of the ~573px
// stage height ≈ 57px, comfortably containing the peek inside the
// stage so nothing reaches the room pill above).
export const FRONT_CARD_TOP_PCT = 10;
export const FRONT_CARD_HEIGHT_PCT = 90;

// Background gradient — solid top color holds until 81.79%, then fades to
// the dark grey bottom. Three top-color states, lerped by signed drag
// progress in [-1, 1]:
//   dragProgress  0 → GRADIENT_DEFAULT_TOP (no action,  Figma node 2:2)
//   dragProgress < 0 → GRADIENT_LEFT_TOP    (don't like, Figma node 6:89)
//   dragProgress > 0 → GRADIENT_RIGHT_TOP   (like,       Figma node 6:59)
export const GRADIENT_DEFAULT_TOP = '#0F100D';
export const GRADIENT_LEFT_TOP = '#481414';
export const GRADIENT_RIGHT_TOP = '#285728';
export const GRADIENT_BOTTOM = '#2F2F2F';
export const GRADIENT_FADE_START_PCT = 81.79;

export const COMMIT_THRESHOLD_PX = 100;
// Matches the front-card rotation in Figma nodes 6:59 / 6:89 (rotate ±10.16°).
export const TILT_MAX_DEG = 10.16;
export const FLIP_MS = 400;
