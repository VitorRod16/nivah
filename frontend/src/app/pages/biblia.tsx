import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, Copy, Check, Loader2, Bookmark, X, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

type Verse = {
  verse: number;
  text: string;
};

type BollsVerse = { pk: number; verse: number; text: string };

type Book = {
  name: string;
  chapters: number;
  testament: 'AT' | 'NT';
};

type HighlightColor = {
  id: string;
  label: string;
  bg: string;      // rgba para fundo do versículo
  swatch: string;  // hex para o swatch e ícone
};

const HIGHLIGHT_COLORS: HighlightColor[] = [
  { id: 'yellow', label: 'Amarelo', bg: 'rgba(253, 224, 71, 0.35)',  swatch: '#FBBF24' },
  { id: 'green',  label: 'Verde',   bg: 'rgba(134, 239, 172, 0.35)', swatch: '#34D399' },
  { id: 'blue',   label: 'Azul',    bg: 'rgba(147, 197, 253, 0.35)', swatch: '#60A5FA' },
  { id: 'rose',   label: 'Rosa',    bg: 'rgba(253, 164, 175, 0.35)', swatch: '#FB7185' },
  { id: 'purple', label: 'Roxo',    bg: 'rgba(196, 181, 253, 0.35)', swatch: '#A78BFA' },
];

type Highlight = {
  id: string;       // local key: `${translation}-${bookIndex}-${chapter}-${verse}`
  serverId?: string; // UUID retornado pelo backend
  translation: string;
  bookIndex: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  color: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';
const HIGHLIGHTS_KEY = 'bible_highlights';

function loadHighlights(): Highlight[] {
  try { return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) ?? '[]'); }
  catch { return []; }
}

