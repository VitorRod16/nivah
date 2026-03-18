import { Calendar, Crown, BookOpen, Music, Users, Church, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { events, leaders, members, ministries, studies, songs } = useMockData();
  const { user } = useAuth();

  const today = new Date();
  const upcomingEvents = events
    .filter(e => !e.cancelled && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentStudies = [...studies].reverse().slice(0, 3);
  const recentSongs = [...songs].reverse().slice(0, 4);

  const currentMember = members.find(m => m.email === user?.email);
  const currentLeader = currentMember ? leaders.find(l => l.memberId === currentMember.id) : null;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao Nivah. Aqui está um resumo do sistema.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Membros</p>
            <p className="text-2xl font-semibold">{members.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Church className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ministérios</p>
            <p className="text-2xl font-semibold">{ministries.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estudos</p>
            <p className="text-2xl font-semibold">{studies.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
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
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Liderança Atual</h2>
          </div>
          <div className="divide-y divide-border">
            {leaders.slice(0, 5).map((leader) => {
              const member = members.find(m => m.id === leader.memberId);
              if (!member) return null;
              return (
                <div key={leader.id} className="px-6 py-3">
                  <p className="font-medium text-sm text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{leader.roles.join(', ')}</p>
                </div>
              );
            })}
            {leaders.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhuma liderança cadastrada.
              </div>
            )}
            {leaders.length > 5 && (
              <div className="px-6 py-3 text-xs text-muted-foreground text-center">
                + {leaders.length - 5} líderes
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
