"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Guarda se o site está no modo claro ou escuro.
// O jeito que o Tailwind funciona: quando a classe "dark" está no
// <html>, todas as classes que começam com "dark:" passam a valer.
const TemaContext = createContext();

export function TemaProvider({ children }) {
  const [escuro, setEscuro] = useState(false);

  // lê o tema que a pessoa escolheu da última vez
  useEffect(() => {
    const salvo = localStorage.getItem("tema");

    if (salvo === "escuro") {
      setEscuro(true);
    }
  }, []);

  // põe ou tira a classe "dark" do <html> e salva a escolha
  useEffect(() => {
    if (escuro) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "escuro");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "claro");
    }
  }, [escuro]);

  function alternarTema() {
    setEscuro(!escuro);
  }

  return (
    <TemaContext.Provider value={{ escuro, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}
