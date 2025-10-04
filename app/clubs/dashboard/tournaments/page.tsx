'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Tournament = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  max_teams: number;
  registration_fee: number;
  prize_pool: number | null;
  registration_deadline: string; // date
  start_date: string;            // date
  end_date: string | null;       // date
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  club_id: string;
  created_at: string;
  registered_teams?: number;
};

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubName, setClubName] = useState<string>('');
  const [clubId, setClubId] = useState<string>('');        // <- el club_id real
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // 1. Actualizar array de categorías
  const categories = [
    { value: 'primera',           label: 'Categoría 1ª' },
    { value: 'segunda',           label: 'Categoría 2ª' },
    { value: 'tercera',           label: 'Categoría 3ª' },
    { value: 'tercera especial',  label: 'Categoría 3ª (Especial)' },
    { value: 'cuarta',            label: 'Categoría 4ª' },
    { value: 'quinta',            label: 'Categoría 5ª' },
    { value: 'sexta',             label: 'Categoría 6ª' },
    { value: 'mixta',             label: 'Mixta' },
    { value: 'veteranos',         label: 'Veteranos' },
  ];

  // 2. Actualizar estado inicial
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'primera',   // valor válido para el CHECK
    max_teams: 32,
    registration_fee: 0,
    prize_pool: 0,
    registration_deadline: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.replace('/clubs/auth/login');

        // TRAER club_id del usuario (y opcionalmente el nombre del club)
        const { data: cp, error: cpErr } = await supabase
          .from('club_profiles')
          .select('club_id, name')
          .eq('id', user.id)
          .maybeSingle();
        if (cpErr || !cp?.club_id) return router.replace('/clubs/auth/login');

        setClubId(cp.club_id);
        setClubName(cp.name || '');
        await loadTournaments(cp.club_id);
      } catch (e) {
        router.replace('/clubs/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function loadTournaments(clubId: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (!error) setTournaments(data || []);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['max_teams','registration_fee','prize_pool'].includes(name) ? Number(value) || 0 : value,
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) return 'El nombre es obligatorio.';
    if (!formData.registration_deadline) return 'Falta la fecha límite de inscripción.';
    if (!formData.start_date) return 'Falta la fecha de inicio.';
    if (formData.end_date && formData.end_date < formData.start_date)
      return 'La fecha de finalización no puede ser anterior al inicio.';
    if (formData.max_teams < 2) return 'El máximo de equipos debe ser mayor a 1.';
    if (formData.registration_fee < 0 || formData.prize_pool < 0) return 'Montos no válidos.';
    return null;
  }

  // 3. Actualizar handleSubmit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    const msg = validateForm();
    if (msg) return alert(msg);

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category: formData.category,
        max_teams: formData.max_teams ?? 32,
        registration_fee: formData.registration_fee ?? 0,
        prize_pool: formData.prize_pool || null,
        registration_deadline: formData.registration_deadline,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        club_id: clubId,
        format: 'elimination',
        scoring_system: 'suma7',
        status: editingTournament ? undefined : 'registration',
      };

      if (editingTournament) {
        const { data, error } = await supabase
          .from('tournaments')
          .update(payload)
          .eq('id', editingTournament.id)
          .select()
          .single();

        if (error) {
          console.error('Update tournaments error:', {
            message: error.message, details: error.details, hint: error.hint, code: error.code
          });
          alert(`Error al actualizar el torneo: ${error.message}`);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('tournaments')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Insert tournaments error:', {
            message: error.message, details: error.details, hint: error.hint, code: error.code
          });
          alert(`Error al guardar el torneo: ${error.message}`);
          return;
        }
      }

      await loadTournaments(clubId);
      resetForm();
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al procesar el torneo');
    }
  }

  async function updateTournamentStatus(tournamentId: string, newStatus: Tournament['status']) {
    const { error } = await supabase
      .from('tournaments')
      .update({ status: newStatus })
      .eq('id', tournamentId)
      .eq('club_id', clubId);
    if (error) return alert('Error al actualizar el estado');
    setTournaments(prev => prev.map(t => (t.id === tournamentId ? { ...t, status: newStatus } : t)));
  }

  async function deleteTournament(tournamentId: string) {
    if (!confirm('¿Eliminar este torneo?')) return;
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)
      .eq('club_id', clubId);
    if (error) return alert('Error al eliminar el torneo');
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
  }

  function startEdit(t: Tournament) {
    setEditingTournament(t);
    setFormData({
      name: t.name,
      description: t.description || '',
      category: t.category,
      max_teams: t.max_teams,
      registration_fee: t.registration_fee,
      prize_pool: t.prize_pool || 0,
      registration_deadline: t.registration_deadline.split('T')[0] || t.registration_deadline,
      start_date: t.start_date.split('T')[0] || t.start_date,
      end_date: t.end_date ? (t.end_date.split('T')[0] || t.end_date) : '',
    });
    setShowCreateForm(true);
  }

  function resetForm() {
    setEditingTournament(null);
    setFormData({
      name: '',
      description: '',
      category: 'primera',  // <- cambio aquí para mantener consistencia
      max_teams: 32,
      registration_fee: 0,
      prize_pool: 0,
      registration_deadline: '',
      start_date: '',
      end_date: '',
    });
    setShowCreateForm(false);
  }

  const Title = () => (
    <div className="mb-6">
      <h1 className="section-title !text-2xl">Gestión de Torneos</h1>
      <p className="text-slate-600">Administra los torneos de {clubName}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Title />
        <div className="card">Cargando torneos…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title />
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">+ Crear Torneo</button>
      </div>

      {/* Modal Crear/Editar */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center p-4 z-50">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4">
              {editingTournament ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">Nombre del Torneo *</label>
                  <input name="name" className="field" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">Descripción</label>
                  <textarea name="description" rows={3} className="field" value={formData.description} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Categoría *</label>
                  <select name="category" className="field" value={formData.category} onChange={handleInputChange} required>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-700">Máximo de Equipos</label>
                  <input type="number" min={2} max={128} name="max_teams" className="field" value={formData.max_teams} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Costo de Inscripción</label>
                  <input type="number" min={0} step="0.01" name="registration_fee" className="field" value={formData.registration_fee} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Pozo de Premios</label>
                  <input type="number" min={0} step="0.01" name="prize_pool" className="field" value={formData.prize_pool} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Fecha Límite de Inscripción *</label>
                  <input type="date" name="registration_deadline" className="field" value={formData.registration_deadline} onChange={handleInputChange} required />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Fecha de Inicio *</label>
                  <input type="date" name="start_date" className="field" value={formData.start_date} onChange={handleInputChange} required />
                </div>

                <div>
                  <label className="text-sm text-slate-700">Fecha de Finalización</label>
                  <input type="date" name="end_date" className="field" value={formData.end_date} onChange={handleInputChange} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1">{editingTournament ? 'Actualizar' : 'Crear'} Torneo</button>
                <button type="button" onClick={resetForm} className="btn">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listado */}
      {tournaments.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {tournaments.map(t => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                <span className="text-xs rounded-full px-2 py-1 bg-slate-100 text-slate-700">{t.status}</span>
              </div>

              <div className="text-sm text-slate-600 grid grid-cols-2 gap-4 mb-3">
                <div><span className="font-medium">Categoría: </span>{t.category}</div>
                <div><span className="font-medium">Equipos: </span>{t.registered_teams || 0}/{t.max_teams}</div>
                <div><span className="font-medium">Inscripción: </span>${t.registration_fee}</div>
                <div><span className="font-medium">Premios: </span>{t.prize_pool ?? 'No definido'}</div>
                <div><span className="font-medium">Inscripciones hasta: </span>{new Date(t.registration_deadline).toLocaleDateString('es-AR')}</div>
                <div><span className="font-medium">Inicio: </span>{new Date(t.start_date).toLocaleDateString('es-AR')}</div>
              </div>

              {t.description && <p className="text-slate-700 text-sm mb-3">{t.description}</p>}

              <div className="flex gap-2">
                <button className="btn" onClick={() => startEdit(t)}>Editar</button>
                {t.status === 'draft' && <button className="btn" onClick={() => updateTournamentStatus(t.id, 'registration')}>Abrir inscripciones</button>}
                {t.status === 'registration' && (
                  <>
                    <button className="btn" onClick={() => updateTournamentStatus(t.id, 'active')}>Iniciar</button>
                    <button className="btn" onClick={() => updateTournamentStatus(t.id, 'draft')}>Pausar</button>
                  </>
                )}
                {t.status === 'active' && <button className="btn" onClick={() => updateTournamentStatus(t.id, 'completed')}>Finalizar</button>}
                {t.status !== 'cancelled' && t.status !== 'completed' && <button className="btn" onClick={() => updateTournamentStatus(t.id, 'cancelled')}>Cancelar</button>}
                {t.status === 'draft' && <button className="btn" onClick={() => deleteTournament(t.id)}>Eliminar</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <div className="text-5xl mb-3">🏆</div>
          <div className="font-semibold text-slate-900 mb-1">No hay torneos creados</div>
          <p className="text-slate-600 mb-4">Crea tu primer torneo para atraer jugadores a tu club.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>Crear Primer Torneo</button>
        </div>
      )}
    </div>
  );
}
