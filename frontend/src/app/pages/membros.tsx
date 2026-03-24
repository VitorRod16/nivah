import { useState, useMemo } from 'react';
import { maskPhone } from '../utils/masks';
import { Users, Mail, Phone, Plus, Trash2, Search, X, Check, User, Pencil, Tag, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { useMockData, MembroIgreja } from '../context/MockDataContext';
import { useActiveChurch } from '../context/ChurchContext';
import { useRole } from '../hooks/useRole';
import { toast } from 'sonner';
import { MemberViewModal } from '../components/MemberViewModal';

type NewMembroForm = {
  name: string; email: string; phone: string; password: string; igrejaId: string;
};

export function Membros() {
  const { membrosIgreja, igrejas, removeMembroIgreja, addMembroIgreja,
          papeis, addPapelIgreja, deletePapelIgreja,
          addPapelToMembro, removePapelFromMembro } = useMockData();
  const { activeIgreja } = useActiveChurch();
  const { canManage, isAdmin, isPastor } = useRole();

  const [search, setSearch] = useState('');

  // New member form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewMembroForm>({
    name: '', email: '', phone: '', password: '', igrejaId: activeIgreja?.id ?? '',
  });

  // Role management modal
  const [roleTarget, setRoleTarget] = useState<MembroIgreja | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Member view modal
  const [viewTarget, setViewTarget] = useState<MembroIgreja | null>(null);

  // Papeis management modal (PASTOR only)
  const [showPapeis, setShowPapeis] = useState(false);
  const [newPapelNome, setNewPapelNome] = useState('');
  const [savingPapel, setSavingPapel] = useState(false);

  const activeChurchPapeis = useMemo(
    () => papeis.filter(p => p.igrejaId === (roleTarget?.igrejaId ?? activeIgreja?.id)),
    [papeis, roleTarget, activeIgreja]
  );

  const filtered = useMemo(() => {
    const base = activeIgreja && !isAdmin
      ? membrosIgreja.filter(m => m.igrejaId === activeIgreja.id)
      : membrosIgreja;
    const q = search.toLowerCase();
    return base.filter(m =>
      m.nome.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone ?? '').includes(q)
    );
  }, [membrosIgreja, activeIgreja, isAdmin, search]);

  const openForm = () => {
    setForm({ name: '', email: '', phone: '', password: '', igrejaId: activeIgreja?.id ?? igrejas[0]?.id ?? '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório.'); return; }
    if (!form.email.trim()) { toast.error('E-mail é obrigatório.'); return; }
    if (!form.igrejaId) { toast.error('Selecione uma igreja.'); return; }
    setSaving(true);
    try {
      await addMembroIgreja({
        name: form.name.trim(), email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        igrejaId: form.igrejaId,
      });
      toast.success('Membro cadastrado com sucesso.');
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || 'Falha ao cadastrar membro.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await removeMembroIgreja(id);
      toast.success('Membro removido.');
    } catch { toast.error('Falha ao remover membro.'); }
    finally { setDeletingId(null); }
  };

  const handleAddPapel = async (papelId: string) => {
    if (!roleTarget) return;
    if (roleTarget.papeis.find(p => p.id === papelId)) return;
    setRoleLoading(true);
    try {
      await addPapelToMembro(roleTarget.id, papelId);
      toast.success('Função atribuída.');
    } catch { toast.error('Falha ao atribuir função.'); }
    finally { setRoleLoading(false); }
  };

  const handleRemovePapel = async (papelId: string) => {
    if (!roleTarget) return;
    setRoleLoading(true);
    try {
      await removePapelFromMembro(roleTarget.id, papelId);
      toast.success('Função removida.');
    } catch { toast.error('Falha ao remover função.'); }
    finally { setRoleLoading(false); }
  };

  const handleAddPapelIgreja = async () => {
    if (!newPapelNome.trim() || !activeIgreja) return;
    setSavingPapel(true);
    try {
      await addPapelIgreja(activeIgreja.id, newPapelNome.trim());
      setNewPapelNome('');
      toast.success('Função criada.');
    } catch { toast.error('Falha ao criar função.'); }
    finally { setSavingPapel(false); }
  };

  const handleDeletePapelIgreja = async (papelId: string) => {
    if (!activeIgreja) return;
    try {
      await deletePapelIgreja(activeIgreja.id, papelId);
      toast.success('Função removida.');
    } catch { toast.error('Falha ao remover função.'); }
  };

  // Sync roleTarget with live membrosIgreja data
  const liveRoleTarget = roleTarget
    ? membrosIgreja.find(m => m.id === roleTarget.id) ?? roleTarget
    : null;

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel = (role?: string) => {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'PASTOR') return 'Pastor';
    if (role === 'MEMBRO') return 'Membro';
    return null;
  };

  const colSpan = canManage
    ? (isAdmin ? 6 : isPastor ? 6 : 5)
    : (isAdmin ? 5 : 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeIgreja ? `${activeIgreja.nome} · ` : ''}{filtered.length} membro{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {isPastor && activeIgreja && (
            <button
              onClick={() => setShowPapeis(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Tag className="w-4 h-4" /> Funções
            </button>
          )}
          {canManage && (
            <button
              onClick={openForm}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo membro
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2.5"><Users className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Membros</p>
            <p className="text-xl font-bold text-foreground">{filtered.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2.5"><Tag className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Tipos de função</p>
            <p className="text-xl font-bold text-foreground">
              {papeis.filter(p => p.igrejaId === activeIgreja?.id).length}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="rounded-full bg-primary/10 p-2.5"><Crown className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Com função</p>
            <p className="text-xl font-bold text-foreground">
              {filtered.filter(m => m.papeis.length > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Membro</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Funções</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Igreja</th>}
                {canManage && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-10 h-10 opacity-30" />
                      <p className="font-medium">{search ? 'Nenhum membro encontrado.' : 'Nenhum membro cadastrado ainda.'}</p>
                      {canManage && !search && <p className="text-sm">Clique em "Novo membro" para começar.</p>}
                    </div>
                  </td>
                </tr>
              ) : filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewTarget(m)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                    >
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.nome} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 select-none">
                          {initials(m.nome)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{m.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{m.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" />{m.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {m.phone
                      ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{m.phone}</span>
                      : <span className="opacity-30">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roleLabel(m.role) && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.role === 'MEMBRO'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {roleLabel(m.role)}
                        </span>
                      )}
                      {m.papeis.map(p => (
                        <span key={p.id} className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {p.nome}
                        </span>
                      ))}
                      {!roleLabel(m.role) && m.papeis.length === 0 && (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden xl:table-cell">{m.igrejaName}</td>
                  )}
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isPastor && (
                          <button
                            onClick={() => setRoleTarget(m)}
                            className="p-1.5 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            title="Gerenciar funções"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(m.id)}
                          disabled={deletingId === m.id}
                          className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New member modal */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo membro</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-muted-foreground font-medium">Nome completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="João da Silva" value={form.name} autoFocus
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">E-mail *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="joao@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" placeholder="(61) 99999-9999" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Senha inicial</label>
              <input type="password" placeholder="Deixe em branco para gerar automática" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {igrejas.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Igreja *</label>
                <select value={form.igrejaId} onChange={e => setForm(f => ({ ...f, igrejaId: e.target.value }))}
                  className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Selecione...</option>
                  {igrejas.map(ig => <option key={ig.id} value={ig.id}>{ig.nome}</option>)}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Se o membro já tiver uma conta, ela será vinculada automaticamente. Caso contrário, uma nova conta será criada.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role management modal */}
      <Dialog open={!!liveRoleTarget} onOpenChange={v => { if (!v) setRoleTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Funções de {liveRoleTarget?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Current roles */}
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Funções atuais</p>
              {liveRoleTarget?.papeis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função atribuída.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {liveRoleTarget?.papeis.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {p.nome}
                      <button onClick={() => handleRemovePapel(p.id)} disabled={roleLoading}
                        className="hover:text-destructive transition-colors disabled:opacity-50">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add role */}
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Atribuir função</p>
              {activeChurchPapeis.filter(p => !liveRoleTarget?.papeis.find(mp => mp.id === p.id)).length === 0 ? (
                <p className="text-sm text-muted-foreground">Todas as funções disponíveis já foram atribuídas.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeChurchPapeis
                    .filter(p => !liveRoleTarget?.papeis.find(mp => mp.id === p.id))
                    .map(p => (
                      <button key={p.id} onClick={() => handleAddPapel(p.id)} disabled={roleLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50">
                        <Plus className="w-3 h-3" /> {p.nome}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {activeChurchPapeis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma função cadastrada para esta igreja. Use o botão "Funções" para criar.
              </p>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={() => setRoleTarget(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors">
              <Check className="w-3.5 h-3.5" /> Concluído
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member view modal */}
      <MemberViewModal member={viewTarget} onClose={() => setViewTarget(null)} />

      {/* Papeis management modal */}
      <Dialog open={showPapeis} onOpenChange={v => { if (!v) setShowPapeis(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Funções — {activeIgreja?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-2">
              {papeis.filter(p => p.igrejaId === activeIgreja?.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função cadastrada ainda.</p>
              ) : (
                papeis.filter(p => p.igrejaId === activeIgreja?.id).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/20">
                    <span className="text-sm font-medium text-foreground">{p.nome}</span>
                    <button onClick={() => handleDeletePapelIgreja(p.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Guitarrista, Diácono..."
                value={newPapelNome}
                onChange={e => setNewPapelNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddPapelIgreja(); }}
                className="flex-1 px-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={handleAddPapelIgreja} disabled={savingPapel || !newPapelNome.trim()}
                className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={() => setShowPapeis(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors">
              <Check className="w-3.5 h-3.5" /> Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
