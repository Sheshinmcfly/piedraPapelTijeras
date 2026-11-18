import { Component, signal, computed, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstadisticasService, Resultado } from './services/estadisticas.service';

export type Pantalla = 'inicio' | 'cantidad' | 'jugada' | 'resultParcial' | 'resultFinal' | 'estadisticas';
export type Opcion = 0 | 1 | 2; // 0=piedra, 1=papel, 2=tijeras
export type Tema = 'moderno' | 'retro';

const TEMA_KEY = 'ppt-tema';
const MUSICA_KEY = 'ppt-musica';

function leer(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function guardar(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible */
  }
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '(document:keydown)': 'onTecla($event)' },
})
export class AppComponent {
  readonly stats = inject(EstadisticasService);

  // ── Tema ────────────────────────────────────────────────────────────────
  tema = signal<Tema>(leer(TEMA_KEY) === 'retro' ? 'retro' : 'moderno');

  toggleTema(): void {
    this.tema.update((t) => (t === 'moderno' ? 'retro' : 'moderno'));
  }

  // ── Música ──────────────────────────────────────────────────────────────
  musicaActiva = signal(leer(MUSICA_KEY) !== 'off');
  private audio = new Audio('assets/audio/audio.mp3');
  private musicaIniciada = false;

  toggleMusica(): void {
    this.musicaActiva.update((m) => !m);
  }

  // ── Estado de pantalla ──────────────────────────────────────────────────
  pantalla = signal<Pantalla>('inicio');
  private pantallaPrevia: Pantalla = 'inicio';

  // ── Configuración de partida ────────────────────────────────────────────
  cantidadInput = '';
  errorCantidad = signal('');
  cantidadTotal = signal(0);
  rondaActual = signal(1);

  // ── Puntajes ────────────────────────────────────────────────────────────
  puntosRobot = signal(0);
  puntosJugador = signal(0);

  // ── Jugada actual ───────────────────────────────────────────────────────
  opcionSeleccionada = signal<Opcion | null>(null);
  opcionRobot = signal<Opcion | null>(null);
  mensajeRonda = signal('');

  // ── Mensaje final ───────────────────────────────────────────────────────
  mensajeFinal = signal('');

  rondasRestantes = computed(() => this.cantidadTotal() - this.rondaActual() + 1);

  // Texto para lectores de pantalla (región aria-live).
  anuncio = signal('');

  readonly opciones: { label: string; img: string; valor: Opcion; tecla: string }[] = [
    { label: 'Piedra', img: 'assets/img/piedra.svg', valor: 0, tecla: '1' },
    { label: 'Papel', img: 'assets/img/papel.svg', valor: 1, tecla: '2' },
    { label: 'Tijeras', img: 'assets/img/tijeras.svg', valor: 2, tecla: '3' },
  ];

  constructor() {
    this.audio.volume = 0.05;
    this.audio.loop = true;

    effect(() => guardar(TEMA_KEY, this.tema()));

    effect(() => {
      const activa = this.musicaActiva();
      guardar(MUSICA_KEY, activa ? 'on' : 'off');
      // Los navegadores solo permiten reproducir audio tras una interacción: se arranca al entrar al juego.
      if (!this.musicaIniciada) return;
      if (activa) this.audio.play()?.catch(() => {});
      else this.audio.pause();
    });
  }

  // ── Pantalla Inicio ──────────────────────────────────────────────────────
  entrar(): void {
    this.musicaIniciada = true;
    if (this.musicaActiva()) this.audio.play()?.catch(() => {});
    this.pantalla.set('cantidad');
  }

  // ── Pantalla Cantidad ────────────────────────────────────────────────────
  iniciarJuego(): void {
    const n = Number(String(this.cantidadInput).trim());
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      this.errorCantidad.set('Ingresa un número entero entre 1 y 100.');
      return;
    }

