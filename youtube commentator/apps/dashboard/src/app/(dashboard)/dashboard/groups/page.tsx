'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, FolderKanban, Trash2, Edit, Loader2, Users as UsersIcon } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [creating, setCreating] = useState(false);

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

  const load = async () => {
    try {
      const res: any = await api.groups.list();
      if (res.success) setGroups(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.groups.create({ name: newName, description: newDesc, color: newColor });
      setNewName(''); setNewDesc(''); setShowCreate(false);
      await load();
    } catch {} finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    await api.groups.delete(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channel Groups</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Organize channels into custom groups</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-40 shimmer" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">Create groups to organize your channels for batch operations.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {groups.map((g) => (
            <div key={g.id} className="glass-card p-5 group hover:border-[var(--color-border-active)] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${g.color}20`, color: g.color }}>
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{g.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{g.description || 'No description'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{g.channelCount} channels</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn-ghost p-1.5"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(g.id)} className="btn-ghost p-1.5 text-[var(--color-accent-red)] hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="glass-card p-8 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Channel Group</h3>
            <div className="space-y-4">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" placeholder="Group name" autoFocus />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="input-field resize-none h-20" placeholder="Description (optional)" />
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Color</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} className={`w-7 h-7 rounded-lg transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/30' : ''}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={create} disabled={creating || !newName.trim()} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
