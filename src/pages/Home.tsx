import { useNavigate } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import Logo from '../components/Logo';
import PosterStack from '../components/PosterStack';
import GlassButton from '../components/GlassButton';

export default function Home() {
  const navigate = useNavigate();
  return (
    <PhoneFrame>
      <div className="min-h-dvh flex flex-col px-11 pt-12 pb-10">
        <div className="flex justify-center relative z-10">
          <Logo />
        </div>
        <div className="-mt-4">
          <PosterStack />
        </div>
        <div className="flex-1 min-h-4" />
        <div className="flex flex-col gap-4">
          <GlassButton label="Create a room" onClick={() => navigate('/create-room')} />
          <GlassButton label="Join room" onClick={() => navigate('/join-room')} />
        </div>
      </div>
    </PhoneFrame>
  );
}
