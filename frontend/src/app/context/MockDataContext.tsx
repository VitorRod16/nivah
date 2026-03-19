import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { toast } from "sonner";

export type Igreja = {
  id: string;
  nome: string;
  cidade?: string;
  descricao?: string;
  pastores: { id: string; name: string; email: string; role: string }[];
};

export type PapelInfo = {
  id: string;
  nome: string;
};

export type Papel = {
  id: string;
  nome: string;
  igrejaId: string;
};

export type MembroIgreja = {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  igrejaId: string;
  igrejaName: string;
  papeis: PapelInfo[];
};

export type Transacao = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  descricao?: string;
  categoria?: string;
  data: string;
  igrejaId: string;
  criadoPor?: string;
};

export type Ministry = {
  id: string;
  name: string;
  description: string;
  city: string;
  pastor?: string;
  igrejaId?: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ministryId?: string;
};

export type LeaderRole = string;

export type Leadership = {
  id: string;
  memberId: string;
  roles: LeaderRole[];
  ministryIds: string[];
};

export type EventType = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  description: string;
  allMinistries: boolean;
  ministryIds: string[];
  cancelled?: boolean;
};

export type Study = {
  id: string;
  title: string;
  author: string;
  content: string;
};

export type WorshipSong = {
  id: string;
  title: string;
  artist: string;
  link: string;
  lyrics?: string;
};

