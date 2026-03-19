import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  roleLabel: string;
}

export function ProfileModal({ open, onClose, roleLabel }: ProfileModalProps) {
  const { user, updateUser, updatePhoto } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setEditing(false);
      setError('');
    }
  }, [open, user]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await updateUser({ name: name.trim(), email: email.trim() });
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setError(result.error ?? 'Erro ao salvar.');
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setEditing(false);
    setError('');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('A foto deve ter no máximo 2MB.');
      return;
    }
    setUploadingPhoto(true);
    setError('');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await updatePhoto(base64);
      setUploadingPhoto(false);
      if (!result.success) setError(result.error ?? 'Erro ao salvar foto.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Avatar com botão de foto */}
          <div className="relative group">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold select-none">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Trocar foto"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="text-xs text-muted-foreground -mt-2">Clique na foto para trocar (máx. 2MB)</p>

          {editing ? (
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Nome</label>
                <input
                  className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">E-mail</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Função</label>
                <p className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">{roleLabel}</p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground font-medium">Nome</span>
                  <span className="text-sm text-foreground font-medium">{user?.name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground font-medium">E-mail</span>
                  <span className="text-sm text-foreground">{user?.email}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground font-medium">Função</span>
                  <span className="text-sm text-foreground">{roleLabel}</span>
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-accent transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar perfil
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
