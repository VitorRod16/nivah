import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useMockData, Transacao } from '../context/MockDataContext';
import { useRole } from '../hooks/useRole';

const CATEGORIAS = ['DÍZIMO', 'OFERTA', 'DESPESA', 'OUTRO'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

type FormState = {
  tipo: 'ENTRADA' | 'SAIDA';
  valor: string;
  descricao: string;
  categoria: string;
  data: string;
  igrejaId: string;
};

const emptyForm = (igrejaId = ''): FormState => ({
  tipo: 'ENTRADA',
  valor: '',
  descricao: '',
  categoria: 'DÍZIMO',
  data: new Date().toISOString().split('T')[0],
  igrejaId,
});

export function Dizimos() {
  const { igrejas, transacoes, addTransacao, updateTransacao, deleteTransacao } = useMockData();
  const { canManage } = useRole();

  const [filterIgrejaId, setFilterIgrejaId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = filterIgrejaId ? transacoes.filter(t => t.igrejaId === filterIgrejaId) : transacoes;
    return [...list].sort((a, b) => b.data.localeCompare(a.data));
  }, [transacoes, filterIgrejaId]);

  const totais = useMemo(() => {
    const entradas = filtered.filter(t => t.tipo === 'ENTRADA').reduce((s, t) => s + Number(t.valor), 0);
    const saidas = filtered.filter(t => t.tipo === 'SAIDA').reduce((s, t) => s + Number(t.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

  const igrejaName = (id: string) => igrejas.find(ig => ig.id === id)?.nome ?? id;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(igrejas[0]?.id ?? ''));
    setError('');
    setShowForm(true);
  };

  const openEdit = (t: Transacao) => {
    setEditingId(t.id);
    setForm({
      tipo: t.tipo,
      valor: String(t.valor),
      descricao: t.descricao ?? '',
      categoria: t.categoria ?? 'OUTRO',
      data: t.data,
      igrejaId: t.igrejaId,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.igrejaId) { setError('Selecione uma igreja.'); return; }
    const valor = parseFloat(form.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { setError('Valor inválido.'); return; }
    if (!form.data) { setError('Data é obrigatória.'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, valor };
      if (editingId) {
        await updateTransacao(editingId, payload);
      } else {
        await addTransacao(payload);
      }
      setShowForm(false);
    } catch {
      setError('Erro ao salvar transação.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransacao(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dízimos e Ofertas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle financeiro das igrejas</p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova transação
          </button>
        )}
      </div>

      {/* Church filter */}
      {igrejas.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Igreja:</label>
          <select
            value={filterIgrejaId}
            onChange={e => setFilterIgrejaId(e.target.value)}
            className="rounded-md border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas</option>
            {igrejas.map(ig => (
              <option key={ig.id} value={ig.id}>{ig.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total entradas</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totais.entradas)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total saídas</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totais.saidas)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className={`rounded-full p-3 ${totais.saldo >= 0 ? 'bg-primary/10' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <DollarSign className={`w-5 h-5 ${totais.saldo >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${totais.saldo >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totais.saldo)}</p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma transação encontrada</p>
          {canManage && <p className="text-sm mt-1">Clique em "Nova transação" para registrar</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Com que foi</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  {canManage && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}
                  >
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(t.data)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-medium ${t.tipo === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.tipo === 'ENTRADA' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {t.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="font-medium">{t.categoria ?? '—'}</span>
                      {t.descricao && (
                        <span className="text-muted-foreground ml-1">· {t.descricao}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.tipo === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.tipo === 'SAIDA' ? '-' : '+'}{formatCurrency(Number(t.valor))}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id}
                            className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                            title="Excluir"
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
      )}

      {/* Form modal */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar transação' : 'Nova transação'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Igreja *</label>
              <select
                value={form.igrejaId}
                onChange={e => setForm(f => ({ ...f, igrejaId: e.target.value }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione...</option>
                {igrejas.map(ig => <option key={ig.id} value={ig.id}>{ig.nome}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Tipo *</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'ENTRADA' | 'SAIDA' }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Valor (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Categoria</label>
              <select
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Descrição</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
