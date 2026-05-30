import { supabase } from './supabase';
import { pickSeedMovies } from './movies';
import type { SwipeRecord, TasteVector } from '../types/movie';

export type GroupRow = {
  id: string;
  invite_code: string;
  group_name: string;
  seed_movie_ids: number[];
};

export type MemberRow = {
  id: string;
  group_id: string;
  display_name: string;
  completed_at: string | null;
};

export type MemberResult = {
  member: MemberRow;
  vector: TasteVector;
};

function randomInviteCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Host flow: create a group with a fresh 4-digit code and 10 seed movies,
 * then insert the host as the first member. On code collision, retries up
 * to 5 times.
 */
export async function createGroup(args: {
  groupName: string;
  hostName: string;
}): Promise<{ group: GroupRow; hostMember: MemberRow }> {
  const seedMovies = pickSeedMovies(10);
  const seedIds = seedMovies.map((m) => m.tmdb_id);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInviteCode();
    const { data, error } = await supabase
      .from('groups')
      .insert({
        invite_code: code,
        group_name: args.groupName,
        seed_movie_ids: seedIds,
      })
      .select()
      .single();

    if (!error && data) {
      const group = data as GroupRow;
      const hostMember = await addMember(group.id, args.hostName);
      return { group, hostMember };
    }

    lastError = error;
    // Unique violation on invite_code → retry with a new code; else bail.
    if (error?.code !== '23505') break;
  }
  throw new Error(`createGroup failed: ${(lastError as Error)?.message ?? 'unknown error'}`);
}

/**
 * Guest flow: look up the group by code, then insert the guest as a member.
 * Returns null if no group matches the code.
 */
export async function joinGroup(args: {
  code: string;
  displayName: string;
}): Promise<{ group: GroupRow; member: MemberRow } | null> {
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', args.code)
    .maybeSingle();

  if (groupError) throw new Error(`joinGroup lookup failed: ${groupError.message}`);
  if (!groupData) return null;

  const group = groupData as GroupRow;
  const member = await addMember(group.id, args.displayName);
  return { group, member };
}

async function addMember(groupId: string, displayName: string): Promise<MemberRow> {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, display_name: displayName })
    .select()
    .single();
  if (error || !data) throw new Error(`addMember failed: ${error?.message ?? 'no row returned'}`);
  return data as MemberRow;
}

/** Upserts the member's swipes and marks them complete. */
export async function submitSwipes(args: {
  memberId: string;
  swipes: SwipeRecord[];
  tasteVector: TasteVector;
}): Promise<void> {
  const rows = args.swipes.map((s) => ({
    member_id: args.memberId,
    tmdb_id: s.tmdb_id,
    vote: s.vote,
  }));

  const { error: swipeErr } = await supabase
    .from('swipes')
    .upsert(rows, { onConflict: 'member_id,tmdb_id' });
  if (swipeErr) throw new Error(`submitSwipes failed: ${swipeErr.message}`);

  const { error: tasteErr } = await supabase
    .from('taste_profiles')
    .upsert({ member_id: args.memberId, vector: args.tasteVector });
  if (tasteErr) throw new Error(`submitTaste failed: ${tasteErr.message}`);

  const { error: memberErr } = await supabase
    .from('group_members')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', args.memberId);
  if (memberErr) throw new Error(`mark complete failed: ${memberErr.message}`);
}

/** Fetch members + their taste vectors for the results screen. */
export async function fetchGroupResults(groupId: string): Promise<{
  group: GroupRow;
  members: MemberRow[];
  results: MemberResult[];
}> {
  const { data: groupData, error: groupErr } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
  if (groupErr || !groupData) {
    throw new Error(`fetchGroupResults group: ${groupErr?.message ?? 'not found'}`);
  }

  const { data: memberData, error: memberErr } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (memberErr) throw new Error(`fetchGroupResults members: ${memberErr.message}`);

  const members = (memberData ?? []) as MemberRow[];
  const memberIds = members.map((m) => m.id);

  let results: MemberResult[] = [];
  if (memberIds.length > 0) {
    const { data: tasteData, error: tasteErr } = await supabase
      .from('taste_profiles')
      .select('member_id, vector')
      .in('member_id', memberIds);
    if (tasteErr) throw new Error(`fetchGroupResults taste: ${tasteErr.message}`);

    const tasteByMember = new Map<string, TasteVector>(
      (tasteData ?? []).map((row: { member_id: string; vector: TasteVector }) => [
        row.member_id,
        row.vector,
      ]),
    );
    results = members
      .filter((m) => tasteByMember.has(m.id))
      .map((m) => ({ member: m, vector: tasteByMember.get(m.id)! }));
  }

  return { group: groupData as GroupRow, members, results };
}

/** True when every member has a completed_at timestamp. */
export function allMembersComplete(members: MemberRow[]): boolean {
  return members.length > 0 && members.every((m) => m.completed_at !== null);
}
