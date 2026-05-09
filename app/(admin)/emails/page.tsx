'use client';

import { useState } from 'react';
import {
  Mail,
  UserPlus,
  CheckCircle2,
  CreditCard,
  XCircle,
  AlertTriangle,
  Send,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

interface EmailType {
  id: string;
  label: string;
  subject: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
}

const EMAIL_TYPES: EmailType[] = [
  {
    id: 'bienvenida',
    label: 'Bienvenida',
    subject: 'Bienvenido a Minutas.com.mx',
    description: 'Se envía al registrarse. Incluye acceso al dashboard y resumen del plan gratuito.',
    icon: UserPlus,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    badge: 'Registro',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'confirmacion',
    label: 'Confirmación de correo',
    subject: 'Confirma tu correo electrónico',
    description: 'Enviado tras el registro. Contiene el enlace de verificación con expiración de 24h.',
    icon: Mail,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    badge: 'Verificación',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'suscripcion',
    label: 'Suscripción activa',
    subject: 'Tu plan [Pro/Team] está activo',
    description: 'Se envía cuando Stripe confirma el pago. Muestra el plan activo y sus beneficios.',
    icon: CreditCard,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
    badge: 'Stripe webhook',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  {
    id: 'cancelacion',
    label: 'Cancelación de plan',
    subject: 'Tu plan ha sido cancelado',
    description: 'Se envía al cancelar suscripción. Muestra la fecha límite de acceso y CTA para reactivar.',
    icon: XCircle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    badge: 'Stripe webhook',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'fallo_pago',
    label: 'Fallo de pago',
    subject: 'Acción requerida — problema con tu pago',
    description: 'Enviado cuando Stripe no puede cobrar. Urgente: dirige al portal de pagos.',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10',
    badge: 'Stripe webhook',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
];

interface SendResult {
  success: boolean;
  message: string;
  subject: string;
  sentTo: string;
  sentName: string;
}

export default function EmailsPage() {
  const [selectedType, setSelectedType] = useState<EmailType | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openModal = (type: EmailType) => {
    setSelectedType(type);
    setResult(null);
    setError(null);
  };

  const closeModal = () => {
    setSelectedType(null);
    setRecipientEmail('');
    setRecipientName('');
    setResult(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!selectedType || !recipientEmail.trim()) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post<SendResult>('/minutas/admin/emails/send-test', {
        emailType: selectedType.id,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar el correo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Correos transaccionales</h1>
          <p className="mt-1 text-sm text-white/40">
            Envía correos de prueba con datos realistas aleatorios para validar el diseño.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-xs font-bold text-white/40">Datos aleatorios</span>
        </div>
      </div>

      {/* Email catalog */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EMAIL_TYPES.map((type) => (
          <EmailCard key={type.id} type={type} onSend={() => openModal(type)} />
        ))}
      </div>

      {/* Modal */}
      {selectedType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111317] shadow-2xl animate-in zoom-in-95 duration-200">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selectedType.iconBg}`}>
                  <selectedType.icon size={18} className={selectedType.iconColor} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedType.label}</p>
                  <p className="text-xs text-white/30">Correo de prueba</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/20 transition-colors hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 px-6 py-6">
              {result ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-300">{result.message}</p>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <DetailRow label="Para" value={result.sentTo} />
                    <DetailRow label="Nombre usado" value={result.sentName} />
                    <DetailRow label="Asunto" value={result.subject} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { setResult(null); setRecipientEmail(''); setRecipientName(''); }}
                      className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-bold text-white/60 transition-all hover:bg-white/5 hover:text-white"
                    >
                      Enviar otro
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Form state */
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                      Correo destinatario <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="nombre@empresa.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-primary/50 focus:bg-white/[0.07]"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                      Nombre <span className="text-white/20">(opcional — se usa aleatorio)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ana García"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-primary/50 focus:bg-white/[0.07]"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                      <AlertTriangle size={14} className="shrink-0 text-red-400" />
                      <p className="text-xs font-semibold text-red-300">{error}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 mb-2">Vista previa del asunto</p>
                    <p className="text-sm text-white/60 font-medium">{selectedType.subject}</p>
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={sending || !recipientEmail.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {sending ? 'Enviando...' : 'Enviar correo de prueba'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailCard({ type, onSend }: { type: EmailType; onSend: () => void }) {
  return (
    <div className="group flex flex-col rounded-3xl border border-white/5 bg-[#111317] p-6 transition-all hover:border-white/10 hover:bg-[#13161c]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${type.iconBg} transition-transform group-hover:scale-110`}>
          <type.icon size={20} className={type.iconColor} />
        </div>
        {type.badge && (
          <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-1 ${type.badgeColor}`}>
            {type.badge}
          </span>
        )}
      </div>

      <h3 className="font-bold text-white mb-1">{type.label}</h3>
      <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1">{type.description}</p>

      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-0.5">Asunto</p>
        <p className="text-xs text-white/50 font-medium truncate">{type.subject}</p>
      </div>

      <button
        onClick={onSend}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-white/60 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary-light"
      >
        <Send size={14} />
        Enviar prueba
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/20 shrink-0">{label}</span>
      <span className="text-xs text-white/60 text-right font-medium">{value}</span>
    </div>
  );
}
