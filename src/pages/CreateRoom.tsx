import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';
import BrandStackSm from '../components/BrandStackSm';
import PrimaryButton from '../components/PrimaryButton';
import Section from '../components/Section';
import { useRoomSession } from '../context/RoomSessionContext';
import { createGroup } from '../lib/groups';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { setSession } = useRoomSession();
  const [hostName, setHostName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = hostName.trim().length > 0 && !submitting;

  const startSwiping = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { group, hostMember } = await createGroup({
        groupName: groupName.trim() || 'Binge-watchers',
        hostName: hostName.trim(),
      });
      setSession({
        groupId: group.id,
        memberId: hostMember.id,
        inviteCode: group.invite_code,
        groupName: group.group_name,
        displayName: hostMember.display_name,
        seedMovieIds: group.seed_movie_ids,
      });
      navigate('/swipe');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create room');
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
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Alex"
              maxLength={24}
              className="w-full h-[50px] rounded-[12px] bg-glass text-center
                font-sans italic text-[16px] text-white
                placeholder:text-[#6f6f6f] placeholder:italic
                outline-none focus:ring-2 focus:ring-white/20"
              style={{ letterSpacing: '-0.48px' }}
            />
          </Section>

          <Section
            title="What’s your movie group name?"
            subtitle="Name your group. Own the remote."
          >
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Binge-watchers"
              maxLength={32}
              className="w-full h-[50px] rounded-[12px] bg-glass text-center
                font-sans italic text-[16px] text-white
                placeholder:text-[#6f6f6f] placeholder:italic
                outline-none focus:ring-2 focus:ring-white/20"
              style={{ letterSpacing: '-0.48px' }}
            />
          </Section>

          <div className="flex flex-col gap-2">
            <PrimaryButton
              label={submitting ? 'Creating…' : 'Create room'}
              onClick={startSwiping}
              disabled={!canSubmit}
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
