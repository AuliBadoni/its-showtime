type Props = {
  groupName: string;
  roomCode: string;
};

/** Header from Figma node 2:2 — title + small fixed-size room pill. */
export default function SwipeHeader({ groupName, roomCode }: Props) {
  return (
    <header className="flex flex-col items-center gap-2">
      <h1
        className="font-sans font-bold text-white text-center"
        style={{ fontSize: 20, letterSpacing: '-0.6px', lineHeight: 'normal' }}
      >
        Deciding with &ldquo;{groupName}&rdquo;
      </h1>
      <div
        className="flex items-center justify-center"
        style={{
          width: 94,
          height: 34,
          borderRadius: 10,
          backgroundColor: 'rgba(217,217,217,0.09)',
        }}
        aria-label="Room code"
      >
        <span
          className="font-sans font-semibold text-white"
          style={{ fontSize: 12, lineHeight: 'normal' }}
        >
          Room {roomCode}
        </span>
      </div>
    </header>
  );
}
