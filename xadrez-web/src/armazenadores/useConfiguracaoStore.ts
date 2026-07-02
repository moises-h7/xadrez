import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TemaTabuleiro = 'moderno-gelo' | 'madeira-classico' | 'cyberpunk' | 'minimalista';
export type TemaPecas = 'neo-classico' | 'silhueta' | 'geometrico';

interface EstadoConfiguracao {
  temaTabuleiro: TemaTabuleiro;
  temaPecas: TemaPecas;
  rotacaoAutomaticaLocal: boolean;
  definirTemaTabuleiro: (tema: TemaTabuleiro) => void;
  definirTemaPecas: (tema: TemaPecas) => void;
  definirRotacaoAutomaticaLocal: (valor: boolean) => void;
}

export const useConfiguracaoStore = create<EstadoConfiguracao>()(
  persist(
    (set) => ({
      temaTabuleiro: 'moderno-gelo',
      temaPecas: 'neo-classico',
      rotacaoAutomaticaLocal: true,
      definirTemaTabuleiro: (tema) => set({ temaTabuleiro: tema }),
      definirTemaPecas: (tema) => set({ temaPecas: tema }),
      definirRotacaoAutomaticaLocal: (valor) => set({ rotacaoAutomaticaLocal: valor }),
    }),
    {
      name: 'xadrez-configuracoes',
    }
  )
);
