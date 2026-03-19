import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Users, Mail, Phone, Plus, Trash2, Search, Church } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';
import { useRole } from '../hooks/useRole';
import { toast } from 'sonner';

export function Membros() {
  const { membrosIgreja, igrejas, removeMembroIgreja, addMembroIgreja } = useMockData();
  const { canManage, isAdmin } = useRole();

  const [search, setSearch] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addIgrejaId, setAddIgrejaId] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filtered = membrosIgreja.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.igrejaName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!addEmail || !addIgrejaId) { toast.error('Informe o e-mail e a igreja.'); return; }
    try {
      await addMembroIgreja(addEmail, addIgrejaId, addPhone || undefined);
      toast.success('Membro vinculado à igreja.');
      setAddEmail('');
      setAddIgrejaId('');
      setAddPhone('');
      setIsAdding(false);
    } catch (e: any) {
      toast.error(e.message || 'Falha ao adicionar membro.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMembroIgreja(id);
      toast.success('Membro removido.');
    } catch {
      toast.error('Falha ao remover membro.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Membros</h1>
          <p className="text-muted-foreground">Membros vinculados às igrejas</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAdding(v => !v)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && canManage && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium">Vincular usuário existente a uma igreja</p>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="E-mail do usuário"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              type="email"
            />
            <select
              value={addIgrejaId}
              onChange={e => setAddIgrejaId(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecionar igreja...</option>
              {igrejas.map(ig => (
                <option key={ig.id} value={ig.id}>{ig.nome}</option>
              ))}
            </select>
            <Input
              placeholder="Telefone (opcional)"
              value={addPhone}
              onChange={e => setAddPhone(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Confirmar</Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Membros</p>
          <p className="text-2xl mt-1">{membrosIgreja.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Igrejas</p>
          <p className="text-2xl mt-1">{new Set(membrosIgreja.map(m => m.igrejaId)).size}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, e-mail ou igreja..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-2 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto opacity-40" />
              <p>{search ? 'Nenhum membro encontrado.' : 'Nenhum membro cadastrado ainda.'}</p>
            </div>
          </Card>
        ) : (
          filtered.map(membro => (
            <Card key={membro.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{membro.nome}</p>
                    {membro.papeis.map(p => (
                      <Badge key={p.id} variant="secondary" className="text-xs">{p.nome}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{membro.email}</span>
                    {membro.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{membro.phone}</span>}
                    <span className="flex items-center gap-1"><Church className="w-3 h-3" />{membro.igrejaName}</span>
                  </div>
                </div>
                {(isAdmin || canManage) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(membro.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
