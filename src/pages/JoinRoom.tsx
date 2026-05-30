import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import BrandStackSm from '../components/BrandStackSm';
import CodeBoxes from '../components/CodeBoxes';
import PrimaryButton from '../components/PrimaryButton';
import Section from '../components/Section';
import { useRoomSession } from '../context/RoomSessionContext';
import { joinGroup } from '../lib/groups';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { setSession } = useRoomSession();
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = displayName.trim().length > 0 && code.length === 4 && !submitting;

  const onJoin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await joinGroup({ code, displayName: displayName.trim() });
      if (!result) {
        setError('No room with that code.');
        setSubmitting(false);
        return;
      }
      const { group, member } = result;
      setSession({
        groupId: group.id,
        memberId: member.id,
        inviteCode: group.invite_code,
        groupName: group.group_name,
        displayName: member.display_name,
        seedMovieIds: group.seed_movie_ids,
      });
      navigate('/swipe');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join room');
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="h-dvh flex flex-col px-11 pt-5 pb-8 overflow-hidden">
        <BrandStackSm scale={0.85} />

        <div className="flex flex-col gap-8 mt-10 w-full min-w-0">
          <Section title="What’s your name?" subtitle="So your crew knows who’s who.">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Sam"
              maxLength={24}
              className="w-full h-[50px] rounded-[12px] bg-glass text-center
                font-sans italic text-[16px] text-white
                placeholder:text-[#6f6f6f] placeholder:italic
                outline-none focus:ring-2 focus:ring-white/20"
              style={{ letterSpacing: '-0.48px' }}
            />
          </Section>

          <Section title="Enter Room Code" subtitle="Enter the code your host shared.">
            <CodeBoxes mode="input" value={code} onChange={setCode} size="lg" />
          </Section>

          <div className="flex flex-col gap-2">
            <PrimaryButton
              label={submitting ? 'Joining…' : 'Join room'}
              disabled={!canSubmit}
              onClick={onJoin}
            />
            {error && (
              <p className="text-center font-sans text-[12px] text-red-300/90">{error}</p>
            )}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
