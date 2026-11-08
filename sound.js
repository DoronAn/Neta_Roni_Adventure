// The reveal's sounds, made in the browser (no sound files): dice rattling on a table, a chime as each die lands,
// and a short fanfare when the card arrives. A phone only lets a page make sound after a tap, so the roll button
// calls unlock() first. Where Web Audio is missing, everything here is silent.

const Sound = (() => {
  let ac = null, out = null, noise = null;

  function unlock() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ac = new A();
      out = ac.createGain(); out.gain.value = 0.7; out.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  const ready = () => (ac && ac.state !== "closed" ? ac : null);

  // One knock of a die on wood: a short burst of filtered noise.
  function knock(t, vol) {
    const src = ac.createBufferSource(); src.buffer = noise;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400 + Math.random() * 2400; bp.Q.value = 2.5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(bp).connect(g).connect(out); src.start(t, Math.random() * 0.3, 0.08);
  }
  // A small bell: a few sine partials, struck and fading.
  function bell(t, freq, vol, dur) {
    [[1, 1], [2.0, 0.45], [3.01, 0.22], [4.17, 0.1]].forEach(([m, a]) => {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq * m;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
      o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }

  // The dice rolling for `seconds`: knocks that start fast and slow down.
  function rattle(seconds) {
    if (!ready()) return;
    let t = ac.currentTime, gap = 0.03; const end = t + seconds;
    while (t < end) { knock(t, 0.25 + Math.random() * 0.35); t += gap * (0.6 + Math.random() * 0.9); gap *= 1.09; }
  }
  // A die lands: a firm knock and a chime, higher for the second die.
  function land(i = 0) {
    if (!ready()) return;
    const t = ac.currentTime; knock(t, 0.7); bell(t + 0.02, [1046.5, 1318.5][i % 2], 0.22, 1.4);
  }
  // The card arrives: a rising arpeggio and a sprinkle of high bells.
  function fanfare() {
    if (!ready()) return;
    const t = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = f;
      const g = ac.createGain(), s = t + i * 0.11;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.16, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 3 ? 1.4 : 0.35));
      o.connect(g).connect(out); o.start(s); o.stop(s + 1.5);
      bell(s, f * 2, 0.08, 0.8);
    });
    for (let i = 0; i < 9; i++) bell(t + 0.45 + i * 0.07 + Math.random() * 0.05, 1800 + Math.random() * 1800, 0.05, 0.6);
  }

  return { unlock, rattle, land, fanfare };
})();
