import { Routes, Route, Navigate } from 'react-router-dom';
import { RoomSessionProvider } from './context/RoomSessionContext';
import Intro from './pages/Intro';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import SwipeScreen from './pages/SwipeScreen';
import GroupResults from './pages/GroupResults';

export default function App() {
  return (
    <RoomSessionProvider>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/swipe" element={<SwipeScreen />} />
        <Route path="/group/:groupId/results" element={<GroupResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoomSessionProvider>
  );
}
