# Piedra, Papel o Tijeras

Juego de piedra, papel o tijeras contra la máquina, con selector de tema moderno y retro 16-bit. Disponible como app móvil Android vía Capacitor.

## Tecnologías

- Angular 17 (standalone components)
- Signals y computed
- Angular Animations
- Bootstrap 5.3 + Bootstrap Icons 1.11
- Capacitor (Android APK)

## Funcionalidades

- Pantalla de inicio con animación de iconos
- Selector de número de partidas (1-100)
- Marcador en tiempo real por ronda
- Resultado parcial entre rondas con animación
- Resultado final con mensaje según ganador, empate o derrota
- Música de fondo con volumen reducido
- **Tema Moderno**: glassmorphism, gradientes purple/cyan, animaciones suaves
- **Tema Retro 16-bit**: fuente pixel (Press Start 2P), scanlines, colores neón, bordes pixelados

## Instalación

```bash
npm install
```

## Desarrollo

```bash
ng serve
```

Abrir `http://localhost:4200`

## Tests

```bash
ng test
```

Cobertura: 100% (statements, branches, functions, lines)

## Android APK

```bash
ng build
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK generado en `android/app/build/outputs/apk/debug/app-debug.apk`
