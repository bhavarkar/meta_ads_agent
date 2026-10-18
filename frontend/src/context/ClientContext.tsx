import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '../types';
import { api } from '../services/api';
import { FALLBACK_CLIENTS } from '../services/demoData';

interface ClientContextType {
  clients: Client[];
  activeClient: Client | null;
  setActiveClient: (client: Client) => void;
  isLoading: boolean;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  activeClient: null,
  setActiveClient: () => {},
  isLoading: true,
  refreshClients: async () => {},
});

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(FALLBACK_CLIENTS);
  const [activeClient, setActiveClientState] = useState<Client | null>(FALLBACK_CLIENTS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await api.getClients();
      setClients(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('metapilot_active_client_id');
        const found = data.find(c => c.id === savedId) || data[0];
        setActiveClientState(found);
      }
    } catch (err) {
      console.warn("Using fallback clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const setActiveClient = (client: Client) => {
    setActiveClientState(client);
    localStorage.setItem('metapilot_active_client_id', client.id);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        activeClient,
        setActiveClient,
        isLoading,
        refreshClients: loadClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
