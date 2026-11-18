// jsdom no reproduce audio: play() y pause() se simulan con el comportamiento de un navegador real.
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => undefined;

// Cada test parte sin tema, música ni récords guardados.
beforeEach(() => localStorage.clear());
