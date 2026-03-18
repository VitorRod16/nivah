import { useState } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { Crown, Plus, Check, Award, Users, Church, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Leadership() {
  const { leaders, addLeader, deleteLeader, members, ministries } = useMockData();
  const [isAdding, setIsAdding] = useState(false);

  const [memberId, setMemberId] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);

  const toggleMinistry = (id: string) => {
    setSelectedMinistries(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const addRole = () => {
    if (roleInput.trim() && !roles.includes(roleInput.trim())) {
      setRoles([...roles, roleInput.trim()]);
      setRoleInput("");
    }
  };

  const removeRole = (role: string) => {
    setRoles(roles.filter(r => r !== role));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || roles.length === 0 || selectedMinistries.length === 0) return;
    addLeader({ memberId, roles, ministryIds: selectedMinistries });
    setMemberId("");
    setRoles([]);
    setSelectedMinistries([]);
    setIsAdding(false);
  };

  const handleDelete = async (leaderId: string, leaderMemberId: string) => {
    const memberLeadershipCount = leaders.filter(l => l.memberId === leaderMemberId).length;
    await deleteLeader(leaderId);
    if (memberLeadershipCount <= 1) {
      const member = members.find(m => m.id === leaderMemberId);
      toast.info(`${member?.name || "Membro"} revertido para Membro.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Liderança</h1>
          <p className="text-muted-foreground">Vincule membros a papéis de liderança em ministérios.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Liderança
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Líder</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Membro *</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione um membro</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Papéis (ex: Músico, Pastor, Tesoureiro) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Digite o papel e aperte Enter"
                  />
                  <button
                    type="button"
                    onClick={addRole}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Adicionar
                  </button>
                </div>
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {roles.map(role => (
                      <span key={role} className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                        {role}
                        <button type="button" onClick={() => removeRole(role)} className="ml-1 hover:text-red-500 font-bold">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Ministérios Vinculados * (Selecione um ou mais)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ministries.map(ministry => (
                  <label
                    key={ministry.id}
                    className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedMinistries.includes(ministry.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMinistries.includes(ministry.id)}
                      onChange={() => toggleMinistry(ministry.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 flex items-center justify-center border rounded ${
                      selectedMinistries.includes(ministry.id) ? 'bg-primary border-primary' : 'border-input'
                    }`}>
                      {selectedMinistries.includes(ministry.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm font-medium">{ministry.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!memberId || roles.length === 0 || selectedMinistries.length === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Salvar Liderança
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaders.map(leader => {
          const member = members.find(m => m.id === leader.memberId);
          const leaderMinistries = leader.ministryIds.map(id => ministries.find(m => m.id === id)).filter(Boolean);

          if (!member) return null;

          return (
            <Card key={leader.id} className="p-6 relative group">
              <button
                onClick={() => handleDelete(leader.id, leader.memberId)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Excluir liderança"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    Líder
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Papéis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {leader.roles.map(role => (
                      <span key={role} className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                    <Church className="w-3 h-3" /> Ministérios
                  </h4>
                  <ul className="space-y-1">
                    {leaderMinistries.map(m => (
                      <li key={m?.id} className="text-sm bg-accent/50 px-2 py-1 rounded">
                        {m?.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
        {leaders.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhuma liderança cadastrada ainda.
          </div>
        )}
      </div>
    </div>
  );
}
