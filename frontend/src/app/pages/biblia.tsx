import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

type Verse = {
  verse: number;
  text: string;
};

type GetBibleResponse = {
  book: number;
  chapter: number;
  name: string;
  verses: Record<string, { book: number; chapter: number; verse: number; text: string }>;
};

type Book = {
  name: string;
  chapters: number;
  testament: 'AT' | 'NT';
};

const BOOKS: Book[] = [
  // Antigo Testamento (índice 0–38 = livros 1–39)
  { name: 'Gênesis', chapters: 50, testament: 'AT' },
  { name: 'Êxodo', chapters: 40, testament: 'AT' },
  { name: 'Levítico', chapters: 27, testament: 'AT' },
  { name: 'Números', chapters: 36, testament: 'AT' },
  { name: 'Deuteronômio', chapters: 34, testament: 'AT' },
  { name: 'Josué', chapters: 24, testament: 'AT' },
  { name: 'Juízes', chapters: 21, testament: 'AT' },
  { name: 'Rute', chapters: 4, testament: 'AT' },
  { name: '1 Samuel', chapters: 31, testament: 'AT' },
  { name: '2 Samuel', chapters: 24, testament: 'AT' },
  { name: '1 Reis', chapters: 22, testament: 'AT' },
  { name: '2 Reis', chapters: 25, testament: 'AT' },
  { name: '1 Crônicas', chapters: 29, testament: 'AT' },
  { name: '2 Crônicas', chapters: 36, testament: 'AT' },
  { name: 'Esdras', chapters: 10, testament: 'AT' },
  { name: 'Neemias', chapters: 13, testament: 'AT' },
  { name: 'Ester', chapters: 10, testament: 'AT' },
  { name: 'Jó', chapters: 42, testament: 'AT' },
  { name: 'Salmos', chapters: 150, testament: 'AT' },
  { name: 'Provérbios', chapters: 31, testament: 'AT' },
  { name: 'Eclesiastes', chapters: 12, testament: 'AT' },
  { name: 'Cânticos', chapters: 8, testament: 'AT' },
  { name: 'Isaías', chapters: 66, testament: 'AT' },
  { name: 'Jeremias', chapters: 52, testament: 'AT' },
  { name: 'Lamentações', chapters: 5, testament: 'AT' },
  { name: 'Ezequiel', chapters: 48, testament: 'AT' },
  { name: 'Daniel', chapters: 12, testament: 'AT' },
  { name: 'Oséias', chapters: 14, testament: 'AT' },
  { name: 'Joel', chapters: 3, testament: 'AT' },
  { name: 'Amós', chapters: 9, testament: 'AT' },
  { name: 'Obadias', chapters: 1, testament: 'AT' },
  { name: 'Jonas', chapters: 4, testament: 'AT' },
  { name: 'Miquéias', chapters: 7, testament: 'AT' },
  { name: 'Naum', chapters: 3, testament: 'AT' },
  { name: 'Habacuque', chapters: 3, testament: 'AT' },
  { name: 'Sofonias', chapters: 3, testament: 'AT' },
  { name: 'Ageu', chapters: 2, testament: 'AT' },
  { name: 'Zacarias', chapters: 14, testament: 'AT' },
  { name: 'Malaquias', chapters: 4, testament: 'AT' },
  // Novo Testamento (índice 39–65 = livros 40–66)
  { name: 'Mateus', chapters: 28, testament: 'NT' },
  { name: 'Marcos', chapters: 16, testament: 'NT' },
  { name: 'Lucas', chapters: 24, testament: 'NT' },
  { name: 'João', chapters: 21, testament: 'NT' },
  { name: 'Atos', chapters: 28, testament: 'NT' },
  { name: 'Romanos', chapters: 16, testament: 'NT' },
  { name: '1 Coríntios', chapters: 16, testament: 'NT' },
  { name: '2 Coríntios', chapters: 13, testament: 'NT' },
  { name: 'Gálatas', chapters: 6, testament: 'NT' },
  { name: 'Efésios', chapters: 6, testament: 'NT' },
  { name: 'Filipenses', chapters: 4, testament: 'NT' },
  { name: 'Colossenses', chapters: 4, testament: 'NT' },
  { name: '1 Tessalonicenses', chapters: 5, testament: 'NT' },
  { name: '2 Tessalonicenses', chapters: 3, testament: 'NT' },
  { name: '1 Timóteo', chapters: 6, testament: 'NT' },
  { name: '2 Timóteo', chapters: 4, testament: 'NT' },
  { name: 'Tito', chapters: 3, testament: 'NT' },
  { name: 'Filemom', chapters: 1, testament: 'NT' },
  { name: 'Hebreus', chapters: 13, testament: 'NT' },
  { name: 'Tiago', chapters: 5, testament: 'NT' },
  { name: '1 Pedro', chapters: 5, testament: 'NT' },
  { name: '2 Pedro', chapters: 3, testament: 'NT' },
  { name: '1 João', chapters: 5, testament: 'NT' },
  { name: '2 João', chapters: 1, testament: 'NT' },
  { name: '3 João', chapters: 1, testament: 'NT' },
  { name: 'Judas', chapters: 1, testament: 'NT' },
  { name: 'Apocalipse', chapters: 22, testament: 'NT' },
];

