import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Church, Plus, Trash2, Users, MapPin, Edit2, UserPlus } from 'lucide-react';
import { useMockData, type Igreja } from '../context/MockDataContext';
import { useRole } from '../hooks/useRole';
import { toast } from 'sonner';

export function Igrejas() {
  const { igrejas, addIgreja, updateIgreja, deleteIgreja } = useMockData();
  const { isAdmin, isPastor } = useRole();

  const [open, setOpen] = useState(false);
  const [editingIgreja, setEditingIgreja] = useState<Igreja | null>(null);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [descricao, setDescricao] = useState('');

  const resetForm = () => {
    setNome('');
    setCidade('');
    setDescricao('');
    setEditingIgreja(null);
  };

  const openEdit = (igreja: Igreja) => {
    setEditingIgreja(igreja);
    setNome(igreja.nome);
    setCidade(igreja.cidade ?? '');
    setDescricao(igreja.descricao ?? '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error('Informe o nome da igreja.'); return; }
    try {
      if (editingIgreja) {
        await updateIgreja(editingIgreja.id, { nome, cidade, descricao });
        toast.success('Igreja atualizada.');
      } else {
        await addIgreja({ nome, cidade, descricao });
        toast.success('Igreja cadastrada.');
      }
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Falha ao salvar.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIgreja(id);
      toast.success('Igreja removida.');
    } catch {
      toast.error('Falha ao remover.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Igrejas</h1>
          <p className="text-muted-foreground">Gerencie as igrejas cadastradas no sistema</p>
        </div>

        {(isAdmin || isPastor) && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Igreja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingIgreja ? 'Editar Igreja' : 'Nova Igreja'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Primeira Igreja Batista" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: São Paulo, SP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <textarea
                    id="descricao"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Breve descrição da igreja..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave}>
                    {editingIgreja ? 'Salvar alterações' : 'Cadastrar'}
                  </Button>
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Igrejas</p>
          <p className="text-2xl mt-1">{igrejas.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pastores Vinculados</p>
          <p className="text-2xl mt-1">{igrejas.reduce((acc, ig) => acc + ig.pastores.length, 0)}</p>
        </Card>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {igrejas.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-2 text-muted-foreground">
              <Church className="w-12 h-12 mx-auto opacity-40" />
              <p>Nenhuma igreja cadastrada ainda.</p>
              {(isAdmin || isPastor) && <p className="text-sm">Clique em "Nova Igreja" para começar.</p>}
            </div>
          </Card>
        ) : (
          igrejas.map(igreja => (
            <Card key={igreja.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3>{igreja.nome}</h3>
                    <Badge variant="outline">{igreja.pastores.length} pastor{igreja.pastores.length !== 1 ? 'es' : ''}</Badge>
                  </div>

                  {igreja.cidade && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {igreja.cidade}
                    </div>
                  )}

                  {igreja.descricao && (
                    <p className="text-sm text-muted-foreground">{igreja.descricao}</p>
                  )}

                  {igreja.pastores.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>Pastores: {igreja.pastores.map(p => p.name).join(', ')}</span>
                    </div>
                  )}
                </div>

                {(isAdmin || isPastor) && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(igreja)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(igreja.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
