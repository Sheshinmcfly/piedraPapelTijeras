import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { EstadisticasService } from './services/estadisticas.service';

function crear() {
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  return { fixture, app: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function tecla(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('AppComponent: accesibilidad, preferencias y estadísticas', () => {
  afterEach(() => vi.useRealTimers());

  it('muestra un aviso si la cantidad de partidas no es válida', () => {
    const { app } = crear();
    app.entrar();
    app.cantidadInput = '2.5';
    app.iniciarJuego();
    expect(app.pantalla()).toBe('cantidad');
    expect(app.errorCantidad()).toContain('entre 1 y 100');
    app.cantidadInput = '3';
    app.iniciarJuego();
    expect(app.errorCantidad()).toBe('');
    expect(app.pantalla()).toBe('jugada');
  });

  it('las teclas 1, 2 y 3 eligen la jugada y Enter juega', () => {
    const { app } = crear();
    app.entrar();
    app.cantidadInput = '3';
    app.iniciarJuego();
    tecla('2');
    expect(app.opcionSeleccionada()).toBe(1);
    tecla('3');
    expect(app.opcionSeleccionada()).toBe(2);
    tecla('Enter');
    expect(app.pantalla()).toBe('resultParcial');
  });

  it('los atajos no hacen nada fuera de la pantalla de jugada', () => {
    const { app } = crear();
    tecla('1');
    expect(app.opcionSeleccionada()).toBeNull();
  });

  it('las opciones son botones con estado presionado', () => {
    const { fixture, app, el } = crear();
    app.entrar();
    app.cantidadInput = '1';
    app.iniciarJuego();
    fixture.detectChanges();
    const botones = el.querySelectorAll<HTMLButtonElement>('button.opcion-card');
    expect(botones.length).toBe(3);
    botones[0].click();
    fixture.detectChanges();
    expect(botones[0].getAttribute('aria-pressed')).toBe('true');
    expect(botones[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('recuerda el tema y la música entre visitas', () => {
    const { app } = crear();
    app.toggleTema();
    app.toggleMusica();
    TestBed.tick();
    expect(localStorage.getItem('ppt-tema')).toBe('retro');
    expect(localStorage.getItem('ppt-musica')).toBe('off');
    TestBed.resetTestingModule();
    const { app: nueva } = crear();
    expect(nueva.tema()).toBe('retro');
    expect(nueva.musicaActiva()).toBe(false);
  });

  it('registra la partida en las estadísticas al terminar', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(2 / 3);
    const { app } = crear();
    app.entrar();
    app.cantidadInput = '1';
    app.iniciarJuego();
    app.seleccionar(0);
    app.jugar();
    vi.advanceTimersByTime(2000);
    const stats = TestBed.inject(EstadisticasService);
    expect(app.pantalla()).toBe('resultFinal');
    expect(stats.datos().partidasGanadas).toBe(1);
    expect(stats.datos().rondasGanadas).toBe(1);
    expect(app.mensajeFinal()).not.toContain('<br>');
  });

  it('abre los récords y vuelve a la pantalla anterior', () => {
    const { app } = crear();
    app.verEstadisticas();
    expect(app.pantalla()).toBe('estadisticas');
    app.cerrarEstadisticas();
    expect(app.pantalla()).toBe('inicio');
  });

  it('reiniciar récords pide confirmación', () => {
    const { app } = crear();
    TestBed.inject(EstadisticasService).registrarPartida('gana');
    app.verEstadisticas();
    app.confirmandoReinicio.set(true);
    app.reiniciarRecords();
    expect(TestBed.inject(EstadisticasService).partidasJugadas()).toBe(0);
    expect(app.confirmandoReinicio()).toBe(false);
  });
});
