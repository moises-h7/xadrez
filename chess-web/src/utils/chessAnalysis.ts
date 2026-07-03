export interface MoveAnalysis {
  classification: 'brilliant' | 'great' | 'excellent' | 'book' | 'inaccuracy' | 'mistake' | 'blunder';
  label: string;
  color: string;
  description: string;
}

export function classifyMove(_evalScore: number, winChance: number, isBestMove: boolean): MoveAnalysis {
  if (isBestMove) {
    if (winChance > 65) {
      return {
        classification: 'brilliant',
        label: 'Brilhante',
        color: '#1baca6',
        description: 'Um lance fantástico que consolida uma forte vantagem!'
      };
    }
    return {
      classification: 'excellent',
      label: 'Excelente',
      color: '#96bc4b',
      description: 'O melhor lance recomendado pela engine na posição.'
    };
  }

  if (winChance > 52) {
    return {
      classification: 'great',
      label: 'Bom',
      color: '#3c84a4',
      description: 'Um lance sólido que mantém a posição equilibrada.'
    };
  } else if (winChance > 45) {
    return {
      classification: 'inaccuracy',
      label: 'Imprecisão',
      color: '#f7c04a',
      description: 'Havia opções melhores que garantiam mais controle.'
    };
  } else if (winChance > 30) {
    return {
      classification: 'mistake',
      label: 'Erro',
      color: '#e58f2a',
      description: 'Um erro tático que cede iniciativa ao oponente.'
    };
  } else {
    return {
      classification: 'blunder',
      label: 'Erro Crítico',
      color: '#b33430',
      description: 'Um deslize grave! Você entregou vantagem material ou posicional.'
    };
  }
}
