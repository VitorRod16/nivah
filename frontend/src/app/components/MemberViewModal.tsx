import { Mail, Phone, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MembroIgreja } from '../context/MockDataContext';

interface MemberViewModalProps {
  member: MembroIgreja | null;
  onClose: () => void;
}

export function MemberViewModal({ member, onClose }: MemberViewModalProps) {
  if (!member) return null;

  const initials = member.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Dialog open={!!member} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Perfil do membro</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Avatar */}
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.nome}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold select-none">
              {initials}
            </div>
          )}

          {/* Nome */}
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{member.nome}</p>
            {member.igrejaName && (
              <p className="text-xs text-muted-foreground mt-0.5">{member.igrejaName}</p>
            )}
          </div>

          {/* Status */}
          {member.status && (
            <div className="w-full flex items-start gap-2 px-4 py-3 rounded-lg bg-muted/40 border border-border">
              <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-foreground italic">{member.status}</p>
            </div>
          )}

          {/* Info */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Funções */}
          {(member.role || member.papeis.length > 0) && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground font-medium mb-2">Funções</p>
              <div className="flex flex-wrap gap-1.5">
                {member.role && (
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.role === 'MEMBRO'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {member.role === 'ADMIN' ? 'Administrador' : member.role === 'PASTOR' ? 'Pastor' : 'Membro'}
                  </span>
                )}
                {member.papeis.map(p => (
                  <span
                    key={p.id}
                    className="inline-flex px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {p.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
