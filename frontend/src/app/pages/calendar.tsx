import { useState, useMemo } from "react";
import { useMockData } from "../context/MockDataContext";
import { Card } from "../components/ui/card";
import { Calendar as CalendarIcon, Plus, Clock, Info, Check, Church, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Calendar as BigCalendar, dateFnsLocalizer, Views, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom Year View Component
function YearView({ date, events, onSelectEvent }: any) {
  const currentYear = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
      {months.map(month => {
        const monthEvents = events.filter((e: any) => isSameMonth(e.start, month) && isSameYear(e.start, date));
        // Sort events by date
        monthEvents.sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

        return (
          <Card key={month.getMonth()} className="p-4 flex flex-col min-h-[150px]">
            <h3 className="font-bold mb-3 capitalize text-primary border-b pb-2">
              {format(month, 'MMMM', { locale: ptBR })}
            </h3>
            <div className="space-y-2 text-sm flex-grow">
              {monthEvents.slice(0, 4).map((e: any) => (
                 <div 
                   key={e.id} 
                   className="truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-2" 
                   onClick={() => onSelectEvent(e)}
                   title={e.title}
                 >
                   <span className="font-semibold text-muted-foreground w-6 text-center shrink-0">
                     {format(e.start, 'dd')}
                   </span>
                   <span className="truncate">{e.title}</span>
                 </div>
              ))}
              {monthEvents.length > 4 && (
                <div className="text-muted-foreground text-xs pt-1 border-t border-dashed mt-2">
                  + {monthEvents.length - 4} evento(s)
                </div>
              )}
              {monthEvents.length === 0 && (
                <div className="text-muted-foreground text-xs italic opacity-50">
                  Sem eventos
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

YearView.title = (date: Date) => {
  return date.getFullYear().toString();
};
YearView.navigate = (date: Date, action: string) => {
  switch (action) {
    case 'PREV': return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case 'NEXT': return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    default: return date;
  }
};

export function Calendar() {
  const { events, addEvent, updateEvent, ministries } = useMockData();
  const [isAdding, setIsAdding] = useState(false);
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(""); // Representa apenas o dia
  const [startTime, setStartTime] = useState(""); // Representa o horário de início
  const [endTime, setEndTime] = useState(""); // Representa o horário de fim
  const [description, setDescription] = useState("");
  const [allMinistries, setAllMinistries] = useState(true);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Deseja cancelar o evento "${eventTitle}"?`)) return;
    await updateEvent(eventId, { cancelled: true });
    toast.warning(`Evento "${eventTitle}" foi cancelado.`);
    setSelectedEvent(null);
  };

  const toggleMinistry = (id: string) => {
    setSelectedMinistries(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !startTime || !endTime) return;
    if (!allMinistries && selectedMinistries.length === 0) return;
    
    // Construct ISO datetime strings
    const startDateTime = `${eventDate}T${startTime}:00`;
    const endDateTime = `${eventDate}T${endTime}:00`;

    addEvent({ 
      title, 
      date: startDateTime,
      endDate: endDateTime,
      description, 
      allMinistries, 
      ministryIds: allMinistries ? [] : selectedMinistries 
    });
    
    setTitle("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setAllMinistries(true);
    setSelectedMinistries([]);
    setIsAdding(false);
  };

  // Convert MockData events to react-big-calendar events (exclude cancelled)
  const calendarEvents = useMemo(() => {
    return events
      .filter(e => !e.cancelled)
      .map(e => {
        const start = new Date(e.date);
        const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return {
          id: e.id,
          title: e.title,
          start,
          end,
          resource: e
        };
      });
  }, [events]);

  const messages = {
    allDay: 'Dia todo',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Lista',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total: number) => `+ ${total} mais`,
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Visão geral da agenda da igreja.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setSelectedEvent(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Evento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Evento *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Culto de Jovens"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data do Evento *</label>
                <input
                  required
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 space-y-0">
                <div className="space-y-2">
                   <label className="text-sm font-medium">Início *</label>
                   <input
                     required
                     type="time"
                     value={startTime}
                     onChange={(e) => setStartTime(e.target.value)}
                     className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium">Término *</label>
                   <input
                     required
                     type="time"
                     value={endTime}
                     onChange={(e) => setEndTime(e.target.value)}
                     className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                   />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex w-fit items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors bg-background hover:bg-accent">
                <input
                  type="checkbox"
                  checked={allMinistries}
                  onChange={(e) => {
                    setAllMinistries(e.target.checked);
                    if (e.target.checked) setSelectedMinistries([]);
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 flex items-center justify-center border rounded ${
                  allMinistries ? 'bg-primary border-primary' : 'border-input'
                }`}>
                  {allMinistries && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-sm font-medium">Envolve todos os ministérios</span>
              </label>

              {!allMinistries && (
                <div className="space-y-3 pt-2 pl-4 border-l-2 border-primary/20">
                  <label className="text-sm font-medium">Selecione os ministérios envolvidos *</label>
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
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Detalhes adicionais sobre o evento..."
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
                disabled={!title || !eventDate || !startTime || !endTime || (!allMinistries && selectedMinistries.length === 0)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Salvar Evento
              </button>
            </div>
          </form>
        </Card>
      )}

      {selectedEvent && !isAdding && (
        <Card className="p-6 shrink-0 relative overflow-hidden">
          <button 
            onClick={() => setSelectedEvent(null)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            &times; Fechar
          </button>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg min-w-[90px]">
              <span className="text-sm text-primary font-medium uppercase">{format(selectedEvent.start, 'MMM', { locale: ptBR })}</span>
              <span className="text-3xl font-bold text-primary">{format(selectedEvent.start, 'dd')}</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                {selectedEvent.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(selectedEvent.start, 'HH:mm')} às {format(selectedEvent.end, 'HH:mm')}
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedEvent.start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Church className="w-4 h-4" />
                  {selectedEvent.resource.allMinistries 
                    ? "Todos os Ministérios" 
                    : selectedEvent.resource.ministryIds?.map((id: string) => ministries.find(m => m.id === id)?.name).filter(Boolean).join(", ")}
                </div>
              </div>
              {selectedEvent.resource.description && (
                <div className="mt-4 pt-2 flex items-start gap-2 text-muted-foreground bg-accent/50 p-3 rounded-md">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{selectedEvent.resource.description}</p>
                </div>
              )}
              <div className="mt-4 pt-2">
                <button
                  onClick={() => handleCancelEvent(selectedEvent.resource.id, selectedEvent.title)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Evento
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="flex-grow p-4 flex flex-col min-h-[500px]">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-toolbar button { border-radius: 6px; padding: 6px 12px; color: var(--foreground); }
          .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: var(--primary); color: var(--primary-foreground); border-color: var(--primary); box-shadow: none; }
          .rbc-toolbar button:focus { outline: none; }
          .rbc-event { background-color: var(--primary); border-radius: 4px; padding: 2px 6px; }
          .rbc-today { background-color: hsl(var(--primary) / 0.05); }
          .rbc-off-range-bg { background-color: hsl(var(--muted) / 0.3); }
          .rbc-header { padding: 8px 0; font-weight: 600; text-transform: capitalize; border-bottom: 1px solid var(--border) !important; }
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: var(--border); border-radius: 8px; overflow: hidden; }
          .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: var(--border); }
          .rbc-time-header.rbc-overflowing { border-right: none; }
          .rbc-time-content { border-top: 1px solid var(--border); }
          .rbc-timeslot-group { border-bottom: 1px solid var(--border); }
          .rbc-day-slot .rbc-time-slot { border-top: 1px dashed var(--border); opacity: 0.5; }
          
          @media (max-width: 768px) {
            .rbc-toolbar { flex-direction: column; gap: 12px; margin-bottom: 16px; }
            .rbc-toolbar-label { text-align: center; margin-top: 8px; margin-bottom: 8px; font-size: 1.1rem; }
            .rbc-btn-group { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
            .rbc-btn-group button { flex: 1; min-width: max-content; }
          }
        `}</style>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ flex: 1 }}
          views={{
            year: YearView,
            month: true,
            week: true,
            day: true,
            agenda: true,
          } as any}
          messages={{
            ...messages,
            year: 'Ano',
          } as any}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setIsAdding(false);
          }}
          culture="pt-BR"
          popup
          selectable
        />
      </Card>
    </div>
  );
}