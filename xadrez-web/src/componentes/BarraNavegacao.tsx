import React from 'react';
import { Play, BookOpen, User, Palette } from 'lucide-react';

interface PropriedadesNavegacao {
  abaAtiva: string;
  definirAbaAtiva: (aba: string) => void;
}

export default function BarraNavegacao({ abaAtiva, definirAbaAtiva }: PropriedadesNavegacao) {
  const abas = [
    { id: 'jogar', rotulo: 'Jogar', icone: Play },
    { id: 'aprender', rotulo: 'Aprender', icone: BookOpen },
    { id: 'perfil', rotulo: 'Perfil', icone: User },
    { id: 'personalizar', rotulo: 'Personalizar', icone: Palette },
  ];

  return (
    <nav className="abas-navegacao">
      {abas.map((aba) => {
        const Icone = aba.icone;
        return (
          <button
            key={aba.id}
            onClick={() => definirAbaAtiva(aba.id)}
            className={`aba-item ${abaAtiva === aba.id ? 'ativa' : ''}`}
            aria-label={`Aba ${aba.rotulo}`}
          >
            <Icone size={18} />
            <span>{aba.rotulo}</span>
          </button>
        );
      })}
    </nav>
  );
}
