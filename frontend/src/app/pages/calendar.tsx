import { useState, useMemo } from "react";
import { useMockData } from "../context/MockDataContext";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import { useActiveChurch } from "../context/ChurchContext";
import { Card } from "../components/ui/card";
import {
  Calendar as CalendarIcon, Plus, Clock, Info, Check, Church, XCircle,
  Users, UserCheck, UserX, ChevronDown, ChevronUp, Tent,
} from "lucide-react";
import { toast } from "sonner";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameMonth, isSameYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function YearView({ date, events, onSelectEvent }: any) {
  const currentYear = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
      {months.map(month => {
        const monthEvents = events
          .filter((e: any) => isSameMonth(e.start, month) && isSameYear(e.start, date))
          .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
        return (
          <Card key={month.getMonth()} className="p-4 flex flex-col min-h-[150px]">
            <h3 className="font-bold mb-3 capitalize text-primary border-b pb-2">
              {format(month, 'MMMM', { locale: ptBR })}
            </h3>
            <div className="space-y-2 text-sm flex-grow">
              {monthEvents.slice(0, 4).map((e: any) => (
                <div key={e.id} className="truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                  onClick={() => onSelectEvent(e)} title={e.title}>
                  <span className="font-semibold text-muted-foreground w-6 text-center shrink-0">{format(e.start, 'dd')}</span>
                  <span className="truncate">{e.title}</span>
                </div>
              ))}
              {monthEvents.length > 4 && (
                <div className="text-muted-foreground text-xs pt-1 border-t border-dashed mt-2">
                  + {monthEvents.length - 4} evento(s)
                </div>
              )}
              {monthEvents.length === 0 && (
                <div className="text-muted-foreground text-xs italic opacity-50">Sem eventos</div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
YearView.title = (date: Date) => date.getFullYear().toString();
YearView.navigate = (date: Date, action: string) => {
  switch (action) {
    case 'PREV': return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case 'NEXT': return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    default: return date;
  }
};

const CHURCH_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const GLOBAL_COLOR = '#6366f1';

export function Calendar() {
  const { events, addEvent, updateEvent, inscreverEvento, desinscreverEvento, ministries, igrejas } = useMockData();
  const { user } = useAuth();
  const { canManage } = useRole();
  const { activeIgreja } = useActiveChurch();

  const [isAdding, setIsAdding] = useState(false);
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showInscritos, setShowInscritos] = useState(false);
  const [inscritosList, setInscritosList] = useState<any[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);
  const [inscricaoLoading, setInscricaoLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [allMinistries, setAllMinistries] = useState(true);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [allowInscriptions, setAllowInscriptions] = useState(false);
  const [maxInscriptions, setMaxInscriptions] = useState("");
  const [tipoEvento, setTipoEvento] = useState<"NORMAL" | "ACAMPAMENTO">("NORMAL");
  const [vagasMasculino, setVagasMasculino] = useState("");
  const [vagasFeminino, setVagasFeminino] = useState("");
  const [quantidadeQuartos, setQuantidadeQuartos] = useState("");
  const [hiddenChurches, setHiddenChurches] = useState<Set<string>>(new Set());

  const churchColorMap = useMemo(() => {
    const map = new Map<string, string>();
    igrejas.forEach((ig, i) => map.set(ig.id, CHURCH_COLORS[i % CHURCH_COLORS.length]));
    return map;
  }, [igrejas]);

  const getEventColor = (igrejaId?: string) =>
    igrejaId ? (churchColorMap.get(igrejaId) ?? GLOBAL_COLOR) : GLOBAL_COLOR;

  const toggleChurch = (id: string) =>
    setHiddenChurches(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Camp inscription modal state
  const [showCampModal, setShowCampModal] = useState(false);
  const [campTipo, setCampTipo] = useState<"JOVEM" | "APOIO" | "APOIO_CASAL">("JOVEM");
  const [campSexo, setCampSexo] = useState<"MASCULINO" | "FEMININO">("MASCULINO");

  const resetForm = () => {
    setTitle(""); setStartDate(""); setStartTime(""); setEndDate(""); setEndTime("");
    setDescription(""); setAllMinistries(true); setSelectedMinistries([]);
    setAllowInscriptions(false); setMaxInscriptions("");
    setTipoEvento("NORMAL"); setVagasMasculino(""); setVagasFeminino(""); setQuantidadeQuartos("");
  };

  const toggleMinistry = (id: string) =>
    setSelectedMinistries(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !startTime) return;
    if (!allMinistries && selectedMinistries.length === 0) return;

    const startDateTime = `${startDate}T${startTime}:00`;
    let endDateTime: string | undefined = undefined;

    if (endDate || endTime) {
      const resolvedEndDate = endDate || startDate;
      const resolvedEndTime = endTime || startTime;
      endDateTime = `${resolvedEndDate}T${resolvedEndTime}:00`;
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        toast.error("A data/hora de término deve ser depois do início.");
        return;
      }
    }

    const isCamp = tipoEvento === "ACAMPAMENTO";
    await addEvent({
      title,
      date: startDateTime,
      endDate: endDateTime ?? undefined,
      description,
      allMinistries,
      ministryIds: allMinistries ? [] : selectedMinistries,
      allowInscriptions: isCamp ? true : allowInscriptions,
      maxInscriptions: !isCamp && allowInscriptions && maxInscriptions ? parseInt(maxInscriptions) : undefined,
      igrejaId: isCamp ? undefined : activeIgreja?.id,
      tipoEvento,
      vagasMasculino: isCamp && vagasMasculino ? parseInt(vagasMasculino) : undefined,
      vagasFeminino: isCamp && vagasFeminino ? parseInt(vagasFeminino) : undefined,
      quantidadeQuartos: isCamp && quantidadeQuartos ? parseInt(quantidadeQuartos) : undefined,
    });

    toast.success("Evento criado!");
    resetForm();
    setIsAdding(false);
  };

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Deseja cancelar o evento "${eventTitle}"?`)) return;
    await updateEvent(eventId, { cancelled: true });
    toast.warning(`Evento "${eventTitle}" foi cancelado.`);
    setSelectedEvent(null);
  };

  const handleInscrever = async (tipoParticipante?: string, sexo?: string) => {
    if (!selectedEvent) return;
    setInscricaoLoading(true);
    setShowCampModal(false);
    try {
      await inscreverEvento(selectedEvent.resource.id, tipoParticipante, sexo);
      toast.success("Inscrição confirmada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao se inscrever.");
    } finally {
      setInscricaoLoading(false);
    }
  };

  const handleInscreverClick = () => {
    if (liveSelected?.resource.tipoEvento === "ACAMPAMENTO") {
      setShowCampModal(true);
    } else {
      handleInscrever();
    }
  };

  const handleDesinscrever = async () => {
    if (!selectedEvent) return;
    setInscricaoLoading(true);
    try {
      await desinscreverEvento(selectedEvent.resource.id);
      toast.info("Inscrição cancelada.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar inscrição.");
    } finally {
      setInscricaoLoading(false);
    }
  };

  const handleVerInscritos = async () => {
    if (!selectedEvent) return;
    if (showInscritos) { setShowInscritos(false); return; }
    setLoadingInscritos(true);
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/api";
      const res = await fetch(`${BASE_URL}/events/${selectedEvent.resource.id}/inscricoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInscritosList(data);
      setShowInscritos(true);
    } catch {
      toast.error("Erro ao carregar inscritos.");
    } finally {
      setLoadingInscritos(false);
    }
  };

  const calendarEvents = useMemo(() => events
    .filter(e => !e.cancelled)
    .filter(e => !hiddenChurches.has(e.igrejaId ?? 'global'))
    .map(e => {
      const start = new Date(e.date);
      const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return { id: e.id, title: e.title, start, end, resource: e };
    }), [events, hiddenChurches]);

  // Sync selectedEvent with live events data
  const liveSelected = useMemo(() => {
    if (!selectedEvent) return null;
    const live = events.find(e => e.id === selectedEvent.resource.id);
    if (!live) return selectedEvent;
    return { ...selectedEvent, resource: live };
  }, [selectedEvent, events]);

  const messages = {
    allDay: 'Dia todo', previous: 'Anterior', next: 'Próximo', today: 'Hoje',
    month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Lista',
    date: 'Data', time: 'Hora', event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total: number) => `+ ${total} mais`,
  };

  const formatDateRange = (start: Date, end: Date) => {
    const days = differenceInDays(end, start);
    if (days === 0) {
      return format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return `${format(start, "d 'de' MMM", { locale: ptBR })} → ${format(end, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Visão geral da agenda da igreja.</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setIsAdding(!isAdding); setSelectedEvent(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Evento
          </button>
        )}
      </div>

      {/* Church color legend & filter */}
      {igrejas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium">Campos:</span>
          {igrejas.map(ig => {
            const color = churchColorMap.get(ig.id) ?? GLOBAL_COLOR;
            const hidden = hiddenChurches.has(ig.id);
            return (
              <button key={ig.id} onClick={() => toggleChurch(ig.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${hidden ? 'opacity-40' : ''}`}
                style={{ borderColor: color, color: hidden ? undefined : color, backgroundColor: hidden ? undefined : `${color}18` }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {ig.nome}
              </button>
            );
          })}
          {events.some(e => !e.igrejaId) && (() => {
            const hidden = hiddenChurches.has('global');
            return (
              <button onClick={() => toggleChurch('global')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${hidden ? 'opacity-40' : ''}`}
                style={{ borderColor: GLOBAL_COLOR, color: hidden ? undefined : GLOBAL_COLOR, backgroundColor: hidden ? undefined : `${GLOBAL_COLOR}18` }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GLOBAL_COLOR }} />
                Geral / Acampamento
              </button>
            );
          })()}
        </div>
      )}

      {/* Form */}
      {isAdding && (
        <Card className="p-6 border-primary/20 bg-primary/5 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold">Cadastrar Novo Evento</h2>

            {/* Tipo de Evento */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <button type="button" onClick={() => setTipoEvento("NORMAL")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tipoEvento === "NORMAL" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <CalendarIcon className="w-4 h-4" /> Evento Normal
              </button>
              <button type="button" onClick={() => setTipoEvento("ACAMPAMENTO")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tipoEvento === "ACAMPAMENTO" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Tent className="w-4 h-4" /> Acampamento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Título *</label>
                <input required type="text" maxLength={30} value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={tipoEvento === "ACAMPAMENTO" ? "Ex: Acampamento de Jovens 2025" : "Ex: Culto de Jovens"} />
                <p className="text-xs text-muted-foreground text-right">{title.length}/30</p>
              </div>

              {/* Início */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de início *</label>
                <input required type="date" value={startDate}
                  onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Horário de início *</label>
                <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Término */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de término <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
                <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Horário de término <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            {/* Ministérios */}
            <div className="space-y-3 pt-1">
              <label className="flex w-fit items-center gap-3 p-3 border rounded-md cursor-pointer bg-background hover:bg-accent transition-colors">
                <input type="checkbox" checked={allMinistries} className="sr-only"
                  onChange={e => { setAllMinistries(e.target.checked); if (e.target.checked) setSelectedMinistries([]); }} />
                <div className={`w-5 h-5 flex items-center justify-center border rounded ${allMinistries ? 'bg-primary border-primary' : 'border-input'}`}>
                  {allMinistries && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-sm font-medium">Envolve todos os ministérios</span>
              </label>
              {!allMinistries && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <label className="text-sm font-medium">Ministérios *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ministries.map(m => (
                      <label key={m.id} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${selectedMinistries.includes(m.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'}`}>
                        <input type="checkbox" checked={selectedMinistries.includes(m.id)} onChange={() => toggleMinistry(m.id)} className="sr-only" />
                        <div className={`w-5 h-5 flex items-center justify-center border rounded ${selectedMinistries.includes(m.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                          {selectedMinistries.includes(m.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Camp capacity fields */}
            {tipoEvento === "ACAMPAMENTO" && (
              <div className="space-y-3 pt-1 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Tent className="w-4 h-4" /> Vagas do Acampamento
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Inscrições são abertas automaticamente. O acampamento é visível para todas as igrejas.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Vagas Masculinas</label>
                    <input type="number" min="1" value={vagasMasculino} onChange={e => setVagasMasculino(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Sem limite" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Vagas Femininas</label>
                    <input type="number" min="1" value={vagasFeminino} onChange={e => setVagasFeminino(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Sem limite" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Quartos de Casal</label>
                    <input type="number" min="1" value={quantidadeQuartos} onChange={e => setQuantidadeQuartos(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Sem limite" />
                  </div>
                </div>
              </div>
            )}

            {/* Inscrições (only for normal events) */}
            {tipoEvento === "NORMAL" && (
            <div className="space-y-3 pt-1 border-t">
              <label className="flex w-fit items-center gap-3 p-3 border rounded-md cursor-pointer bg-background hover:bg-accent transition-colors">
                <input type="checkbox" checked={allowInscriptions} className="sr-only"
                  onChange={e => setAllowInscriptions(e.target.checked)} />
                <div className={`w-5 h-5 flex items-center justify-center border rounded ${allowInscriptions ? 'bg-primary border-primary' : 'border-input'}`}>
                  {allowInscriptions && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-sm font-medium">Permitir inscrições</span>
              </label>
              {allowInscriptions && (
                <div className="space-y-1 pl-4 border-l-2 border-primary/20">
                  <label className="text-sm font-medium">Limite de vagas <span className="text-muted-foreground">(opcional)</span></label>
                  <input type="number" min="1" value={maxInscriptions} onChange={e => setMaxInscriptions(e.target.value)}
                    className="w-40 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Sem limite" />
                </div>
              )}
            </div>
            )}

            <div className="space-y-1 pt-1">
              <label className="text-sm font-medium">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Detalhes adicionais sobre o evento..." />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setIsAdding(false); resetForm(); }}
                className="px-4 py-2 border rounded-md hover:bg-accent transition-colors text-sm">
                Cancelar
              </button>
              <button type="submit"
                disabled={!title || !startDate || !startTime || !endDate || !endTime || (!allMinistries && selectedMinistries.length === 0)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm">
                Salvar Evento
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Event detail */}
      {liveSelected && !isAdding && (
        <Card className="p-6 shrink-0 relative">
          <button onClick={() => { setSelectedEvent(null); setShowInscritos(false); }}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm">
            &times; Fechar
          </button>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg min-w-[90px] text-center">
              <span className="text-sm text-primary font-medium uppercase">{format(liveSelected.start, 'MMM', { locale: ptBR })}</span>
              <span className="text-3xl font-bold text-primary">{format(liveSelected.start, 'dd')}</span>
              {differenceInDays(liveSelected.end, liveSelected.start) > 0 && (
                <span className="text-xs text-primary/70 mt-1">
                  {differenceInDays(liveSelected.end, liveSelected.start) + 1} dias
                </span>
              )}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-semibold">{liveSelected.title}</h3>
                {liveSelected.resource.tipoEvento === "ACAMPAMENTO" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    <Tent className="w-3 h-3" /> Acampamento
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(liveSelected.start, 'HH:mm')} – {format(liveSelected.end, 'HH:mm')}
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDateRange(liveSelected.start, liveSelected.end)}
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Church className="w-4 h-4" />
                  {liveSelected.resource.allMinistries
                    ? "Todos os Ministérios"
                    : liveSelected.resource.ministryIds?.map((id: string) => ministries.find(m => m.id === id)?.name).filter(Boolean).join(", ")}
                </div>
              </div>

              {liveSelected.resource.description && (
                <div className="flex items-start gap-2 text-muted-foreground bg-accent/50 p-3 rounded-md">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{liveSelected.resource.description}</p>
                </div>
              )}

              {/* Inscrições */}
              {liveSelected.resource.allowInscriptions && (
                <div className="pt-2 space-y-3">
                  {/* Camp capacity bars */}
                  {liveSelected.resource.tipoEvento === "ACAMPAMENTO" && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Masculino", used: liveSelected.resource.inscricosMasculino ?? 0, total: liveSelected.resource.vagasMasculino },
                        { label: "Feminino", used: liveSelected.resource.inscricosFeminino ?? 0, total: liveSelected.resource.vagasFeminino },
                        { label: "Quartos Casal", used: liveSelected.resource.inscricosCasais ?? 0, total: liveSelected.resource.quantidadeQuartos },
                      ].map(({ label, used, total }) => (
                        <div key={label} className="text-center p-2 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          <p className="text-lg font-bold text-primary">{used}</p>
                          <p className="text-xs text-muted-foreground">/ {total ?? "∞"} vagas</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {liveSelected.resource.tipoEvento !== "ACAMPAMENTO" && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {liveSelected.resource.inscricoesCount ?? 0} inscritos
                          {liveSelected.resource.maxInscriptions
                            ? ` / ${liveSelected.resource.maxInscriptions} vagas`
                            : ''}
                        </span>
                      </div>
                    )}

                    {/* Botão de inscrição para membros */}
                    {user && (
                      liveSelected.resource.userInscrito ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {liveSelected.resource.tipoEvento === "ACAMPAMENTO" && liveSelected.resource.userTipoParticipante && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {liveSelected.resource.userTipoParticipante === "APOIO_CASAL" ? "Apoio Casal" :
                               liveSelected.resource.userTipoParticipante === "APOIO" ? `Apoio (${liveSelected.resource.userSexo === "MASCULINO" ? "M" : "F"})` :
                               `Jovem (${liveSelected.resource.userSexo === "MASCULINO" ? "M" : "F"})`}
                            </span>
                          )}
                          <button onClick={handleDesinscrever} disabled={inscricaoLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                            <UserX className="w-4 h-4" />
                            {inscricaoLoading ? 'Cancelando...' : 'Cancelar inscrição'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={handleInscreverClick} disabled={inscricaoLoading ||
                          (liveSelected.resource.tipoEvento !== "ACAMPAMENTO" &&
                           liveSelected.resource.maxInscriptions != null &&
                           (liveSelected.resource.inscricoesCount ?? 0) >= liveSelected.resource.maxInscriptions)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                          <UserCheck className="w-4 h-4" />
                          {inscricaoLoading ? 'Inscrevendo...' : 'Inscrever-se'}
                        </button>
                      )
                    )}

                    {/* Ver inscritos (pastor/admin) */}
                    {canManage && (
                      <button onClick={handleVerInscritos} disabled={loadingInscritos}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {showInscritos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {loadingInscritos ? 'Carregando...' : 'Ver lista'}
                      </button>
                    )}
                  </div>

                  {/* Lista de inscritos */}
                  {showInscritos && (
                    <div className="rounded-md border border-border divide-y divide-border">
                      {inscritosList.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3">Nenhum inscrito ainda.</p>
                      ) : inscritosList.map((i: any) => (
                        <div key={i.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {i.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{i.nome}</p>
                            <p className="text-xs text-muted-foreground">{i.email}</p>
                          </div>
                          {i.tipoParticipante && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full shrink-0">
                              {i.tipoParticipante === "APOIO_CASAL" ? "Casal" :
                               i.tipoParticipante === "APOIO" ? `Apoio ${i.sexo === "MASCULINO" ? "♂" : "♀"}` :
                               `Jovem ${i.sexo === "MASCULINO" ? "♂" : "♀"}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ações (admin/pastor) */}
              {canManage && (
                <div className="pt-2">
                  <button onClick={() => handleCancelEvent(liveSelected.resource.id, liveSelected.title)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancelar Evento
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card className="flex-grow p-4 flex flex-col min-h-[500px]">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-toolbar button { border-radius: 6px; padding: 6px 12px; color: var(--foreground); }
          .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: var(--primary); color: var(--primary-foreground); border-color: var(--primary); box-shadow: none; }
          .rbc-toolbar button:focus { outline: none; }
          .rbc-event { border-radius: 4px; padding: 2px 6px; border: none !important; }
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
          views={{ year: YearView, month: true, week: true, day: true, agenda: true } as any}
          messages={{ ...messages, year: 'Ano' } as any}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={event => { setSelectedEvent(event); setIsAdding(false); setShowInscritos(false); }}
          eventPropGetter={(event: any) => {
            const color = getEventColor(event.resource?.igrejaId);
            return { style: { backgroundColor: color, borderColor: color } };
          }}
          culture="pt-BR"
          popup
          selectable
        />
      </Card>
    </div>
  );
}
