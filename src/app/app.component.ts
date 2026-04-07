import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

export type Pantalla = 'inicio' | 'cantidad' | 'jugada' | 'resultParcial' | 'resultFinal';
export type Opcion   = 0 | 1 | 2; // 0=piedra, 1=papel, 2=tijeras
export type Tema     = 'moderno' | 'retro';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('pantalla', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', top: 0, left: 0, width: '100%' }),
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class AppComponent {

  // ── Tema ────────────────────────────────────────────────────────────────
  tema = signal<Tema>('moderno');

  toggleTema(): void {
    this.tema.update(t => t === 'moderno' ? 'retro' : 'moderno');
  }

  // ── Estado de pantalla ──────────────────────────────────────────────────
  pantalla = signal<Pantalla>('inicio');

  // ── Configuración de partida ────────────────────────────────────────────
  cantidadInput = '';
  cantidadTotal  = signal(0);
  rondaActual    = signal(1);

  // ── Puntajes ────────────────────────────────────────────────────────────
  puntosRobot   = signal(0);
  puntosJugador = signal(0);

  // ── Jugada actual ───────────────────────────────────────────────────────
  opcionSeleccionada = signal<Opcion | null>(null);
  opcionRobot        = signal<Opcion | null>(null);
  mensajeRonda       = signal('');

  // ── Mensaje final ───────────────────────────────────────────────────────
  mensajeFinal = signal('');

  // ── Computed: partidas restantes ─────────────────────────────────────────
  rondasRestantes = computed(() => this.cantidadTotal() - this.rondaActual() + 1);

  // ── Audio ────────────────────────────────────────────────────────────────
  private audio = new Audio('assets/audio/audio.mp3');

  readonly opciones: { label: string; img: string; valor: Opcion }[] = [
    { label: 'Piedra',  img: 'assets/img/piedra.svg',  valor: 0 },
    { label: 'Papel',   img: 'assets/img/papel.svg',   valor: 1 },
    { label: 'Tijeras', img: 'assets/img/tijeras.svg', valor: 2 },
  ];

  // ── Pantalla Inicio ──────────────────────────────────────────────────────
  entrar(): void {
    this.audio.volume = 0.05;
    this.audio.loop   = true;
    this.audio.play().catch(() => {});
    this.pantalla.set('cantidad');
  }

  // ── Pantalla Cantidad ────────────────────────────────────────────────────
  iniciarJuego(): void {
    const n = parseInt(this.cantidadInput, 10);
    if (isNaN(n) || n < 1 || n > 100) return;

    this.cantidadTotal.set(n);
    this.rondaActual.set(1);
    this.puntosRobot.set(0);
    this.puntosJugador.set(0);
    this.opcionSeleccionada.set(null);
    this.pantalla.set('jugada');
  }

  // ── Pantalla Jugada ──────────────────────────────────────────────────────
  seleccionar(opcion: Opcion): void {
    this.opcionSeleccionada.set(opcion);
  }

  jugar(): void {
    const jugador = this.opcionSeleccionada();
    if (jugador === null) return;

    const robot = (Math.floor(Math.random() * 3)) as Opcion;
    this.opcionRobot.set(robot);

    const resultado = this.calcularResultado(jugador, robot);
    if (resultado === 'gana') {
      this.puntosJugador.update(p => p + 1);
      this.mensajeRonda.set('¡Ganaste!');
    } else if (resultado === 'pierde') {
      this.puntosRobot.update(p => p + 1);
      this.mensajeRonda.set('¡Perdiste!');
    } else {
      this.mensajeRonda.set('¡Empate!');
    }

    this.pantalla.set('resultParcial');

    const esUltima = this.rondaActual() === this.cantidadTotal();

    setTimeout(() => {
      if (esUltima) {
        this.mensajeFinal.set(this.calcularMensajeFinal());
        this.pantalla.set('resultFinal');
      } else {
        this.rondaActual.update(r => r + 1);
        this.opcionSeleccionada.set(null);
        this.pantalla.set('jugada');
      }
    }, 2000);
  }

  private calcularResultado(jugador: Opcion, robot: Opcion): 'gana' | 'pierde' | 'empate' {
    if (jugador === robot) return 'empate';
    if (
      (jugador === 0 && robot === 2) ||
      (jugador === 1 && robot === 0) ||
      (jugador === 2 && robot === 1)
    ) return 'gana';
    return 'pierde';
  }

  private calcularMensajeFinal(): string {
    const j = this.puntosJugador();
    const r = this.puntosRobot();
    if (j > r) return '¡Felicidades!<br>Le has ganado a "La máquina".<br>¡Eres el nuevo campeón!';
    if (j < r) return '¡Has perdido!<br>Jaja, nadie puede ganarle a "La máquina".<br>¡Eres el nuevo perdedor!';
    return '¡Ha sido un empate!<br>Lograste igualarte contra "La máquina".<br>¡Eres un digno rival!';
  }

  // ── Jugar de nuevo ───────────────────────────────────────────────────────
  jugarDeNuevo(): void {
    this.cantidadInput = '';
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