const AT_BOOKS = BOOKS.filter(b => b.testament === 'AT');
const NT_BOOKS = BOOKS.filter(b => b.testament === 'NT');

// Traduções disponíveis no getbible.net com textos em português
const TRANSLATIONS = [
  { id: 'almeida', label: 'ARC — Almeida Revista e Corrigida', abbr: 'ARC' },
  { id: 'ara',     label: 'ARA — Almeida Revista e Atualizada', abbr: 'ARA' },
  { id: 'nvi',     label: 'NVI — Nova Versão Internacional', abbr: 'NVI' },
  { id: 'acf',     label: 'ACF — Almeida Corrigida Fiel', abbr: 'ACF' },
];

export function Biblia() {
  const [bookIndex, setBookIndex] = useState(39); // João
  const [chapter, setChapter] = useState(3);
  const [translation, setTranslation] = useState('almeida');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [searchRef, setSearchRef] = useState('');
  const [showBooks, setShowBooks] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const book = BOOKS[bookIndex];

  const fetchChapter = async (bi: number, ch: number) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    try {
      // getbible.net uses 1-based book numbers matching standard Bible order
      const bookNumber = bi + 1;
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/bible/${translation}/${bookNumber}/${ch}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!res.ok) throw new Error('Capítulo não encontrado.');
      const data: GetBibleResponse = await res.json();
      const parsed = Object.values(data.verses)
        .map(v => ({ verse: v.verse, text: v.text.trim() }))
        .sort((a, b) => a.verse - b.verse);
      setVerses(parsed);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setError('Não foi possível carregar o capítulo. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter(bookIndex, chapter);
  }, [bookIndex, chapter, translation]);

  const goTo = (bi: number, ch: number) => {
    setBookIndex(bi);
    setChapter(ch);
    setShowBooks(false);
  };

  const prevChapter = () => {
    if (chapter > 1) {
      setChapter(c => c - 1);
    } else if (bookIndex > 0) {
      const prevBook = BOOKS[bookIndex - 1];
      goTo(bookIndex - 1, prevBook.chapters);
    }
  };

  const nextChapter = () => {
    if (chapter < book.chapters) {
      setChapter(c => c + 1);
    } else if (bookIndex < BOOKS.length - 1) {
      goTo(bookIndex + 1, 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchRef.trim().toLowerCase();
    if (!input) return;

    // Try to parse "Book Chapter" or "Book Chapter:Verse"
    // Match patterns like "João 3", "João 3:16", "1 coríntios 13"
    const match = input.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    if (!match) {
      toast.error('Formato inválido. Use: "Livro Capítulo" ou "Livro Capítulo:Versículo"');
      return;
    }

    const bookName = match[1].trim();
    const ch = parseInt(match[2]);

    const found = BOOKS.findIndex(b =>
      b.name.toLowerCase().includes(bookName) ||
      bookName.includes(b.name.toLowerCase().substring(0, 4))
    );

    if (found === -1) {
      toast.error(`Livro "${match[1]}" não encontrado.`);
      return;
    }

    const targetBook = BOOKS[found];
    if (ch < 1 || ch > targetBook.chapters) {
      toast.error(`${targetBook.name} tem apenas ${targetBook.chapters} capítulo(s).`);
      return;
    }

    goTo(found, ch);
    setSearchRef('');
  };

  const copyVerse = (v: Verse) => {
    const abbr = TRANSLATIONS.find(t => t.id === translation)?.abbr ?? translation.toUpperCase();
    const text = `"${v.text}" — ${book.name} ${chapter}:${v.verse} (${abbr})`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVerse(v.verse);
      setTimeout(() => setCopiedVerse(null), 2000);
    });
  };

  const isFirst = bookIndex === 0 && chapter === 1;
  const isLast = bookIndex === BOOKS.length - 1 && chapter === book.chapters;

  return (
    <div className="space-y-6" ref={topRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TRANSLATIONS.find(t => t.id === translation)?.label ?? translation} · {book.name} {chapter}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchRef}
              onChange={e => setSearchRef(e.target.value)}
              placeholder="Ex: João 3 ou Salmos 23"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ir
          </button>
        </form>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Translation selector */}
        <select
          value={translation}
          onChange={e => setTranslation(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
          title="Tradução"
        >
          {TRANSLATIONS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Book selector */}
        <button
          onClick={() => setShowBooks(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          {book.name}
        </button>

        {/* Chapter selector */}
        <select
          value={chapter}
          onChange={e => setChapter(Number(e.target.value))}
          className="px-3 py-2 rounded-md border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
            <option key={ch} value={ch}>Capítulo {ch}</option>
          ))}
        </select>

        {/* Prev / Next */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={prevChapter}
            disabled={isFirst || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <button
            onClick={nextChapter}
            disabled={isLast || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Book browser panel */}
      {showBooks && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Antigo Testamento
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AT_BOOKS.map(b => {
                const idx = BOOKS.indexOf(b);
                const active = idx === bookIndex;
                return (
                  <button
                    key={b.slug}
                    onClick={() => goTo(idx, 1)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Novo Testamento
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NT_BOOKS.map(b => {
                const idx = BOOKS.indexOf(b);
                const active = idx === bookIndex;
                return (
                  <button
                    key={b.slug}
                    onClick={() => goTo(idx, 1)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Chapter header */}
        <div className="bg-primary/5 border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {book.name} — Capítulo {chapter}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {book.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
            {' · '}Capítulo {chapter} de {book.chapters}
          </p>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{error}</p>
              <button
                onClick={() => fetchChapter(bookIndex, chapter)}
                className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && verses.length > 0 && (
            <div className="space-y-1">
              {verses.map(v => (
                <div
                  key={v.verse}
                  className="group flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-bold text-primary/60 mt-0.5 w-6 shrink-0 text-right select-none">
                    {v.verse}
                  </span>
                  <p className="text-foreground leading-relaxed flex-1 text-[15px]">
                    {v.text}
                  </p>
                  <button
                    onClick={() => copyVerse(v)}
                    className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    title="Copiar versículo"
                  >
                    {copiedVerse === v.verse
                      ? <Check className="w-3.5 h-3.5 text-green-500" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        {!loading && verses.length > 0 && (
          <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
            <button
              onClick={prevChapter}
              disabled={isFirst}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              {chapter > 1
                ? `Capítulo ${chapter - 1}`
                : bookIndex > 0 ? BOOKS[bookIndex - 1].name : ''}
            </button>
            <span className="text-xs text-muted-foreground">{verses.length} versículos</span>
            <button
              onClick={nextChapter}
              disabled={isLast}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chapter < book.chapters
                ? `Capítulo ${chapter + 1}`
                : bookIndex < BOOKS.length - 1 ? BOOKS[bookIndex + 1].name : ''}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
