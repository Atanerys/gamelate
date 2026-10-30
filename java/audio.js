const KEY = 'quest-volume';
const NOTES = [220, 261.6, 329.6, 392, 329.6, 261.6, 293.7, 349.2];
const load = () => { try { const v = localStorage.getItem(KEY); return v === null ? 0.5 : +v; } catch { return 0.5; } };

// Музыка: файл audio/music.mp3 (свой); если его нет — играет простая мелодия из Web Audio.
export class Music {
  constructor() {
    this.vol = load(); this.muted = false; this.on = false; this.timer = 0; this.ctx = null; this.master = null;
    this.el = new Audio('audio/music.mp3'); this.el.loop = true; this.apply();
  }

  apply() {
    const v = this.muted ? 0 : this.vol;
    this.el.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setVolume(v) {
    this.vol = v;
    try { localStorage.setItem(KEY, String(v)); } catch { /* хранилище недоступно */ }
    this.apply();
  }

  setMuted(m) { this.muted = m; this.apply(); }

  play() {
    this.on = true;
    this.el.play().then(() => this.stopSynth()).catch(e => { if (e.name !== 'NotAllowedError') this.startSynth(); });
  }

  startSynth() {
    if (this.timer) return;
    const ctx = this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    ctx.resume();
    if (!this.master) { this.master = ctx.createGain(); this.master.connect(ctx.destination); }
    this.apply();
    let i = 0;
    this.timer = setInterval(() => {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = NOTES[i % NOTES.length] * (i % 32 < 16 ? 1 : 0.75); i++;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.85);
    }, 450);
  }

  stopSynth() { clearInterval(this.timer); this.timer = 0; }

  hold(h) { if (h) { this.el.pause(); this.stopSynth(); } else if (this.on) this.play(); }
}
