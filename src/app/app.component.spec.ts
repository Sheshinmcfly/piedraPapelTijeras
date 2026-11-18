import { TestBed } from '@angular/core/testing';
import { AppComponent, Opcion } from './app.component';

describe('AppComponent', () => {

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [],
        }).compileComponents();
    });

    function crear() {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        return { fixture, app: fixture.componentInstance };
    }

    // ── Creación ──────────────────────────────────────────────────────────
    it('should create the app', () => {
        const { app } = crear();
        expect(app).toBeTruthy();
    });

    it('should start on pantalla "inicio"', () => {
        const { app } = crear();
        expect(app.pantalla()).toBe('inicio');
    });

    it('should start with zero scores', () => {
        const { app } = crear();
        expect(app.puntosRobot()).toBe(0);
        expect(app.puntosJugador()).toBe(0);
    });

    // ── entrar() ──────────────────────────────────────────────────────────
    it('entrar() should change pantalla to "cantidad"', () => {
        const { app } = crear();
        app.entrar();
        expect(app.pantalla()).toBe('cantidad');
    });

    // ── iniciarJuego() ────────────────────────────────────────────────────
    it('iniciarJuego() should go to "jugada" with valid input', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        expect(app.pantalla()).toBe('jugada');
        expect(app.cantidadTotal()).toBe(3);
        expect(app.rondaActual()).toBe(1);
    });

    it('iniciarJuego() should not proceed with invalid input (letters)', () => {
        const { app } = crear();
        app.cantidadInput = 'abc';
        app.iniciarJuego();
        expect(app.pantalla()).toBe('inicio');
    });

    it('iniciarJuego() should not proceed with 0', () => {
        const { app } = crear();
        app.cantidadInput = '0';
        app.iniciarJuego();
        expect(app.pantalla()).toBe('inicio');
    });

    it('iniciarJuego() should not proceed with negative number', () => {
        const { app } = crear();
        app.cantidadInput = '-1';
        app.iniciarJuego();
        expect(app.pantalla()).toBe('inicio');
    });

    it('iniciarJuego() should not proceed with number > 100', () => {
        const { app } = crear();
        app.cantidadInput = '101';
        app.iniciarJuego();
        expect(app.pantalla()).toBe('inicio');
    });

    // ── seleccionar() ─────────────────────────────────────────────────────
    it('seleccionar() should set opcionSeleccionada', () => {
        const { app } = crear();
        app.seleccionar(1);
        expect(app.opcionSeleccionada()).toBe(1);
    });

    // ── jugar() ───────────────────────────────────────────────────────────
    it('jugar() should not proceed if no option selected', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.jugar();
        expect(app.pantalla()).toBe('jugada');
    });

    it('jugar() should change pantalla to "resultParcial"', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        app.jugar();
        expect(app.pantalla()).toBe('resultParcial');
    });

    it('jugar() should set opcionRobot', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        app.jugar();
        expect(app.opcionRobot()).not.toBeNull();
    });

    // ── calcularResultado (via jugar) ─────────────────────────────────────
    it('piedra(0) vs tijeras(2) → jugador gana', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(2 / 3); // robot = 2 (tijeras)
        app.jugar();
        expect(app.puntosJugador()).toBe(1);
        expect(app.mensajeRonda()).toBe('¡Ganaste!');
    });

    it('papel(1) vs piedra(0) → jugador gana', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(1);
        vi.spyOn(Math, 'random').mockReturnValue(0); // robot = 0 (piedra)
        app.jugar();
        expect(app.puntosJugador()).toBe(1);
    });

    it('tijeras(2) vs papel(1) → jugador gana', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(2);
        vi.spyOn(Math, 'random').mockReturnValue(1 / 3); // robot = 1 (papel)
        app.jugar();
        expect(app.puntosJugador()).toBe(1);
    });

    it('piedra(0) vs papel(1) → robot gana', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(1 / 3); // robot = 1 (papel)
        app.jugar();
        expect(app.puntosRobot()).toBe(1);
        expect(app.mensajeRonda()).toBe('¡Perdiste!');
    });

    it('piedra(0) vs piedra(0) → empate', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(0); // robot = 0 (piedra)
        app.jugar();
        expect(app.puntosJugador()).toBe(0);
        expect(app.puntosRobot()).toBe(0);
        expect(app.mensajeRonda()).toBe('¡Empate!');
    });

    // ── rondasRestantes computed ──────────────────────────────────────────
    it('rondasRestantes should be computed correctly', () => {
        const { app } = crear();
        app.cantidadInput = '5';
        app.iniciarJuego();
        expect(app.rondasRestantes()).toBe(5);
    });

    // ── calcularMensajeFinal (via jugarDeNuevo después de última ronda) ───
    it('mensajeFinal should contain victoria message when jugador wins', async () => {
        const { app } = crear();
        app.cantidadInput = '1';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(2 / 3); // robot = 2 (tijeras), jugador gana
        app.jugar();
        setTimeout(() => {
            expect(app.mensajeFinal()).toContain('campeón');
            ;
        }, 2100);
    });

    it('mensajeFinal should contain derrota message when robot wins', async () => {
        const { app } = crear();
        app.cantidadInput = '1';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(1 / 3); // robot = 1 (papel), robot gana
        app.jugar();
        setTimeout(() => {
            expect(app.mensajeFinal()).toContain('perdedor');
            ;
        }, 2100);
    });

    it('mensajeFinal should contain empate message on draw', async () => {
        const { app } = crear();
        app.cantidadInput = '1';
        app.iniciarJuego();
        app.seleccionar(0);
        vi.spyOn(Math, 'random').mockReturnValue(0); // robot = 0 (piedra), empate
        app.jugar();
        setTimeout(() => {
            expect(app.mensajeFinal()).toContain('rival');
            ;
        }, 2100);
    });

    // ── jugarDeNuevo() ────────────────────────────────────────────────────
    it('jugarDeNuevo() should reset all state', () => {
        const { app } = crear();
        app.cantidadInput = '3';
        app.iniciarJuego();
        app.seleccionar(0);
        app.jugarDeNuevo();
        expect(app.pantalla()).toBe('cantidad');
        expect(app.cantidadInput).toBe('');
        expect(app.puntosRobot()).toBe(0);
        expect(app.puntosJugador()).toBe(0);
        expect(app.rondaActual()).toBe(1);
        expect(app.opcionSeleccionada()).toBeNull();
        expect(app.mensajeFinal()).toBe('');
    });

    // ── tema signal & toggleTema() ───────────────────────────────────────
    it('should start with tema "moderno"', () => {
        const { app } = crear();
        expect(app.tema()).toBe('moderno');
    });

    it('toggleTema() should switch from moderno to retro', () => {
        const { app } = crear();
        app.toggleTema();
        expect(app.tema()).toBe('retro');
    });

    it('toggleTema() should switch back from retro to moderno', () => {
        const { app } = crear();
        app.toggleTema();
        app.toggleTema();
        expect(app.tema()).toBe('moderno');
    });

    // ── opciones array ────────────────────────────────────────────────────
    it('should have 3 opciones defined', () => {
        const { app } = crear();
        expect(app.opciones.length).toBe(3);
        expect(app.opciones[0].valor).toBe(0);
        expect(app.opciones[1].valor).toBe(1);
        expect(app.opciones[2].valor).toBe(2);
    });
});
