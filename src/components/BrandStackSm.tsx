import laLaLand from '../assets/posters/la-la-land.png';
import tenThings from '../assets/posters/ten-things.png';
import priscila from '../assets/posters/priscila.png';
import pulpFiction from '../assets/posters/pulp-fiction.png';
import Logo from './Logo';

// Calibrated to Figma node 39:712 — a tight 190×213 brand cluster with the
// small "it's showtime" logo overlapping the top of a 4-poster fan. Used
// as the page header on CreateRoom and JoinRoom.
type Poster = {
  src: string;
  alt: string;
  rotate: number;
  z: number;
  w: number;
  h: number;
  left: number;
  top: number;
};

const POSTERS: Poster[] = [
  { src: priscila,    alt: 'Priscila',     rotate: -25.03, z: 1, w: 100.7, h: 148.9, left: 26.8, top: 46.2 },
  { src: tenThings,   alt: '10 Things',    rotate: 16.65,  z: 2, w: 110.7, h: 163.6, left: 54.5, top: 32.2 },
  { src: laLaLand,    alt: 'La La Land',   rotate: -10.16, z: 3, w: 115.9, h: 171.3, left: 49.0, top: 28.4 },
  { src: pulpFiction, alt: 'Pulp Fiction', rotate: 0.73,   z: 4, w: 113.9, h: 168.4, left: 45.8, top: 44.0 },
];

type Props = { scale?: number };

export default function BrandStackSm({ scale = 1 }: Props) {
  const width = 190.4;
  const height = 213.2;

  return (
    <div
      className="relative mx-auto"
      style={{ width: width * scale, height: height * scale }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {POSTERS.map((p) => (
          <img
            key={p.alt}
            src={p.src}
            alt={p.alt}
            className="absolute object-cover rounded-[12px] shadow-2xl"
            style={{
              width: p.w,
              height: p.h,
              left: p.left,
              top: p.top,
              transform: `rotate(${p.rotate}deg)`,
              zIndex: p.z,
            }}
          />
        ))}
        <div className="absolute left-1/2 -translate-x-1/2 top-[6px] z-20">
          <Logo size="sm" />
        </div>
      </div>
    </div>
  );
}
