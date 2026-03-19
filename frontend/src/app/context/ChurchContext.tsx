import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Igreja, useMockData } from './MockDataContext';

type ChurchContextType = {
  activeIgreja: Igreja | null;
  setActiveIgrejaId: (id: string) => void;
};

const ChurchContext = createContext<ChurchContextType | null>(null);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { igrejas } = useMockData();
  const [activeIgrejaId, setActiveIgrejaIdState] = useState<string>(
    () => localStorage.getItem('activeIgrejaId') ?? ''
  );

  const setActiveIgrejaId = (id: string) => {
    localStorage.setItem('activeIgrejaId', id);
    setActiveIgrejaIdState(id);
  };

  useEffect(() => {
    if (igrejas.length === 0) return;
    const stored = localStorage.getItem('activeIgrejaId');
    if (stored && igrejas.find(ig => ig.id === stored)) return;
    if (igrejas.length >= 1) setActiveIgrejaId(igrejas[0].id);
  }, [igrejas]);

  const activeIgreja = igrejas.find(ig => ig.id === activeIgrejaId) ?? null;

  return (
    <ChurchContext.Provider value={{ activeIgreja, setActiveIgrejaId }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useActiveChurch() {
  const context = useContext(ChurchContext);
  if (!context) throw new Error('useActiveChurch must be used within ChurchProvider');
  return context;
}
