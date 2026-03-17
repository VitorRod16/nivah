import { useState } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { Church, Plus, MapPin, Edit2, Trash2 } from "lucide-react";

export function Ministries() {
  const { ministries, addMinistry, updateMinistry, deleteMinistry } = useMockData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setCity("");
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (ministry: any) => {
    setName(ministry.name);
    setDescription(ministry.description || "");
    setCity(ministry.city || "");
    setEditingId(ministry.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ministério? Os membros vinculados a ele perderão o vínculo.")) {
      deleteMinistry(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;
    
    if (editingId) {
      updateMinistry(editingId, { name, description, city });
    } else {
      addMinistry({ name, description, city });
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ministérios</h1>
          <p className="text-muted-foreground">Gerencie as igrejas e congregações.</p>
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
          {isAdding && !editingId ? "Cancelar" : "Novo Ministério"}
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Editar Ministério" : "Cadastrar Novo Ministério"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Ministério/Igreja *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Igreja Metodista Central"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade *</label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Detalhes adicionais sobre o ministério..."
              />
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
                {editingId ? "Atualizar" : "Salvar"} Ministério
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.map(ministry => (
          <Card key={ministry.id} className="p-6 flex flex-col h-full relative group">
            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 bg-background/80 p-1 rounded-md">
              <button
                onClick={() => handleEdit(ministry)}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                title="Editar ministério"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(ministry.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                title="Excluir ministério"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-4 pr-16">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Church className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{ministry.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {ministry.city}
                </div>
              </div>
            </div>
            {ministry.description && (
              <p className="mt-4 text-sm text-muted-foreground flex-grow">
                {ministry.description}
              </p>
            )}
          </Card>
        ))}
        {ministries.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum ministério cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}