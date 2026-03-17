import { useState } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { BookOpen, Plus, User, AlignLeft } from "lucide-react";

export function Studies() {
  const { studies, addStudy } = useMockData();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    addStudy({ title, author, content });
    setTitle("");
    setAuthor("");
    setContent("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estudos Bíblicos</h1>
          <p className="text-muted-foreground">Publique e gerencie estudos e devocionais.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Estudo
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Estudo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Estudo *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: O Poder da Oração"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Autor / Preletor</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Pr. Carlos Silva"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo do Estudo *</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px] resize-y"
                placeholder="Escreva ou cole o conteúdo do estudo aqui..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Publicar Estudo
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        {studies.map(study => (
          <Card key={study.id} className="p-6 flex flex-col h-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{study.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  {study.author || "Autor Desconhecido"}
                </div>
              </div>
            </div>

            <div className="bg-accent/30 p-4 rounded-md flex-grow">
              <div className="flex items-start gap-2 mb-2 text-primary font-medium text-sm">
                <AlignLeft className="w-4 h-4 mt-0.5" />
                Resumo do Conteúdo
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-line">
                {study.content}
              </p>
            </div>
            
            <button className="mt-4 w-full py-2 text-sm text-primary font-medium border border-primary/20 rounded-md hover:bg-primary/5 transition-colors">
              Ler Estudo Completo
            </button>
          </Card>
        ))}
        {studies.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum estudo cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}