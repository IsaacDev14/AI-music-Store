import React, { createContext, useState } from 'react';

interface InstrumentContextType {
  selectedInstruments: number[];
  setSelectedInstruments: (instruments: number[]) => void;
}

const InstrumentContext = createContext<InstrumentContextType | undefined>(undefined);


interface InstrumentProviderProps {
  children: React.ReactNode;
}

const InstrumentProvider: React.FC<InstrumentProviderProps> = ({ children }) => {
  const [selectedInstruments, setSelectedInstruments] = useState<number[]>([]);

  return (
    <InstrumentContext.Provider value={{ selectedInstruments, setSelectedInstruments }}>
      {children}
    </InstrumentContext.Provider>
  );
};

export default InstrumentProvider;