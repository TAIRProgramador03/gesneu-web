import React, { createContext, useContext, useState } from 'react';

interface SessionErrorContextType {
  sessionError: string | null;
  setSessionError: (error: string | null) => void;
}

const SessionErrorContext = createContext<SessionErrorContextType | undefined>(undefined);

export const SessionErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionError, setSessionError] = useState<string | null>(null);

  return (
    <SessionErrorContext.Provider value={{ sessionError, setSessionError }}>
      {children}
    </SessionErrorContext.Provider>
  );
};

export const useSessionError = () => {
  const context = useContext(SessionErrorContext);
  if (context === undefined) {
    throw new Error('useSessionError must be used within a SessionErrorProvider');
  }
  return context;
};
