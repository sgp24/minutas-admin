'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';

interface LlmModel {
  id: number;
  modelId: string;
  displayName: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
}

interface LlmConfig {
  id: number;
  activeModel: string;
  updatedAt: string;
  availableModels: LlmModel[];
}

export default function LlmPage() {
  const [config, setConfig] = useState<LlmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add model form
  const [showForm, setShowForm] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProvider, setNewProvider] = useState('gemini');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<LlmConfig>('/minutas/admin/llm-config');
      setConfig(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando configuración LLM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSetActive = async (modelId: string) => {
    if (!config || saving || modelId === config.activeModel) return;
    setSaving(true);
    try {
      const updated = await api.patch<LlmConfig>('/minutas/admin/llm-config', { activeModel: modelId });
      setConfig(updated);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Error actualizando modelo activo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (model: LlmModel) => {
    try {
      await api.patch(`/minutas/admin/llm-models/${model.id}`, { id: model.id, isActive: !model.isActive });
      setConfig(prev => prev ? {
        ...prev,
        availableModels: prev.availableModels.map(m =>
          m.id === model.id ? { ...m, isActive: !m.isActive } : m
        )
      } : prev);
    } catch (e: any) {
      setError(e?.message ?? 'Error actualizando modelo');
    }
  };

  const handleAddModel = async () => {
    if (!newModelId.trim() || !newDisplayName.trim()) {
      setFormError('Model ID y nombre son requeridos');
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const created = await api.post<LlmModel>('/minutas/admin/llm-models', {
        modelId: newModelId.trim(),
        displayName: newDisplayName.trim(),
        provider: newProvider,
        isActive: true,
      });
      setConfig(prev => prev ? {
        ...prev,
        availableModels: [...prev.availableModels, created]
      } : prev);
      setNewModelId('');
      setNewDisplayName('');
      setNewProvider('gemini');
      setShowForm(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Error creando modelo');
    } finally {
      setFormSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const geminiModels = config?.availableModels.filter(m => m.provider === 'gemini') ?? [];
  const deepseekModels = config?.availableModels.filter(m => m.provider === 'deepseek') ?? [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Bot size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Configuración LLM</h2>
          </div>
          <p className="text-sm text-white/30 ml-12">Modelo activo para generación de minutas</p>
        </div>
        <div className="flex items-center gap-3">
          {config && (
            <span className="text-xs bg-indigo-500/15 text-indigo-300 px-3 py-1.5 rounded-full font-mono border border-indigo-500/20">
              Activo: {config.activeModel}
            </span>
          )}
          <button
            onClick={load}
            className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Gemini */}
      <ModelGroup
        title="Google Gemini"
        color="blue"
        models={geminiModels}
        activeModel={config?.activeModel ?? ''}
        saving={saving}
        onSetActive={handleSetActive}
        onToggle={handleToggle}
      />

      {/* DeepSeek */}
      <ModelGroup
        title="DeepSeek"
        color="purple"
        models={deepseekModels}
        activeModel={config?.activeModel ?? ''}
        saving={saving}
        onSetActive={handleSetActive}
        onToggle={handleToggle}
      />

      {/* Add model */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-6">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-all"
        >
          <Plus size={16} />
          Agregar modelo al catálogo
        </button>

        {showForm && (
          <div className="mt-5 space-y-3">
            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={newModelId}
                onChange={e => setNewModelId(e.target.value)}
                placeholder="Model ID (ej: gemini-2.5-flash)"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
              <input
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                placeholder="Nombre (ej: Gemini 2.5 Flash)"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
              <select
                value={newProvider}
                onChange={e => setNewProvider(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="gemini">gemini</option>
                <option value="deepseek">deepseek</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddModel}
                disabled={formSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40"
              >
                {formSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Agregar
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {config && (
        <p className="text-xs text-white/15 text-right">
          Última actualización: {new Date(config.updatedAt).toLocaleString('es-MX')}
        </p>
      )}
    </div>
  );
}

function ModelGroup({
  title, color, models, activeModel, saving, onSetActive, onToggle,
}: {
  title: string;
  color: 'blue' | 'purple';
  models: LlmModel[];
  activeModel: string;
  saving: boolean;
  onSetActive: (id: string) => void;
  onToggle: (m: LlmModel) => void;
}) {
  const colorMap = {
    blue:   { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/20', dot: 'bg-blue-400' },
    purple: { badge: 'bg-purple-500/15 text-purple-300 border-purple-500/20', dot: 'bg-purple-400' },
  };
  const c = colorMap[color];

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111317] p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">{title}</h3>
        <span className="text-xs text-white/20">({models.length})</span>
      </div>

      {models.length === 0 ? (
        <p className="text-sm text-white/20">Sin modelos registrados</p>
      ) : (
        <div className="space-y-2">
          {models.map(model => {
            const isActive = model.modelId === activeModel;
            return (
              <div
                key={model.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-indigo-500/30 bg-indigo-500/8'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border ${c.badge}`}>
                    {model.provider}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{model.displayName}</p>
                    <p className="text-xs text-white/25 font-mono mt-0.5">{model.modelId}</p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20 ml-1">
                      EN USO
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(model)}
                    title={model.isActive ? 'Deshabilitar' : 'Habilitar'}
                    className={`p-2 rounded-xl transition-all ${
                      model.isActive
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-white/15 hover:bg-white/5 hover:text-white/40'
                    }`}
                  >
                    {model.isActive ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <button
                    onClick={() => onSetActive(model.modelId)}
                    disabled={saving || isActive || !model.isActive}
                    className={`text-xs px-4 py-1.5 rounded-xl font-bold transition-all border ${
                      isActive
                        ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/10 cursor-default'
                        : 'border-white/10 text-white/40 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-default'
                    }`}
                  >
                    {isActive ? 'Activo' : 'Usar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
