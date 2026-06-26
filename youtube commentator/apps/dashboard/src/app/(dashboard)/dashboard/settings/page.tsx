'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Settings, Palette, Clock, Globe, Bell, BellOff,
  Monitor, Eye, SortAsc, Loader2, Check, Save,
  Webhook, RefreshCw, Gauge,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await api.settings.get();
        if (res.success) setSettings(res.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.settings.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-40 shimmer" />)}
      </div>
    );
  }

  const themes = [
    { id: 'dark', label: 'Dark', color: '#0c1121' },
    { id: 'midnight', label: 'Midnight', color: '#0a0a1a' },
    { id: 'ocean', label: 'Ocean', color: '#0c1829' },
  ];

  const timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Customize your platform preferences</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
            <Palette className="w-4 h-4 text-[var(--color-accent-purple)]" />
          </div>
          <div>
            <h3 className="font-semibold">Appearance</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Customize the look and feel</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Theme</label>
            <div className="flex gap-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    settings?.theme === t.id
                      ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-active)]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg border border-[var(--color-border-primary)]" style={{ background: t.color }} />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" /> Default View
              </label>
              <select value={settings?.defaultView || 'grid'} onChange={(e) => update('defaultView', e.target.value)} className="input-field cursor-pointer">
                <option value="grid">Grid</option>
                <option value="table">Table</option>
                <option value="list">List</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block flex items-center gap-2">
                <SortAsc className="w-3.5 h-3.5" /> Default Sort
              </label>
              <select value={settings?.defaultSort || 'name'} onChange={(e) => update('defaultSort', e.target.value)} className="input-field cursor-pointer">
                <option value="name">Name</option>
                <option value="subscribers">Subscribers</option>
                <option value="videos">Videos</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[var(--color-accent-blue)]" />
          </div>
          <div>
            <h3 className="font-semibold">Regional</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Language and timezone settings</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Timezone
            </label>
            <select value={settings?.timezone || 'UTC'} onChange={(e) => update('timezone', e.target.value)} className="input-field cursor-pointer">
              {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Language
            </label>
            <select value={settings?.language || 'en'} onChange={(e) => update('language', e.target.value)} className="input-field cursor-pointer">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[var(--color-accent-amber)]" />
          </div>
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Control how you receive alerts</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { key: 'notifyInApp', label: 'In-App Notifications', desc: 'Show notifications inside the dashboard', icon: Bell },
            { key: 'notifyEmail', label: 'Email Notifications', desc: 'Receive alerts via email', icon: Monitor },
            { key: 'notifyWebhook', label: 'Webhook Notifications', desc: 'Send events to a webhook URL', icon: Webhook },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-bg-elevated)]/30 transition-colors">
              <div className="flex items-center gap-3">
                <n.icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{n.desc}</p>
                </div>
              </div>
              <button
                onClick={() => update(n.key, !settings?.[n.key])}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  settings?.[n.key] ? 'bg-[var(--color-accent-blue)]' : 'bg-[var(--color-bg-input)] border border-[var(--color-border-primary)]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                  settings?.[n.key] ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          ))}

          {settings?.notifyWebhook && (
            <div className="animate-fade-in pl-7">
              <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block">Webhook URL</label>
              <input
                type="url"
                value={settings?.webhookUrl || ''}
                onChange={(e) => update('webhookUrl', e.target.value)}
                className="input-field"
                placeholder="https://your-server.com/webhook"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sync & API */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-[var(--color-accent-emerald)]" />
          </div>
          <div>
            <h3 className="font-semibold">Sync & API Limits</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Configure sync frequency and rate limits</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Auto Sync Interval
            </label>
            <select value={settings?.autoSyncInterval || 60} onChange={(e) => update('autoSyncInterval', parseInt(e.target.value))} className="input-field cursor-pointer">
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={360}>Every 6 hours</option>
              <option value={1440}>Daily</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5" /> API Rate Limit
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={settings?.apiRateLimit || 100}
                onChange={(e) => update('apiRateLimit', parseInt(e.target.value))}
                className="flex-1 accent-[var(--color-accent-blue)]"
              />
              <span className="text-sm font-mono text-[var(--color-text-secondary)] w-16 text-right">{settings?.apiRateLimit || 100}/min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
