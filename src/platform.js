// Platform seam: no SDK, ad requests, analytics endpoints, or personal data.
const KEY = 'dxpl.progress.v1';
export class LocalProgress {
  constructor(storage) {
    this.persistent = true;
    try { this.storage = storage ?? globalThis.localStorage; } catch { this.persistent = false; }
    this.data = { version: 1, runs: 0, wins: 0, losses: 0, retries: 0, starts: 0, totalSeconds: 0, bestScore: 0, sun: 0, collection: [], recent: [], muted: false };
    try { const saved = JSON.parse(this.storage?.getItem(KEY) ?? null); if (saved?.version === 1) this.data = { ...this.data, ...saved }; }
    catch { this.persistent = false; }
  }
  save() { try { this.storage.setItem(KEY, JSON.stringify(this.data)); } catch { this.persistent = false; } }
  start(retry = false) { this.data.starts++; if (retry) this.data.retries++; this.save(); }
  record(game) {
    const d = this.data, won = game.state === 'won';
    d.runs++; d[won ? 'wins' : 'losses']++; d.totalSeconds += Math.round(game.time); d.bestScore = Math.max(d.bestScore, game.score); d.sun += game.coins;
    d.collection = [...new Set([...d.collection, ...game.allies])];
    d.recent.push({ won, seconds: Math.round(game.time), score: game.score, rescued: game.stats.rescued, routes: [...game.routeHistory] });
    d.recent = d.recent.slice(-20); this.save();
  }
  clear() { this.storage.removeItem(KEY); }
}
export class PortalAdapter {
  // Future SDK integrations implement these methods only after user authorization.
  gameplayStart() {}
  gameplayStop() {}
  async rewardedAd() { return { available: false, rewarded: false }; }
}
export class Sound {
  constructor(muted) { this.muted = muted; this.ctx = null; this.lastPickup = 0; }
  unlock() {
    try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
    catch { /* Audio is optional; gameplay must remain available. */ }
  }
  tone(frequency, duration, type = 'sine', gain = .07, delay = 0) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(frequency, t); o.frequency.exponentialRampToValueAtTime(frequency * .7, t + duration);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + duration);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + duration + .01);
  }
  play(kind) {
    if (kind === 'pickup') { if (performance.now() - this.lastPickup < 65) return; this.lastPickup = performance.now(); this.tone(800 + Math.random() * 400, .13); }
    else if (kind === 'shot') this.tone(380, .08, 'triangle', .025);
    else if (kind === 'hit' || kind === 'slam') this.tone(90, .22, 'triangle', .11);
    else if (kind === 'rescue' || kind === 'route') [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .23, 'sine', .075, i * .095));
    else if (kind === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .4, 'triangle', .055, i * .13));
    else if (kind === 'heal' || kind === 'block') this.tone(660, .24, 'sine', .06);
    else if (kind === 'lose') [392, 330, 262].forEach((f, i) => this.tone(f, .35, 'sine', .07, i * .2));
  }
  suspend() { this.ctx?.suspend().catch(() => {}); }
}
