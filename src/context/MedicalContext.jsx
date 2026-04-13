import { createContext, useContext, useState } from "react";

const MedicalContext = createContext();

export const MedicalProvider = ({ children }) => {
  const [medical, setMedical] = useState(() => {
    try {
      const saved = localStorage.getItem("medical");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const selectMedical = (store) => {
    setMedical(store);
    localStorage.setItem("medical", JSON.stringify(store));
  };

  return (
    <MedicalContext.Provider value={{ medical, selectMedical }}>
      {children}
    </MedicalContext.Provider>
  );
};

export const useMedical = () => useContext(MedicalContext);
