import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Ministry = {
  id: string;
  name: string;
  description: string;
  city: string;
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
};

type MockDataContextType = {
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
  events: EventType[];
  addEvent: (e: Omit<EventType, "id">) => Promise<void>;
  studies: Study[];
  addStudy: (s: Omit<Study, "id">) => Promise<void>;
  songs: WorshipSong[];
  addSong: (s: Omit<WorshipSong, "id">) => Promise<void>;
  isLoading: boolean;
};

const MockDataContext = createContext<MockDataContextType | null>(null);

const BASE_URL = "http://localhost:8080/api";

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
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaders, setLeaders] = useState<Leadership[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [m, mb, l, e, st, sg] = await Promise.all([
          apiFetch<Ministry[]>("/ministries"),
          apiFetch<Member[]>("/members"),
          apiFetch<Leadership[]>("/leaders"),
          apiFetch<EventType[]>("/events"),
          apiFetch<Study[]>("/studies"),
          apiFetch<WorshipSong[]>("/songs"),
        ]);
        setMinistries(m);
        setMembers(mb);
        setLeaders(l);
        setEvents(e);
        setStudies(st);
        setSongs(sg);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

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

  const addEvent = async (e: Omit<EventType, "id">) => {
    const created = await apiFetch<EventType>("/events", { method: "POST", body: JSON.stringify(e) });
    setEvents(prev => [...prev, created]);
  };

  const addStudy = async (s: Omit<Study, "id">) => {
    const created = await apiFetch<Study>("/studies", { method: "POST", body: JSON.stringify(s) });
    setStudies(prev => [...prev, created]);
  };

  const addSong = async (s: Omit<WorshipSong, "id">) => {
    const created = await apiFetch<WorshipSong>("/songs", { method: "POST", body: JSON.stringify(s) });
    setSongs(prev => [...prev, created]);
  };

  return (
    <MockDataContext.Provider value={{
      ministries, addMinistry, updateMinistry, deleteMinistry,
      members, addMember, updateMember, deleteMember,
      leaders, addLeader,
      events, addEvent,
      studies, addStudy,
      songs, addSong,
      isLoading,
    }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) throw new Error("useMockData must be used within MockDataProvider");
  return context;
}
