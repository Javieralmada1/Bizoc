'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // mismo patrón que el resto

const BUCKET_NAME = 'club-avatars'; // <-- ajusta si tu bucket tiene otro nombre

type ClubProfile = { id: string; name: string; club_id: string };
type Club = {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) Sesión
        const { data: { user }, error: uerr } = await supabase.auth.getUser();
        if (uerr) throw uerr;
        if (!user) return router.replace('/clubs/auth/login');

        // 2) Club del usuario (mismo patrón que Courts/Reservations)
        const { data: cp, error: cperr } = await supabase
          .from('club_profiles')
          .select('id,name,club_id')
          .eq('id', user.id)
          .maybeSingle();

        if (cperr) throw cperr;
        if (!cp) return router.replace('/clubs/onboarding');

        setClubProfile(cp);

        // 3) Datos del club
        const { data: c, error: cerr } = await supabase
          .from('clubs')
          .select('id,name,description,address,city,province,phone,email,avatar_url')
          .eq('id', cp.club_id)
          .maybeSingle();

        if (cerr) throw cerr;
        if (!c) throw new Error('No se encontró la información del club');

        setClub(c as Club);
        setAvatarPreview(c?.avatar_url || null);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? 'Error cargando ajustes');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function onChange<K extends keyof Club>(key: K, value: Club[K]) {
    setClub((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function onSelectAvatar(file?: File) {
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function uploadAvatarIfNeeded(clubId: string) {
    if (!avatarFile) return { avatar_url: club?.avatar_url ?? null };

    const ext = avatarFile.name.split('.').pop() || 'png';
    const path = `${clubId}/avatar.${ext}`;

    // sube y sobreescribe
    const { error: upErr } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return { avatar_url: data.publicUrl as string };
  }

  async function handleSave() {
    if (!clubProfile || !club) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setOkMsg(null);

      // Subir avatar (si cambió)
      const avatarData = await uploadAvatarIfNeeded(clubProfile.club_id);

      // Guardar club
      const payload = {
        name: club.name ?? '',
        description: club.description ?? '',
        address: club.address ?? '',
        city: club.city ?? '',
        province: club.province ?? '',
        phone: club.phone ?? '',
        email: club.email ?? '',
        avatar_url: avatarData.avatar_url,
      };

      const { error } = await supabase
        .from('clubs')
        .update(payload)
        .eq('id', clubProfile.club_id);

      if (error) throw error;

      setOkMsg('Cambios guardados correctamente.');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="section-title">Configuración</div>
        <div className="card">Cargando…</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-6">
        <div className="section-title">Configuración</div>
        <div className="card text-red-700">{errorMsg}</div>
      </div>
    );
  }

  if (!club) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title !text-2xl">Configuración del Club</h1>
          <p className="text-slate-600">Editá la información visible en tu perfil y en las reservas.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => location.reload()}>Descartar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Avatar + Nombre */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar del club" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-400">Sin foto</div>
              )}
            </div>
            <label className="mt-3 inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onSelectAvatar(e.target.files?.[0])}
              />
              <span className="btn">Cambiar foto</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Nombre del club</label>
              <input
                className="field"
                value={club.name ?? ''}
                onChange={(e) => onChange('name', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Descripción</label>
              <textarea
                className="field"
                rows={3}
                value={club.description ?? ''}
                onChange={(e) => onChange('description', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación y contacto */}
      <div className="card">
        <h2 className="font-bold text-slate-900 mb-4">Ubicación & Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-700">Dirección</label>
            <input
              className="field"
              value={club.address ?? ''}
              onChange={(e) => onChange('address', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Ciudad</label>
            <input
              className="field"
              value={club.city ?? ''}
              onChange={(e) => onChange('city', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Provincia/Estado</label>
            <input
              className="field"
              value={club.province ?? ''}
              onChange={(e) => onChange('province', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Teléfono</label>
            <input
              className="field"
              value={club.phone ?? ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="field"
              value={club.email ?? ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
        </div>
      </div>

      {(okMsg || errorMsg) && (
        <div className={`card ${okMsg ? 'text-green-700' : 'text-red-700'}`}>
          {okMsg ?? errorMsg}
        </div>
      )}
    </div>
  );
}