type MockDataContextType = {
  igrejas: Igreja[];
  addIgreja: (i: Omit<Igreja, "id" | "pastores">) => Promise<string>;
  updateIgreja: (id: string, updated: Partial<Omit<Igreja, "id" | "pastores">>) => Promise<void>;
  deleteIgreja: (id: string) => Promise<void>;
  membrosIgreja: MembroIgreja[];
  addMembroIgreja: (data: { name: string; email: string; igrejaId: string; phone?: string; password?: string }) => Promise<void>;
  removeMembroIgreja: (id: string) => Promise<void>;
  addPapelToMembro: (membroId: string, papelId: string) => Promise<void>;
  removePapelFromMembro: (membroId: string, papelId: string) => Promise<void>;
  ministries: Ministry[];
  addMinistry: (m: Omit<Ministry, "id">) => Promise<string>;
  updateMinistry: (id: string, updated: Partial<Omit<Ministry, "id">>) => Promise<void>;
  deleteMinistry: (id: string) => Promise<void>;
  members: Member[];
  addMember: (m: Omit<Member, "id">) => Promise<string>;
  updateMember: (id: string, updated: Partial<Omit<Member, "id">>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  leaders: Leadership[];
  addLeader: (l: Omit<Leadership, "id">) => Promise<void>;
  updateLeader: (id: string, updated: Partial<Omit<Leadership, "id">>) => Promise<void>;
  deleteLeader: (id: string) => Promise<void>;
  events: EventType[];
  addEvent: (e: Omit<EventType, "id">) => Promise<void>;
  updateEvent: (id: string, updated: Partial<Omit<EventType, "id">>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  studies: Study[];
  addStudy: (s: Omit<Study, "id">) => Promise<void>;
  updateStudy: (id: string, updated: Partial<Omit<Study, "id">>) => Promise<void>;
  deleteStudy: (id: string) => Promise<void>;
  songs: WorshipSong[];
  addSong: (s: Omit<WorshipSong, "id">) => Promise<void>;
  updateSong: (id: string, updated: Partial<Omit<WorshipSong, "id">>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  transacoes: Transacao[];
  addTransacao: (t: Omit<Transacao, "id" | "criadoPor">) => Promise<void>;
  updateTransacao: (id: string, updated: Partial<Omit<Transacao, "id" | "criadoPor">>) => Promise<void>;
  deleteTransacao: (id: string) => Promise<void>;
  papeis: Papel[];
  addPapelIgreja: (igrejaId: string, nome: string) => Promise<Papel>;
  deletePapelIgreja: (igrejaId: string, papelId: string) => Promise<void>;
  isLoading: boolean;
};

const MockDataContext = createContext<MockDataContextType | null>(null);

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [membrosIgreja, setMembrosIgreja] = useState<MembroIgreja[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaders, setLeaders] = useState<Leadership[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [ig, mb2, m, mb, l, e, st, sg, tr] = await Promise.all([
          apiFetch<Igreja[]>("/igrejas"),
          apiFetch<MembroIgreja[]>("/membros"),
          apiFetch<Ministry[]>("/ministries"),
          apiFetch<Member[]>("/members"),
          apiFetch<Leadership[]>("/leaders"),
          apiFetch<EventType[]>("/events"),
          apiFetch<Study[]>("/studies"),
          apiFetch<WorshipSong[]>("/songs"),
          apiFetch<Transacao[]>("/transacoes"),
        ]);
        setIgrejas(ig);
        setMembrosIgreja(mb2);
        setMinistries(m);
        setMembers(mb);
        setLeaders(l);
        setEvents(e);
        setStudies(st);
        setSongs(sg);
        setTransacoes(tr);
        // Fetch papeis for each church
        const papeisList = await Promise.all(
          ig.map((igreja: Igreja) =>
            apiFetch<{ id: string; nome: string }[]>(`/igrejas/${igreja.id}/papeis`)
              .then(p => p.map(papel => ({ ...papel, igrejaId: igreja.id })))
              .catch(() => [] as Papel[])
          )
        );
        setPapeis(papeisList.flat());
      } catch (err: any) {
        if (err.message !== "UNAUTHORIZED") {
          console.error("Error loading data:", err);
          toast.error("Erro ao carregar dados. Verifique sua conexão.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  const addIgreja = async (i: Omit<Igreja, "id" | "pastores">) => {
    const created = await apiFetch<Igreja>("/igrejas", { method: "POST", body: JSON.stringify(i) });
    setIgrejas(prev => [...prev, created]);
    return created.id;
  };

  const updateIgreja = async (id: string, updated: Partial<Omit<Igreja, "id" | "pastores">>) => {
    const result = await apiFetch<Igreja>(`/igrejas/${id}`, { method: "PUT", body: JSON.stringify(updated) });
    setIgrejas(prev => prev.map(ig => ig.id === id ? result : ig));
  };

  const deleteIgreja = async (id: string) => {
    await apiFetch(`/igrejas/${id}`, { method: "DELETE" });
    setIgrejas(prev => prev.filter(ig => ig.id !== id));
  };

  const addMembroIgreja = async (data: { name: string; email: string; igrejaId: string; phone?: string; password?: string }) => {
    const created = await apiFetch<MembroIgreja>("/membros", { method: "POST", body: JSON.stringify(data) });
    setMembrosIgreja(prev => [...prev, created]);
  };

  const removeMembroIgreja = async (id: string) => {
    await apiFetch(`/membros/${id}`, { method: "DELETE" });
    setMembrosIgreja(prev => prev.filter(m => m.id !== id));
  };

  const addPapelToMembro = async (membroId: string, papelId: string) => {
    const updated = await apiFetch<MembroIgreja>(`/membros/${membroId}/papeis/${papelId}`, { method: "POST" });
    setMembrosIgreja(prev => prev.map(m => m.id === membroId ? updated : m));
  };

  const removePapelFromMembro = async (membroId: string, papelId: string) => {
    const updated = await apiFetch<MembroIgreja>(`/membros/${membroId}/papeis/${papelId}`, { method: "DELETE" });
    setMembrosIgreja(prev => prev.map(m => m.id === membroId ? updated : m));
  };

  const addMinistry = async (m: Omit<Ministry, "id">) => {
    const created = await apiFetch<Ministry>("/ministries", { method: "POST", body: JSON.stringify(m) });
    setMinistries(prev => [...prev, created]);
    return created.id;
  };

  const updateMinistry = async (id: string, updated: Partial<Omit<Ministry, "id">>) => {
    const existing = ministries.find(m => m.id === id)!;
    const result = await apiFetch<Ministry>(`/ministries/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setMinistries(prev => prev.map(m => m.id === id ? result : m));
  };

  const deleteMinistry = async (id: string) => {
    await apiFetch(`/ministries/${id}`, { method: "DELETE" });
    setMinistries(prev => prev.filter(m => m.id !== id));
    setMembers(prev => prev.map(m => m.ministryId === id ? { ...m, ministryId: undefined } : m));
  };

  const addMember = async (m: Omit<Member, "id">) => {
    const created = await apiFetch<Member>("/members", { method: "POST", body: JSON.stringify(m) });
    setMembers(prev => [...prev, created]);
    return created.id;
  };

  const updateMember = async (id: string, updated: Partial<Omit<Member, "id">>) => {
    const existing = members.find(m => m.id === id)!;
    const result = await apiFetch<Member>(`/members/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setMembers(prev => prev.map(m => m.id === id ? result : m));
  };

  const deleteMember = async (id: string) => {
    await apiFetch(`/members/${id}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addLeader = async (l: Omit<Leadership, "id">) => {
    const created = await apiFetch<Leadership>("/leaders", { method: "POST", body: JSON.stringify(l) });
    setLeaders(prev => [...prev, created]);
  };

  const updateLeader = async (id: string, updated: Partial<Omit<Leadership, "id">>) => {
    const existing = leaders.find(l => l.id === id)!;
    const result = await apiFetch<Leadership>(`/leaders/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setLeaders(prev => prev.map(l => l.id === id ? result : l));
  };

  const deleteLeader = async (id: string) => {
    await apiFetch(`/leaders/${id}`, { method: "DELETE" });
    setLeaders(prev => prev.filter(l => l.id !== id));
  };

  const addEvent = async (e: Omit<EventType, "id">) => {
    const created = await apiFetch<EventType>("/events", { method: "POST", body: JSON.stringify(e) });
    setEvents(prev => [...prev, created]);
  };

  const updateEvent = async (id: string, updated: Partial<Omit<EventType, "id">>) => {
    const existing = events.find(e => e.id === id)!;
    const result = await apiFetch<EventType>(`/events/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setEvents(prev => prev.map(e => e.id === id ? result : e));
  };

  const deleteEvent = async (id: string) => {
    await apiFetch(`/events/${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addStudy = async (s: Omit<Study, "id">) => {
    const created = await apiFetch<Study>("/studies", { method: "POST", body: JSON.stringify(s) });
    setStudies(prev => [...prev, created]);
  };

  const updateStudy = async (id: string, updated: Partial<Omit<Study, "id">>) => {
    const existing = studies.find(s => s.id === id)!;
    const result = await apiFetch<Study>(`/studies/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setStudies(prev => prev.map(s => s.id === id ? result : s));
  };

  const deleteStudy = async (id: string) => {
    await apiFetch(`/studies/${id}`, { method: "DELETE" });
    setStudies(prev => prev.filter(s => s.id !== id));
  };

  const addSong = async (s: Omit<WorshipSong, "id">) => {
    const created = await apiFetch<WorshipSong>("/songs", { method: "POST", body: JSON.stringify(s) });
    setSongs(prev => [...prev, created]);
  };

  const updateSong = async (id: string, updated: Partial<Omit<WorshipSong, "id">>) => {
    const existing = songs.find(s => s.id === id)!;
    const result = await apiFetch<WorshipSong>(`/songs/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setSongs(prev => prev.map(s => s.id === id ? result : s));
  };

  const deleteSong = async (id: string) => {
    await apiFetch(`/songs/${id}`, { method: "DELETE" });
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  const addTransacao = async (t: Omit<Transacao, "id" | "criadoPor">) => {
    const created = await apiFetch<Transacao>("/transacoes", { method: "POST", body: JSON.stringify(t) });
    setTransacoes(prev => [created, ...prev]);
  };

  const updateTransacao = async (id: string, updated: Partial<Omit<Transacao, "id" | "criadoPor">>) => {
    const existing = transacoes.find(t => t.id === id)!;
    const result = await apiFetch<Transacao>(`/transacoes/${id}`, { method: "PUT", body: JSON.stringify({ ...existing, ...updated }) });
    setTransacoes(prev => prev.map(t => t.id === id ? result : t));
  };

  const deleteTransacao = async (id: string) => {
    await apiFetch(`/transacoes/${id}`, { method: "DELETE" });
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  const addPapelIgreja = async (igrejaId: string, nome: string): Promise<Papel> => {
    const created = await apiFetch<{ id: string; nome: string }>(`/igrejas/${igrejaId}/papeis`, {
      method: "POST", body: JSON.stringify({ nome }),
    });
    const papel: Papel = { ...created, igrejaId };
    setPapeis(prev => [...prev, papel]);
    return papel;
  };

  const deletePapelIgreja = async (igrejaId: string, papelId: string) => {
    await apiFetch(`/igrejas/${igrejaId}/papeis/${papelId}`, { method: "DELETE" });
    setPapeis(prev => prev.filter(p => p.id !== papelId));
  };

  const value = useMemo(() => ({
    igrejas, addIgreja, updateIgreja, deleteIgreja,
    membrosIgreja, addMembroIgreja, removeMembroIgreja, addPapelToMembro, removePapelFromMembro,
    ministries, addMinistry, updateMinistry, deleteMinistry,
    members, addMember, updateMember, deleteMember,
    leaders, addLeader, updateLeader, deleteLeader,
    events, addEvent, updateEvent, deleteEvent,
    studies, addStudy, updateStudy, deleteStudy,
    songs, addSong, updateSong, deleteSong,
    transacoes, addTransacao, updateTransacao, deleteTransacao,
    papeis, addPapelIgreja, deletePapelIgreja,
    isLoading,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [igrejas, membrosIgreja, ministries, members, leaders, events, studies, songs, transacoes, papeis, isLoading]);

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) throw new Error("useMockData must be used within MockDataProvider");
  return context;
}
