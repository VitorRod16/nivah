import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Mail, Send, Calendar, Clock, MapPin } from 'lucide-react';

// Mock invitations data
const mockInvitations = [
  {
    id: 1,
    title: 'Culto de Celebração - Aniversário da Igreja',
    recipient: 'Igreja Evangélica Comunidade',
    date: '2026-04-20',
    time: '19:00',
    location: 'Av. Principal, 1000 - Centro',
    status: 'enviado',
    message: 'Convidamos toda a liderança e membros para celebrar conosco os 11 anos de nossa igreja.',
    sentDate: '2026-03-05'
  },
  {
    id: 2,
    title: 'Conferência de Avivamento',
    recipient: 'Ministério Vida Nova',
    date: '2026-05-15',
    time: '18:00',
    location: 'Av. Principal, 1000 - Centro',
    status: 'rascunho',
    message: 'Será um prazer tê-los conosco em nossa conferência anual de avivamento.',
    sentDate: null
  },
  {
    id: 3,
    title: 'Vigília de Oração',
    recipient: 'Igreja Batista Central',
    date: '2026-03-30',
    time: '20:00',
    location: 'Av. Principal, 1000 - Centro',
    status: 'enviado',
    message: 'Convidamos para nossa vigília mensal de oração e intercessão.',
    sentDate: '2026-03-08'
  },
];

export function Invitations() {
  const [invitations] = useState(mockInvitations);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Cartas Convite</h1>
          <p className="text-muted-foreground">Envie convites para outros ministérios e igrejas</p>
        </div>
        
        <Dialog>
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
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="invite-title">Título do Evento</Label>
                <Input id="invite-title" placeholder="Ex: Conferência de Avivamento" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-recipient">Destinatário (Igreja/Ministério)</Label>
                <Input id="invite-recipient" placeholder="Nome da igreja ou ministério" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-date">Data do Evento</Label>
                  <Input id="invite-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-time">Horário</Label>
                  <Input id="invite-time" type="time" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-location">Local</Label>
                <Input id="invite-location" placeholder="Endereço do evento" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-message">Mensagem do Convite</Label>
                <Textarea 
                  id="invite-message" 
                  placeholder="Escreva a mensagem do convite..."
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail do Destinatário</Label>
                <Input id="invite-email" type="email" placeholder="contato@igreja.com" />
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Convite
                </Button>
                <Button variant="outline" className="flex-1">
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
          <p className="text-2xl mt-1">3</p>
        </Card>
      </div>

      {/* Invitations List */}
      <div className="grid gap-4">
        {invitations.map((invitation) => (
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
                  <p className="text-sm text-muted-foreground">
                    Destinatário: {invitation.recipient}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  {invitation.status === 'rascunho' && (
                    <Button size="sm">
                      <Send className="w-4 h-4 mr-1" />
                      Enviar
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm">{invitation.message}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(invitation.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{invitation.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{invitation.location}</span>
                </div>
              </div>

              {invitation.sentDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Mail className="w-3 h-3" />
                  <span>Enviado em {new Date(invitation.sentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Template Info */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3>Sobre as Cartas Convite</h3>
            <p className="text-sm text-muted-foreground">
              Use esta ferramenta para criar e enviar convites formais para outras igrejas e ministérios. 
              Você pode personalizar cada convite com os detalhes do evento, mensagem especial e 
              informações de contato. Os convites podem ser salvos como rascunho e enviados posteriormente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
