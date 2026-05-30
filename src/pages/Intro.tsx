import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import Logo from '../components/Logo';

export default function Intro() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/home'), 1500);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <PhoneFrame>
      <div className="min-h-dvh flex items-center justify-center px-6">
        <Logo />
      </div>
    </PhoneFrame>
  );
}