function saveHighlights(highlights: Highlight[]) {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

const BOOKS: Book[] = [
  // Antigo Testamento
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
  // Novo Testamento
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

const TRANSLATIONS = [
  { id: 'ARC',  label: 'ARC — Almeida Revista e Corrigida'         },
  { id: 'NVI',  label: 'NVI — Nova Versão Internacional'            },
  { id: 'ACF',  label: 'ACF — Almeida Corrigida Fiel'              },
  { id: 'AA',   label: 'AA — Almeida Antiga'                        },
  { id: 'KJA',  label: 'KJA — King James Atualizada'               },
  { id: 'ARA',  label: 'ARA — Almeida Revista e Atualizada'        },
  { id: 'NTLH', label: 'NTLH — Nova Tradução na Linguagem de Hoje' },
  { id: 'NAA',  label: 'NAA — Nova Almeida Atualizada'             },
];

export function Biblia() {
  const [bookIndex, setBookIndex] = useState(39); // João
  const [chapter, setChapter] = useState(3);
  const [translation, setTranslation] = useState('ARC');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [searchRef, setSearchRef] = useState('');
  const [showBooks, setShowBooks] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>(loadHighlights);
  const [showHighlights, setShowHighlights] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const topRef = useRef<HTMLDivElement>(null);

  // Sincroniza destaques do backend na montagem
  useEffect(() => {
    if (!isLoggedIn()) return;
    fetch(`${API_BASE_URL}/bible/highlights`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<Highlight & { id: string }>) => {
        const remote: Highlight[] = data.map(h => ({
          ...h,
          id: `${h.translation}-${h.bookIndex}-${h.chapter}-${h.verse}`,
          serverId: h.id,
        }));
        setHighlights(remote);
        saveHighlights(remote);
      })
      .catch(() => {});
  }, []);

  const book = BOOKS[bookIndex];

  const fetchChapter = async (bi: number, ch: number) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    try {
      const bookNumber = bi + 1;
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/bible/${translation}/${bookNumber}/${ch}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!res.ok) throw new Error('Capítulo não encontrado.');
      const data: BollsVerse[] = await res.json();
      const parsed = data
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
    setShowHighlights(false);
    setSelectedVerses(new Set());
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

    // Suporta: "João 3", "João 3:16", "João 3 16"
    const match = input.match(/^(.+?)\s+(\d+)(?:[:\s](\d+))?$/);
    if (!match) {
      toast.error('Use: "João 3", "João 3:16" ou "João 3 16"');
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
    const text = `"${v.text}" — ${book.name} ${chapter}:${v.verse} (${translation.toUpperCase()})`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVerse(v.verse);
      setTimeout(() => setCopiedVerse(null), 2000);
    });
  };

  const highlightId = (v: Verse) => `${translation}-${bookIndex}-${chapter}-${v.verse}`;

  const getHighlight = (v: Verse) => highlights.find(h => h.id === highlightId(v));

  const markVerse = async (v: Verse, colorId: string) => {
    const id = highlightId(v);
    const existing = getHighlight(v);

    // Remove versão antiga no backend se existir
    if (existing?.serverId && isLoggedIn()) {
      fetch(`${API_BASE_URL}/bible/highlights/${existing.serverId}`, {
        method: 'DELETE', headers: authHeaders(),
      }).catch(() => {});
    }

    const newHighlight: Highlight = {
      id, translation, bookIndex, bookName: book.name,
      chapter, verse: v.verse, text: v.text, color: colorId,
    };

    // Salva no backend
    if (isLoggedIn()) {
      fetch(`${API_BASE_URL}/bible/highlights`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ translation, bookIndex, bookName: book.name, chapter, verse: v.verse, text: v.text, color: colorId }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.id) {
            setHighlights(prev => {
              const next = prev.map(h => h.id === id ? { ...h, serverId: data.id } : h);
              saveHighlights(next);
              return next;
            });
          }
        })
        .catch(() => {});
    }

    setHighlights(prev => {
      const next = [...prev.filter(h => h.id !== id), newHighlight];
      saveHighlights(next);
      return next;
    });
  };

  const removeHighlight = (id: string) => {
    const hl = highlights.find(h => h.id === id);
    if (hl?.serverId && isLoggedIn()) {
      fetch(`${API_BASE_URL}/bible/highlights/${hl.serverId}`, {
        method: 'DELETE', headers: authHeaders(),
      }).catch(() => {});
    }
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHighlights(next);
      return next;
    });
  };

  const clearAllHighlights = () => {
    setHighlights([]);
    saveHighlights([]);
    toast.success('Marcações removidas.');
  };

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      next.has(verseNum) ? next.delete(verseNum) : next.add(verseNum);
      return next;
    });
  };

  const applyColorToSelected = (colorId: string) => {
    verses
      .filter(v => selectedVerses.has(v.verse))
      .forEach(v => markVerse(v, colorId));
    setSelectedVerses(new Set());
  };

  const removeSelectedHighlights = () => {
    selectedVerses.forEach(verseNum => {
      const id = `${translation}-${bookIndex}-${chapter}-${verseNum}`;
      removeHighlight(id);
    });
    setSelectedVerses(new Set());
  };

  const allSelectedHighlighted = selectedVerses.size > 0 &&
    [...selectedVerses].every(vn => highlights.some(h => h.id === `${translation}-${bookIndex}-${chapter}-${vn}`));

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
          <div className="flex items-center gap-2 flex-1 sm:w-64 px-3 py-2 rounded-md border border-border bg-input focus-within:ring-2 focus-within:ring-ring">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchRef}
              onChange={e => setSearchRef(e.target.value)}
              placeholder="João 3 · João 3:16 · João 1 3"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
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
          onClick={() => { setShowBooks(v => !v); setShowHighlights(false); }}
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

        {/* Highlights button */}
        <button
          onClick={() => { setShowHighlights(v => !v); setShowBooks(false); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
            showHighlights
              ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
              : 'border-border bg-card text-foreground hover:bg-accent'
          }`}
          title="Versículos marcados"
        >
          <Bookmark className="w-4 h-4" />
          {highlights.length > 0 && (
            <span className="text-xs font-semibold">{highlights.length}</span>
          )}
        </button>

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
                    key={b.name}
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
                    key={b.name}
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

      {/* Highlights panel */}
      {showHighlights && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Versículos marcados
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-500">
                ({highlights.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {highlights.length > 0 && (
                <button
                  onClick={clearAllHighlights}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
                  title="Remover todas as marcações"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar tudo
                </button>
              )}
              <button
                onClick={() => setShowHighlights(false)}
                className="p-1 rounded text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {highlights.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-amber-700/60 dark:text-amber-500/60">
              Nenhum versículo marcado ainda. Toque em um versículo para selecioná-lo e escolha uma cor.
            </div>
          ) : (
            <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60 max-h-96 overflow-y-auto">
              {highlights.map(h => {
                const hlColor = HIGHLIGHT_COLORS.find(c => c.id === h.color) ?? HIGHLIGHT_COLORS[0];
                return (
                  <div
                    key={h.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
                    style={{ borderLeft: `3px solid ${hlColor.swatch}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => goTo(h.bookIndex, h.chapter)}
                        className="text-xs font-semibold hover:underline mb-1 block"
                        style={{ color: hlColor.swatch }}
                      >
                        {h.bookName} {h.chapter}:{h.verse} · {h.translation.toUpperCase()}
                      </button>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">{h.text}</p>
                    </div>
                    <button
                      onClick={() => removeHighlight(h.id)}
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-colors mt-0.5"
                      title="Remover marcação"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
              {verses.map(v => {
                const hl = getHighlight(v);
                const hlColor = hl ? HIGHLIGHT_COLORS.find(c => c.id === hl.color) ?? HIGHLIGHT_COLORS[0] : null;
                const selected = selectedVerses.has(v.verse);
                return (
                  <div
                    key={v.verse}
                    className={`rounded-lg transition-colors overflow-hidden ${
                      selected ? 'ring-2 ring-primary/40' : ''
                    }`}
                    style={!selected && hlColor ? { backgroundColor: hlColor.bg } : undefined}
                  >
                    {/* Linha do versículo */}
                    <div
                      onClick={() => toggleVerseSelection(v.verse)}
                      className={`group flex items-start gap-3 py-2.5 px-3 cursor-pointer select-none transition-colors ${
                        selected ? 'bg-primary/5' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="w-6 shrink-0 flex justify-end mt-0.5">
                        {selected ? (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-primary/60">{v.verse}</span>
                        )}
                      </div>
                      <p className="text-foreground leading-relaxed flex-1 text-[15px]">{v.text}</p>
                      {hl && !selected && (
                        <Bookmark className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ fill: hlColor!.swatch, color: hlColor!.swatch }} />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); copyVerse(v); }}
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-0.5"
                        title="Copiar versículo"
                      >
                        {copiedVerse === v.verse ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Barra de cores inline — aparece quando o versículo está selecionado */}
                    {selected && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-t border-primary/10">
                        <span className="text-xs text-muted-foreground mr-1">Marcar:</span>
                        {HIGHLIGHT_COLORS.map(c => (
                          <button
                            key={c.id}
                            onClick={e => { e.stopPropagation(); applyColorToSelected(c.id); }}
                            title={c.label}
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 focus:outline-none"
                            style={{
                              backgroundColor: c.swatch,
                              borderColor: hl?.color === c.id ? 'rgba(0,0,0,0.4)' : 'transparent',
                            }}
                          />
                        ))}
                        {hl && (
                          <button
                            onClick={e => { e.stopPropagation(); removeHighlight(hl.id); setSelectedVerses(new Set()); }}
                            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleVerseSelection(v.verse); }}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors ml-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
      {/* Barra flutuante de multi-seleção */}
      {selectedVerses.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-popover border border-border shadow-2xl">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>{selectedVerses.size} {selectedVerses.size === 1 ? 'versículo' : 'versículos'}</span>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Swatches de cor */}
          <div className="flex items-center gap-1.5">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => applyColorToSelected(c.id)}
                title={`Marcar com ${c.label}`}
                className="w-6 h-6 rounded-full border-2 border-transparent transition-transform hover:scale-125 focus:outline-none hover:border-foreground/30"
                style={{ backgroundColor: c.swatch }}
              />
            ))}
          </div>

          {/* Remover (só aparece se todos os selecionados já estão marcados) */}
          {allSelectedHighlighted && (
            <>
              <div className="w-px h-5 bg-border" />
              <button
                onClick={removeSelectedHighlights}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                title="Remover marcação"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            </>
          )}

          <div className="w-px h-5 bg-border" />

          <button
            onClick={() => setSelectedVerses(new Set())}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Cancelar seleção"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
