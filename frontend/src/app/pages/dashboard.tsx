import { Users, Calendar, BookOpen, Music, Church, Clock } from "lucide-react";
import { useMockData } from "../context/MockDataContext";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { members, ministries, events, studies, songs } = useMockData();
  const { user } = useAuth();

  const todayTime = Date.now();
  const upcomingEvents = events
    .filter(e => new Date(e.date).getTime() >= todayTime)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const stats = [
    { title: "Membros", value: members.length, icon: Users, color: "bg-primary" },
    { title: "Ministérios", value: ministries.length, icon: Church, color: "bg-blue-500" },
    { title: "Estudos", value: studies.length, icon: BookOpen, color: "bg-green-500" },
    { title: "Louvores", value: songs.length, icon: Music, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao Nivah. Aqui está um resumo do sistema.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Próximos Eventos</h2>
        </div>
        <div className="divide-y divide-border">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="px-6 py-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{event.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                    {event.description && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{event.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">
              Nenhum evento futuro cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