    this.errorCantidad.set('');
    this.cantidadTotal.set(n);
    this.rondaActual.set(1);
    this.puntosRobot.set(0);
    this.puntosJugador.set(0);
    this.opcionSeleccionada.set(null);
    this.anuncio.set(`Ronda 1 de ${n}. Elige piedra, papel o tijeras.`);
    this.pantalla.set('jugada');
  }

  // ── Pantalla Jugada ──────────────────────────────────────────────────────
  seleccionar(opcion: Opcion): void {
    this.opcionSeleccionada.set(opcion);
  }

  jugar(): void {
    const jugador = this.opcionSeleccionada();
    if (jugador === null) return;

    const robot = Math.floor(Math.random() * 3) as Opcion;
    this.opcionRobot.set(robot);

    const resultado = this.calcularResultado(jugador, robot);
    this.stats.registrarRonda(jugador, resultado);
    if (resultado === 'gana') {
      this.puntosJugador.update((p) => p + 1);
      this.mensajeRonda.set('¡Ganaste!');
    } else if (resultado === 'pierde') {
      this.puntosRobot.update((p) => p + 1);
      this.mensajeRonda.set('¡Perdiste!');
    } else {
      this.mensajeRonda.set('¡Empate!');
    }
    this.anuncio.set(
      `${this.mensajeRonda()} La Máquina eligió ${this.opciones[robot].label.toLowerCase()} y tú ${this.opciones[jugador].label.toLowerCase()}.`,
    );

    this.pantalla.set('resultParcial');

    const esUltima = this.rondaActual() === this.cantidadTotal();

    setTimeout(() => {
      if (esUltima) {
        this.mensajeFinal.set(this.calcularMensajeFinal());
        this.stats.registrarPartida(this.resultadoPartida());
        this.anuncio.set(`Resultados finales: Máquina ${this.puntosRobot()}, tú ${this.puntosJugador()}.`);
        this.pantalla.set('resultFinal');
      } else {
        this.rondaActual.update((r) => r + 1);
        this.opcionSeleccionada.set(null);
        this.anuncio.set(`Ronda ${this.rondaActual()} de ${this.cantidadTotal()}.`);
        this.pantalla.set('jugada');
      }
    }, 2000);
  }

  // Atajos: 1, 2 y 3 eligen la jugada y Enter juega (solo en la pantalla de jugada).
  onTecla(event: KeyboardEvent): void {
    if (this.pantalla() !== 'jugada' || event.altKey || event.ctrlKey || event.metaKey) return;
    const opcion = this.opciones.find((o) => o.tecla === event.key);
    if (opcion) {
      event.preventDefault();
      this.seleccionar(opcion.valor);
    } else if (event.key === 'Enter' && this.opcionSeleccionada() !== null && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      this.jugar();
    }
  }

  private calcularResultado(jugador: Opcion, robot: Opcion): Resultado {
    if (jugador === robot) return 'empate';
    if ((jugador === 0 && robot === 2) || (jugador === 1 && robot === 0) || (jugador === 2 && robot === 1)) return 'gana';
    return 'pierde';
  }

  private resultadoPartida(): Resultado {
    const j = this.puntosJugador();
    const r = this.puntosRobot();
    return j > r ? 'gana' : j < r ? 'pierde' : 'empate';
  }

  private calcularMensajeFinal(): string {
    const resultado = this.resultadoPartida();
    if (resultado === 'gana') return '¡Felicidades!\nLe has ganado a «La Máquina».\n¡Eres el nuevo campeón!';
    if (resultado === 'pierde') return '¡Has perdido!\nJa, ja, nadie puede ganarle a «La Máquina».\n¡Eres el nuevo perdedor!';
    return '¡Ha sido un empate!\nLograste igualarte contra «La Máquina».\n¡Eres un digno rival!';
  }

  // ── Estadísticas ─────────────────────────────────────────────────────────
  confirmandoReinicio = signal(false);

  verEstadisticas(): void {
    this.pantallaPrevia = this.pantalla();
    this.confirmandoReinicio.set(false);
    this.pantalla.set('estadisticas');
  }

  reiniciarRecords(): void {
    this.stats.reiniciar();
    this.confirmandoReinicio.set(false);
  }

  cerrarEstadisticas(): void {
    this.pantalla.set(this.pantallaPrevia === 'estadisticas' ? 'inicio' : this.pantallaPrevia);
  }

  // ── Jugar de nuevo ───────────────────────────────────────────────────────
  jugarDeNuevo(): void {
    this.cantidadInput = '';
    this.errorCantidad.set('');
    this.cantidadTotal.set(0);
    this.rondaActual.set(1);
    this.puntosRobot.set(0);
    this.puntosJugador.set(0);
    this.opcionSeleccionada.set(null);
    this.opcionRobot.set(null);
    this.mensajeRonda.set('');
    this.mensajeFinal.set('');
    this.pantalla.set('cantidad');
  }
}
