'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Loader2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  CreditCard,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';

interface PlanItem {
  id: number;
  name: string;
  tier: string;
  priceMxn: number;
  minutesIncluded: number;
  maxSessionsMonth?: number;
  maxSessionDurationSec: number;
  isActive: boolean;
  activeSubscriptions: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.get<PlanItem[]>('/minutas/admin/plans');
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleActive = async (plan: PlanItem) => {
    try {
      await api.patch(`/minutas/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      setToast({ message: `Plan ${plan.isActive ? 'desactivado' : 'activado'}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al actualizar estado', type: 'error' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    try {
      await api.patch(`/minutas/admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        priceMxn: editingPlan.priceMxn,
        minutesIncluded: editingPlan.minutesIncluded,
        maxSessionsMonth: editingPlan.maxSessionsMonth,
        maxSessionDurationSec: editingPlan.maxSessionDurationSec
      });
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p));
      setEditingPlan(null);
      setToast({ message: 'Plan actualizado correctamente', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al guardar cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':          return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'team':         return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'early_access': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      default:             return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-white/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="group relative flex flex-col rounded-3xl border border-white/5 bg-[#111317] p-6 transition-all hover:border-white/10">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${getTierColor(plan.tier)}`}>
                {plan.tier.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(plan)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${plan.isActive ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${plan.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <button 
                  onClick={() => setEditingPlan(plan)}
                  className="rounded-lg p-1.5 text-white/20 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">{plan.name}</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">${plan.priceMxn.toLocaleString('es-MX')}</span>
              <span className="text-xs text-white/40 font-bold uppercase tracking-tight">MXN/mes</span>
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
              <PlanStat label="Minutos incluidos" value={plan.minutesIncluded} />
              <PlanStat label="Sesiones / mes" value={plan.maxSessionsMonth === 0 || !plan.maxSessionsMonth ? 'Ilimitadas' : plan.maxSessionsMonth} />
              <PlanStat label="Duración máx." value={`${plan.maxSessionDurationSec / 60}m`} />
            </div>

            {/* Subscriptions badge */}
            <div className="mt-auto pt-6">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${plan.activeSubscriptions > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                <Users size={14} />
                {plan.activeSubscriptions} suscripciones activas
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0f14] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">Editar Plan</h2>
                <p className="text-sm text-white/40">Tier: {editingPlan.tier.replace('_', ' ')}</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="rounded-xl p-2 text-white/20 hover:bg-white/5 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Nombre del Plan</label>
                  <input 
                    type="text" 
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Precio MXN</label>
                    <input 
                      type="number" 
                      value={editingPlan.priceMxn}
                      onChange={e => setEditingPlan({...editingPlan, priceMxn: Number(e.target.value)})}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Minutos Incluidos</label>
                    <input 
                      type="number" 
                      value={editingPlan.minutesIncluded}
                      onChange={e => setEditingPlan({...editingPlan, minutesIncluded: Number(e.target.value)})}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Sesiones / Mes</label>
                    <input 
                      type="number" 
                      value={editingPlan.maxSessionsMonth ?? 0}
                      placeholder="0 = Ilimitadas"
                      onChange={e => setEditingPlan({...editingPlan, maxSessionsMonth: Number(e.target.value)})}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Duración Máx (min)</label>
                    <input 
                      type="number" 
                      value={editingPlan.maxSessionDurationSec / 60}
                      onChange={e => setEditingPlan({...editingPlan, maxSessionDurationSec: Number(e.target.value) * 60})}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-light hover:shadow-primary/40 disabled:opacity-50 transition-all"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right-10 duration-300 z-[60] ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className="font-bold text-white/80">{value}</span>
    </div>
  );
}
