import { Injectable, computed, effect, signal } from '@angular/core';

export type Resultado = 'gana' | 'pierde' | 'empate';

export interface Estadisticas {
  partidasGanadas: number;
  partidasPerdidas: number;
  partidasEmpatadas: number;
  rondasGanadas: number;
  rondasPerdidas: number;
  rondasEmpatadas: number;
  rachaActual: number;
  mejorRacha: number;
  jugadas: [number, number, number];
}

const STORAGE_KEY = 'ppt-estadisticas';

const VACIAS: Estadisticas = {
  partidasGanadas: 0,
  partidasPerdidas: 0,
  partidasEmpatadas: 0,
  rondasGanadas: 0,
  rondasPerdidas: 0,
  rondasEmpatadas: 0,
  rachaActual: 0,
  mejorRacha: 0,
  jugadas: [0, 0, 0],
};

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  readonly datos = signal<Estadisticas>(this.cargar());

  readonly partidasJugadas = computed(() => {
    const d = this.datos();
    return d.partidasGanadas + d.partidasPerdidas + d.partidasEmpatadas;
  });

  readonly porcentajeVictorias = computed(() => {
    const total = this.partidasJugadas();
    return total ? Math.round((this.datos().partidasGanadas / total) * 100) : 0;
  });

  // Índice de la jugada más usada (0 piedra, 1 papel, 2 tijeras) o null si todavía no hay jugadas.
  readonly jugadaFavorita = computed<number | null>(() => {
    const j = this.datos().jugadas;
    const max = Math.max(...j);
    return max === 0 ? null : j.indexOf(max);
  });

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.datos()));
      } catch {
        /* almacenamiento no disponible */
      }
    });
  }

  registrarRonda(jugada: 0 | 1 | 2, resultado: Resultado): void {
    this.datos.update((d) => {
      const jugadas = [...d.jugadas] as [number, number, number];
      jugadas[jugada]++;
      return {
        ...d,
        jugadas,
        rondasGanadas: d.rondasGanadas + (resultado === 'gana' ? 1 : 0),
        rondasPerdidas: d.rondasPerdidas + (resultado === 'pierde' ? 1 : 0),
        rondasEmpatadas: d.rondasEmpatadas + (resultado === 'empate' ? 1 : 0),
      };
    });
  }

  // La racha cuenta partidas ganadas seguidas; un empate o una derrota la corta.
  registrarPartida(resultado: Resultado): void {
    this.datos.update((d) => {
      const rachaActual = resultado === 'gana' ? d.rachaActual + 1 : 0;
      return {
        ...d,
        partidasGanadas: d.partidasGanadas + (resultado === 'gana' ? 1 : 0),
        partidasPerdidas: d.partidasPerdidas + (resultado === 'pierde' ? 1 : 0),
        partidasEmpatadas: d.partidasEmpatadas + (resultado === 'empate' ? 1 : 0),
        rachaActual,
        mejorRacha: Math.max(d.mejorRacha, rachaActual),
      };
    });
  }

  reiniciar(): void {
    this.datos.set({ ...VACIAS, jugadas: [0, 0, 0] });
  }

  private cargar(): Estadisticas {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (!raw || typeof raw !== 'object') return { ...VACIAS, jugadas: [0, 0, 0] };
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
      const jugadas = Array.isArray(raw.jugadas) && raw.jugadas.length === 3 ? raw.jugadas.map(num) : [0, 0, 0];
      return {
        partidasGanadas: num(raw.partidasGanadas),
        partidasPerdidas: num(raw.partidasPerdidas),
        partidasEmpatadas: num(raw.partidasEmpatadas),
        rondasGanadas: num(raw.rondasGanadas),
        rondasPerdidas: num(raw.rondasPerdidas),
        rondasEmpatadas: num(raw.rondasEmpatadas),
        rachaActual: num(raw.rachaActual),
        mejorRacha: num(raw.mejorRacha),
        jugadas: jugadas as [number, number, number],
      };
    } catch {
      return { ...VACIAS, jugadas: [0, 0, 0] };
    }
  }
}
