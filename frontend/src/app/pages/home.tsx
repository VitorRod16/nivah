import { useState, useEffect } from 'react';
import { Calendar, Crown, BookOpen, Music, Users, Church, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import { useActiveChurch } from '../context/ChurchContext';
import { useNavigate } from 'react-router';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

const BOOK_NAMES = [
  'Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute',
  '1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias',
  'Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias',
  'Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miquéias',
  'Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias','Mateus','Marcos','Lucas',
  'João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses',
  'Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito',
  'Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse',
];

type PalavraDoDia = { translation: string; book: number; chapter: number; verse: number; text: string };

export function Home() {
  const { events, leaders, members, ministries, studies, songs, membrosIgreja } = useMockData();
  const { user } = useAuth();
  const { activeIgreja } = useActiveChurch();
  const navigate = useNavigate();

  const [palavraDoDia, setPalavraDoDia] = useState<PalavraDoDia | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/bible/palavra-do-dia`)
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setPalavraDoDia(data))
      .catch(() => {});
  }, []);

  const today = new Date();
  const upcomingEvents = events
    .filter(e => !e.cancelled && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentStudies = [...studies].reverse().slice(0, 3);
  const recentSongs = [...songs].reverse().slice(0, 4);

  const currentMember = members.find(m => m.email === user?.email);
  const currentLeader = currentMember ? leaders.find(l => l.memberId === currentMember.id) : null;
  const activePastores = activeIgreja?.pastores ?? [];
  const activeMembrosCount = membrosIgreja.filter(m => m.igrejaId === activeIgreja?.id).length;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao Nivah. Aqui está um resumo do sistema.</p>
      </div>

      {/* Palavra do dia */}
      {palavraDoDia && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          {/* Aspas decorativas */}
          <span className="absolute top-3 right-5 text-8xl font-serif leading-none text-primary/10 select-none pointer-events-none">
            "
          </span>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Palavra do dia
            </span>
          </div>

          <p className="text-foreground leading-relaxed text-base sm:text-lg font-medium relative z-10 max-w-2xl">
            {palavraDoDia.text}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-primary/20 max-w-[40px]" />
            <p className="text-sm font-semibold text-primary">
              {BOOK_NAMES[palavraDoDia.book - 1]} {palavraDoDia.chapter}:{palavraDoDia.verse}
            </p>
            <span className="text-xs text-muted-foreground">· {palavraDoDia.translation}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card onClick={() => navigate('/membros')} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Membros</p>
            <p className="text-2xl font-semibold">{activeIgreja ? activeMembrosCount : members.length}</p>
          </div>
        </Card>
        <Card onClick={() => navigate('/ministries')} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Church className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ministérios</p>
            <p className="text-2xl font-semibold">{ministries.length}</p>
          </div>
        </Card>
        <Card onClick={() => navigate('/studies')} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estudos</p>
            <p className="text-2xl font-semibold">{studies.length}</p>
          </div>
        </Card>
        <Card onClick={() => navigate('/worship')} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Louvores</p>
            <p className="text-2xl font-semibold">{songs.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Próximos Eventos</h2>
          </div>
          <div className="divide-y divide-border">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="px-6 py-3 hover:bg-secondary/50 transition-colors">
                <p className="font-medium text-sm text-foreground">{event.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.date + (event.date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR')}
                  </span>
                  {event.date.includes('T') && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.date.split('T')[1].slice(0, 5)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhum evento futuro cadastrado.
              </div>
            )}
          </div>
        </Card>

        {/* Current Leadership */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Liderança Atual</h2>
            </div>
            {activeIgreja && (
              <span className="text-xs text-muted-foreground">{activeIgreja.nome}</span>
            )}
          </div>
          <div className="divide-y divide-border">
            {activePastores.map((pastor) => (
              <div key={pastor.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 select-none">
                  {pastor.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{pastor.name}</p>
                  <p className="text-xs text-muted-foreground">Pastor responsável</p>
                </div>
              </div>
            ))}
            {activePastores.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhum pastor vinculado a esta igreja.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Studies */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Últimos Estudos</h2>
          </div>
          <div className="divide-y divide-border">
            {recentStudies.map((study) => (
              <div key={study.id} className="px-6 py-3">
                <p className="font-medium text-sm text-foreground">{study.title}</p>
                {study.author && (
                  <p className="text-xs text-muted-foreground mt-0.5">{study.author}</p>
                )}
              </div>
            ))}
            {studies.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhum estudo cadastrado.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Songs */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Repertório Recente</h2>
          </div>
          <div className="divide-y divide-border">
            {recentSongs.map((song) => (
              <div key={song.id} className="px-6 py-3">
                <p className="font-medium text-sm text-foreground">{song.title}</p>
                {song.artist && (
                  <p className="text-xs text-muted-foreground mt-0.5">{song.artist}</p>
                )}
              </div>
            ))}
            {songs.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhum louvor cadastrado.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* User card if leader */}
      {currentLeader && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{currentLeader.roles.join(', ')}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
