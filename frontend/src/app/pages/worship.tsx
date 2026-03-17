import { useState } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { Music, Plus, Mic, Link as LinkIcon, ExternalLink } from "lucide-react";

export function Worship() {
  const { songs, addSong } = useMockData();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addSong({ title, artist, link });
    setTitle("");
    setArtist("");
    setLink("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Louvores</h1>
          <p className="text-muted-foreground">Repertório de músicas e hinos da igreja.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Música
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Adicionar Nova Música</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Música *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Lindo És"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Artista / Ministério</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Livres para Adorar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link para ouvir (YouTube, Spotify, etc.)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
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
                Adicionar ao Repertório
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {songs.map(song => (
          <Card key={song.id} className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{song.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mic className="w-3 h-3" />
                  {song.artist || "Artista Desconhecido"}
                </div>
              </div>
            </div>
            
            {song.link ? (
              <a 
                href={song.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent hover:bg-accent/80 text-sm font-medium rounded-md transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Ouvir Música
                <ExternalLink className="w-3 h-3 ml-1 text-muted-foreground" />
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md opacity-50 cursor-not-allowed">
                Sem link disponível
              </div>
            )}
          </Card>
        ))}
        {songs.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhuma música adicionada ao repertório ainda.
          </div>
        )}
      </div>
    </div>
  );
}