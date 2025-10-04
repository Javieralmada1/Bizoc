'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = { fallbackInitial?: string };

export default function ClubAvatarClient({ fallbackInitial = 'C' }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2) club_id del usuario
        const { data: cp } = await supabase
          .from('club_profiles')
          .select('club_id')
          .eq('id', user.id)
          .maybeSingle();
        if (!cp?.club_id) return;

        // 3) datos del club (incluye avatar_url)
        const { data: club } = await supabase
          .from('clubs')
          .select('name, avatar_url')
          .eq('id', cp.club_id)
          .maybeSingle();

        setAvatarUrl(club?.avatar_url ?? null);
        setClubName(club?.name ?? null);
      } catch (e) {
        // silencio: no rompemos el header si falla
      }
    })();
  }, []);

  return (
    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="Logo del club" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-xl font-bold">
          {(clubName?.[0] ?? fallbackInitial).toUpperCase()}
        </span>
      )}
    </div>
  );
}
