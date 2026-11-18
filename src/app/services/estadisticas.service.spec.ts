import { TestBed } from '@angular/core/testing';
import { EstadisticasService } from './estadisticas.service';

describe('EstadisticasService', () => {
  it('arranca en cero sin jugada favorita', () => {
    const s = TestBed.inject(EstadisticasService);
    expect(s.partidasJugadas()).toBe(0);
    expect(s.porcentajeVictorias()).toBe(0);
    expect(s.jugadaFavorita()).toBeNull();
  });

  it('registra rondas y calcula la jugada favorita', () => {
    const s = TestBed.inject(EstadisticasService);
    s.registrarRonda(1, 'gana');
    s.registrarRonda(1, 'pierde');
    s.registrarRonda(2, 'empate');
    expect(s.datos().rondasGanadas).toBe(1);
    expect(s.datos().rondasPerdidas).toBe(1);
    expect(s.datos().rondasEmpatadas).toBe(1);
    expect(s.jugadaFavorita()).toBe(1);
  });

  it('lleva la racha de partidas ganadas y la corta con un empate o derrota', () => {
    const s = TestBed.inject(EstadisticasService);
    s.registrarPartida('gana');
    s.registrarPartida('gana');
    s.registrarPartida('empate');
    s.registrarPartida('gana');
    expect(s.datos().rachaActual).toBe(1);
    expect(s.datos().mejorRacha).toBe(2);
    expect(s.partidasJugadas()).toBe(4);
    expect(s.porcentajeVictorias()).toBe(75);
  });

  it('persiste en localStorage y restaura al crear el servicio', () => {
    TestBed.inject(EstadisticasService).registrarPartida('gana');
    TestBed.tick();
    TestBed.resetTestingModule();
    expect(TestBed.inject(EstadisticasService).datos().partidasGanadas).toBe(1);
  });

  it('ignora datos corruptos', () => {
    localStorage.setItem('ppt-estadisticas', JSON.stringify({ partidasGanadas: -5, jugadas: 'x', mejorRacha: 'mucho' }));
    const d = TestBed.inject(EstadisticasService).datos();
    expect(d.partidasGanadas).toBe(0);
    expect(d.mejorRacha).toBe(0);
    expect(d.jugadas).toEqual([0, 0, 0]);
  });

  it('reinicia todo', () => {
    const s = TestBed.inject(EstadisticasService);
    s.registrarPartida('pierde');
    s.registrarRonda(0, 'pierde');
    s.reiniciar();
    expect(s.partidasJugadas()).toBe(0);
    expect(s.jugadaFavorita()).toBeNull();
  });
});
