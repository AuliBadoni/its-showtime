import laLaLand from '../assets/posters/la-la-land.png';
import tenThings from '../assets/posters/ten-things.png';
import priscila from '../assets/posters/priscila.png';
import pulpFiction from '../assets/posters/pulp-fiction.png';

type Poster = {
  src: string;
  alt: string;
  rotate: string;
  z: number;
  offsetX: string;
  offsetY: string;
};

const posters: Poster[] = [
  { src: priscila, alt: 'Priscila', rotate: '-25deg', z: 1, offsetX: '-30%', offsetY: '4%' },
  { src: tenThings, alt: '10 Things', rotate: '17deg', z: 2, offsetX: '22%', offsetY: '0%' },
  { src: laLaLand, alt: 'La La Land', rotate: '-10deg', z: 3, offsetX: '-10%', offsetY: '-6%' },
  { src: pulpFiction, alt: 'Pulp Fiction', rotate: '0.7deg', z: 4, offsetX: '5%', offsetY: '6%' },
];

export default function PosterStack() {
  return (
    <div className="relative w-full pb-7">
      <div className="relative w-full h-[340px] flex items-center justify-center">
        {posters.map((p) => (
          <img
            key={p.alt}
            src={p.src}
            alt={p.alt}
            className="absolute w-[180px] h-[260px] object-cover rounded-2xl shadow-2xl"
            style={{
              transform: `translate(${p.offsetX}, ${p.offsetY}) rotate(${p.rotate})`,
              zIndex: p.z,
            }}
          />
        ))}
      </div>
      <p className="absolute left-0 right-0 text-center font-sans font-semibold text-base text-white">
        Less arguing. More watching.
      </p>
    </div>
  );
}
