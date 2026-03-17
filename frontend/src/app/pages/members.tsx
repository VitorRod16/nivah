import { useState } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { Users, Plus, Mail, Phone, MapPin, Edit2, Trash2 } from "lucide-react";

export function Members() {
  const { members, addMember, updateMember, deleteMember, ministries, leaders } = useMockData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ministryId, setMinistryId] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMinistryId("");
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (member: any) => {
    setName(member.name);
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setMinistryId(member.ministryId || "");
    setEditingId(member.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      deleteMember(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    if (editingId) {
      updateMember(editingId, { name, email, phone, ministryId: ministryId || undefined });
    } else {
      addMember({ name, email, phone, ministryId: ministryId || undefined });
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membros</h1>
          <p className="text-muted-foreground">Gerencie os membros da congregação.</p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              setIsAdding(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAdding && !editingId ? "Cancelar" : "Novo Membro"}
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Editar Membro" : "Cadastrar Novo Membro"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: joao@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vínculo com Ministério (Opcional)</label>
                <select
                  value={ministryId}
                  onChange={(e) => setMinistryId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sem vínculo</option>
                  {ministries.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">O ideal é que o membro esteja vinculado a uma igreja.</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editingId ? "Atualizar" : "Salvar"} Membro
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const ministry = ministries.find(m => m.id === member.ministryId);
          const memberLeader = leaders?.find(l => l.memberId === member.id);
          const roleText = memberLeader && memberLeader.roles?.length > 0 ? memberLeader.roles.join(", ") : "Membro";

          return (
            <Card key={member.id} className="p-6 relative group">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 bg-background/80 p-1 rounded-md">
                <button
                  onClick={() => handleEdit(member)}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                  title="Editar membro"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                  title="Excluir membro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4 pr-16">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <div className="flex flex-wrap items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{roleText}</span>
                    <span>|</span>
                    {ministry ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ministry.name}
                      </span>
                    ) : (
                      <span>Sem ministério</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {members.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum membro cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}