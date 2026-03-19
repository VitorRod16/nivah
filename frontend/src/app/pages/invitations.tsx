import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Mail, Send, Calendar, Clock, MapPin, Check, Church, Users, Trash2, Loader2 } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';
import type { Member } from '../context/MockDataContext';
import { toast } from 'sonner';

const BASE_URL = 'http://localhost:8080/api';

type ApiInvitation = {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  status: 'enviado' | 'rascunho';
  message: string | null;
  sentDate: string | null;
  allMinistries: boolean;
  ministryIds: string[];
  recipientCount: number;
};

type Invitation = ApiInvitation & { recipients: Member[] };

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function Invitations() {
  const { ministries, events, members } = useMockData();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [invTitle, setInvTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [allMinistries, setAllMinistries] = useState(true);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);

  const resolveRecipients = useCallback(
    (inv: ApiInvitation): Member[] => {
      if (inv.allMinistries) return members;
      return members.filter(m => inv.ministryIds.includes(m.ministryId ?? ''));
    },
    [members],
  );

  const toInvitation = useCallback(
    (api: ApiInvitation): Invitation => ({ ...api, recipients: resolveRecipients(api) }),
    [resolveRecipients],
  );

  // Load from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/invitations`, { headers: authHeaders() });
        if (res.ok) {
          const data: ApiInvitation[] = await res.json();
          setInvitations(data.map(toInvitation));
        }
      } catch {
        // backend offline — start empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toInvitation]);

  const resetForm = () => {
    setInvTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setMessage('');
    setAllMinistries(true);
    setSelectedMinistries([]);
  };

  const toggleMinistry = (id: string) => {
    setSelectedMinistries(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id],
    );
  };

  const handleSelectEvent = (eventId: string) => {
    if (!eventId) return;
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    setInvTitle(ev.title);
    setDate(ev.date.split('T')[0]);
    setTime(ev.date.includes('T') ? ev.date.split('T')[1].slice(0, 5) : '');
    setAllMinistries(ev.allMinistries);
    setSelectedMinistries(ev.allMinistries ? [] : ev.ministryIds);
  };

  const buildPayload = () => ({
    title: invTitle,
    date,
    time,
    location,
    message,
    allMinistries,
    ministryIds: allMinistries ? [] : selectedMinistries,
  });

  const validate = (): boolean => {
    if (!invTitle) { toast.error('Informe o título do evento.'); return false; }
    if (!allMinistries && selectedMinistries.length === 0) {
      toast.error('Selecione pelo menos um ministério.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${BASE_URL}/invitations/draft`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error();
      const saved: ApiInvitation = await res.json();
      setInvitations(prev => [toInvitation(saved), ...prev]);
      toast.success('Rascunho salvo com sucesso.');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Falha ao salvar rascunho.');
    }
  };

  const handleSend = async () => {
    if (isSending || !validate()) return;
    setIsSending(true);
    const toastId = toast.loading('Enviando convites...');
    try {
      const res = await fetch(`${BASE_URL}/invitations/send`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.');
      const saved: ApiInvitation = data.invitation;
      setInvitations(prev => [toInvitation(saved), ...prev]);
      toast.success(`Convite enviado para ${data.sent} membro(s)!`, { id: toastId });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Falha ao enviar convites.', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDraft = async (id: string) => {
    const toastId = toast.loading('Enviando convite...');
    try {
      const res = await fetch(`${BASE_URL}/invitations/${id}/send`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const updated: ApiInvitation = await res.json();
      setInvitations(prev => prev.map(i => i.id === id ? toInvitation(updated) : i));
      toast.success('Convite enviado com sucesso!', { id: toastId });
    } catch {
      toast.error('Falha ao enviar convite.', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/invitations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setInvitations(prev => prev.filter(i => i.id !== id));
      toast.success('Convite removido.');
    } catch {
      toast.error('Falha ao remover convite.');
    }
  };

  const getMinistryLabel = (inv: Invitation) => {
    if (inv.allMinistries) return 'Todos os Ministérios';
    return inv.ministryIds
      .map(id => ministries.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';
  };

  const previewRecipients = allMinistries
    ? members
    : members.filter(m => selectedMinistries.includes(m.ministryId ?? ''));

  const thisMonth = invitations.filter(
    i => i.sentDate && new Date(i.sentDate + 'T00:00:00').getMonth() === new Date().getMonth(),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Cartas Convite</h1>
          <p className="text-muted-foreground">Envie convites para outros ministérios e igrejas</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Nova Carta Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Carta Convite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">

              {events.filter(e => !e.cancelled).length > 0 && (
                <div className="space-y-2">
                  <Label>Importar de um Evento do Calendário</Label>
                  <select
                    onChange={(e) => handleSelectEvent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    defaultValue=""
                  >
                    <option value="">Selecionar evento (opcional)</option>
                    {events.filter(e => !e.cancelled).map(e => (
                      <option key={e.id} value={e.id}>
                        {e.title} — {new Date(e.date + (e.date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Ao selecionar um evento, o título, data e ministérios são preenchidos automaticamente.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-title">Título do Evento *</Label>
                <Input
                  id="invite-title"
                  value={invTitle}
                  onChange={e => setInvTitle(e.target.value)}
                  placeholder="Ex: Conferência de Avivamento"
                />
              </div>

              <div className="space-y-3">
                <Label>Ministérios Envolvidos</Label>
                <label className={`flex w-fit items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${allMinistries ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'}`}>
                  <input
                    type="checkbox"
                    checked={allMinistries}
                    onChange={(e) => {
                      setAllMinistries(e.target.checked);
                      if (e.target.checked) setSelectedMinistries([]);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 flex items-center justify-center border rounded ${allMinistries ? 'bg-primary border-primary' : 'border-input'}`}>
                    {allMinistries && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-medium">Envolve todos os ministérios</span>
                </label>

                {!allMinistries && (
                  <div className="space-y-3 pt-2 pl-4 border-l-2 border-primary/20">
                    <p className="text-sm font-medium">Selecione os ministérios envolvidos *</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ministries.map(ministry => (
                        <label
                          key={ministry.id}
                          className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedMinistries.includes(ministry.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent'
                          }`}
                        >
                          <input type="checkbox" checked={selectedMinistries.includes(ministry.id)} onChange={() => toggleMinistry(ministry.id)} className="sr-only" />
                          <div className={`w-5 h-5 flex items-center justify-center border rounded shrink-0 ${selectedMinistries.includes(ministry.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                            {selectedMinistries.includes(ministry.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="text-sm font-medium">{ministry.name}</span>
                        </label>
                      ))}
                    </div>
                    {ministries.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum ministério cadastrado.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-date">Data do Evento</Label>
                  <Input id="invite-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-time">Horário</Label>
                  <Input id="invite-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-location">Local</Label>
                <Input id="invite-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Endereço do evento" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-message">Mensagem do Convite</Label>
                <Textarea
                  id="invite-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva a mensagem do convite..."
                  rows={5}
                />
              </div>

              <div className="p-3 bg-muted/50 rounded-md space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  {previewRecipients.length === 0
                    ? 'Nenhum membro encontrado para os ministérios selecionados'
                    : `${previewRecipients.length} membro(s) receberão este convite`}
                </div>
                {previewRecipients.length > 0 && (
                  <p className="text-xs text-muted-foreground pl-6">
                    {previewRecipients.slice(0, 5).map(m => m.name).join(', ')}
                    {previewRecipients.length > 5 ? ` e mais ${previewRecipients.length - 5}...` : ''}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSend} disabled={isSending}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Enviando...' : 'Enviar Convite'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleSaveDraft}>
                  Salvar Rascunho
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Convites</p>
          <p className="text-2xl mt-1">{invitations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Enviados</p>
          <p className="text-2xl mt-1">{invitations.filter(i => i.status === 'enviado').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Rascunhos</p>
          <p className="text-2xl mt-1">{invitations.filter(i => i.status === 'rascunho').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Este Mês</p>
          <p className="text-2xl mt-1">{thisMonth}</p>
        </Card>
      </div>

      {/* Invitations List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : invitations.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-2 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto opacity-40" />
              <p>Nenhuma carta convite criada ainda.</p>
              <p className="text-sm">Clique em "Nova Carta Convite" para começar.</p>
            </div>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3>{invitation.title}</h3>
                      <Badge variant={invitation.status === 'enviado' ? 'default' : 'secondary'}>
                        {invitation.status === 'enviado' ? 'Enviado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Church className="w-3 h-3" />
                      {getMinistryLabel(invitation)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {invitation.status === 'enviado'
                        ? `${invitation.recipientCount} membro(s) receberam`
                        : `${invitation.recipients.length} membro(s) receberão`}
                      {invitation.recipients.length > 0 && invitation.status !== 'enviado' && (
                        <span className="ml-1">
                          — {invitation.recipients.slice(0, 3).map(m => m.name).join(', ')}
                          {invitation.recipients.length > 3 ? ` e mais ${invitation.recipients.length - 3}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {invitation.status === 'rascunho' && (
                      <Button size="sm" onClick={() => handleSendDraft(invitation.id)}>
                        <Send className="w-4 h-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(invitation.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {invitation.message && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{invitation.message}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {invitation.date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(invitation.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {invitation.time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{invitation.time}</span>
                    </div>
                  )}
                  {invitation.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{invitation.location}</span>
                    </div>
                  )}
                </div>

                {invitation.sentDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Mail className="w-3 h-3" />
                    <span>Enviado em {new Date(invitation.sentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3>Sobre as Cartas Convite</h3>
            <p className="text-sm text-muted-foreground">
              Crie convites para os membros dos ministérios envolvidos em um evento. Importe um evento
              do calendário para preencher automaticamente os dados e os ministérios. O convite é
              enviado para todos os membros vinculados aos ministérios selecionados.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
