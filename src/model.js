export const W = 390, H = 844, DURATION = 180;
export const ALLIES = {
  bunny: { name: 'Mây', role: 'Chữa lành', detail: 'Sửa xe định kỳ', color: '#a6d8a3' },
  owl: { name: 'Mực', role: 'Trinh sát', detail: 'Hút nắng · tầm xa', color: '#d3b4ef' },
  bear: { name: 'Bắp', role: 'Hộ vệ', detail: 'Khiên chặn sát thương', color: '#9ed6e0' },
};
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export class Expedition {
  constructor(seed = Date.now() >>> 0) {
    this.seed = seed; this.random = rng(seed); this.time = 0; this.phase = 0;
    this.player = { x: 195, y: 480, invulnerable: 0, moving: 0 };
    this.convoy = { x: 195, y: 620, hp: 100 };
    this.target = null; this.keys = { x: 0, y: 0 };
    this.coins = 0; this.score = 0; this.allies = []; this.power = 0; this.shield = 0;
    this.enemies = []; this.pickups = []; this.hazards = []; this.rescues = []; this.warnings = [];
    this.route = null; this.routeHistory = []; this.events = []; this.state = 'playing'; this.boss = null;
    this.id = 0; this.shotAt = 0; this.itemAt = 0.4; this.enemyAt = 15; this.hazardAt = 20; this.repairAt = 22;
    this.rescueSchedule = [8, 27, 46, 77, 112]; this.rescueIndex = 0;
    this.rescueOrder = ['bunny', 'owl', 'bear'];
    for (let i = this.rescueOrder.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [this.rescueOrder[i], this.rescueOrder[j]] = [this.rescueOrder[j], this.rescueOrder[i]]; }
    this.healAt = 0; this.shieldAt = 0; this.bossAttackAt = 134; this.bossSunAt = 133;
    this.stats = { rescued: 0, gathered: 0, defeated: 0, damage: 0, blocked: 0, routes: 0 };
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { return this.events.splice(0); }
  addPickup(kind, x, y) { this.pickups.push({ id: ++this.id, kind, x, y, age: 0 }); }
  damage(amount, x = this.player.x, y = this.player.y) {
    if (this.state !== 'playing' || this.player.invulnerable > 0) return;
    if (this.shield > 0) { this.shield--; this.stats.blocked++; this.emit('block', { x, y }); this.player.invulnerable = 0.6; return; }
    this.convoy.hp = clamp(this.convoy.hp - amount, 0, 100);
    this.stats.damage += amount; this.player.invulnerable = 1.05; this.emit('hit', { x, y, amount });
    if (this.convoy.hp <= 0) this.finish(false, 'Đoàn xe cần được bảo vệ');
  }
  finish(won, reason) {
    if (this.state !== 'playing') return;
    this.state = won ? 'won' : 'lost'; this.reason = reason;
    this.score += Math.round(this.convoy.hp * 3) + (won ? 500 : 0);
    this.emit('end', { won, reason });
  }
  rescue(r) {
    const already = this.allies.includes(r.kind);
    if (!already) { this.allies.push(r.kind); if (r.kind === 'bear') this.shield = Math.min(3, this.shield + 2); }
    else { this.power += 0.4; this.convoy.hp = Math.min(100, this.convoy.hp + 12); }
    this.stats.rescued++; this.score += 120;
    r.done = true; this.emit('rescue', { x: r.x, y: r.y, kind: r.kind, already });
  }
  chooseRoute(side) {
    const r = this.route; if (!r) return;
    const reward = side === 'left' ? r.left : r.right;
    if (reward === 'heal') { this.convoy.hp = Math.min(100, this.convoy.hp + 32); this.emit('heal', { x: this.convoy.x, y: this.convoy.y, amount: 32 }); }
    else if (reward === 'power') { this.power += 1; }
    else if (reward === 'shield') { this.shield = Math.min(3, this.shield + 2); }
    else { this.coins += 12; this.stats.gathered += 12; this.score += 120; }
    this.routeHistory.push(reward); this.stats.routes++;
    this.emit('route', { reward, x: side === 'left' ? 102 : 288, y: r.y }); this.route = null;
  }
  update(dt) {
    if (this.state !== 'playing') return;
    dt = Math.min(0.05, Math.max(0, dt)); this.time += dt;
    const t = this.time, p = this.player, c = this.convoy;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    let vx = 0, vy = 0;
    if (this.keys.x || this.keys.y) { const m = Math.hypot(this.keys.x, this.keys.y); vx = this.keys.x / m * 310; vy = this.keys.y / m * 310; }
    else if (this.target) { const d = distance(p, this.target); const s = Math.min(320, d * 10); if (d > 2) { vx = (this.target.x - p.x) / d * s; vy = (this.target.y - p.y) / d * s; } }
    p.x = clamp(p.x + vx * dt, 26, 364); p.y = clamp(p.y + vy * dt, 228, 714); p.moving = Math.min(1, Math.hypot(vx, vy) / 120);
    c.x += (clamp(p.x, 87, 303) - c.x) * dt * 1.9;
    const newPhase = t < 60 ? 0 : t < 132 ? 1 : 2;
    if (newPhase !== this.phase) { this.phase = newPhase; this.emit('phase', { phase: newPhase }); }
    if (this.allies.includes('bunny') && t >= this.healAt) { this.healAt = t + 7; const n = Math.min(5, 100 - c.hp); c.hp += n; if (n) this.emit('heal', { x: c.x, y: c.y, amount: n }); }
    if (this.allies.includes('bear') && t >= this.shieldAt) { this.shieldAt = t + 13; if (this.shield < 2) { this.shield++; this.emit('block', { x: c.x, y: c.y }); } }
    if (t >= this.itemAt && t < 131) {
      this.itemAt = t + 2.2;
      const x = clamp(195 + Math.sin(t * 0.19) * 62 + (this.random() - .5) * 110, 48, 342);
      for (let i = 0; i < 3; i++) this.addPickup('sun', x + Math.sin(i * 1.8) * 17, 145 - i * 34);
    }
    if (t >= this.repairAt && t < 129) { this.repairAt = t + 17; this.addPickup('heart', 60 + this.random() * 270, 145); }
    if (this.rescueIndex < this.rescueSchedule.length && t >= this.rescueSchedule[this.rescueIndex]) {
      const i = this.rescueIndex++;
      this.rescues.push({ id: ++this.id, kind: this.rescueOrder[i % 3], x: [97, 286, 107, 282, 110][i], y: 155, progress: 0, done: false });
      this.emit('camp', { kind: this.rescueOrder[i % 3] });
    }
    const speed = this.phase === 2 ? 22 : this.phase === 1 ? 62 : 53;
    for (const r of this.rescues) {
      r.y += speed * dt;
      if (!r.done && distance(p, r) < 59) { r.progress += dt; if (r.progress >= 1) this.rescue(r); }
      else r.progress = Math.max(0, r.progress - dt * 0.35);
    }
    this.rescues = this.rescues.filter(r => !r.done && r.y < 805);
    for (const item of this.pickups) {
      item.age += dt; item.y += speed * dt;
      const d = distance(p, item), magnet = this.allies.includes('owl') ? 88 : 43;
      if (d < magnet && d > 1) { item.x += (p.x - item.x) * dt * 10; item.y += (p.y - item.y) * dt * 10; }
      if (distance(p, item) < 27) {
        item.collected = true;
        if (item.kind === 'heart') { const n = Math.min(18, 100 - c.hp); c.hp += n; this.emit('heal', { x: p.x, y: p.y, amount: n }); }
        else { this.coins++; this.stats.gathered++; this.score += 10;
          if (this.boss && this.boss.hp > 0) { this.boss.hp = Math.max(0, this.boss.hp - 8); this.emit('beam', { x: p.x, y: p.y, tx: this.boss.x, ty: this.boss.y }); }
          this.emit('pickup', { x: item.x, y: item.y }); }
      }
    }
    this.pickups = this.pickups.filter(i => !i.collected && i.y < 830);
    if (t >= this.enemyAt && t < 132) {
      this.enemyAt = t + (this.phase === 0 ? 5.1 : 3.7);
      this.enemies.push({ id: ++this.id, x: 38 + this.random() * 310, y: 145, hp: 2.5 + (this.phase ? .8 : 0), age: 0 });
    }
    if (t >= this.hazardAt && t < 126) {
      this.hazardAt = t + 7.2; const lane = Math.floor(this.random() * 3);
      this.hazards.push({ id: ++this.id, x: [92, 195, 298][lane], y: 145, kind: this.random() < .5 ? 'log' : 'rock', hit: false, passed: false });
    }
    for (const h of this.hazards) {
      h.y += speed * dt;
      if (!h.hit && Math.abs(p.x - h.x) < 42 && Math.abs(p.y - h.y) < 30) { h.hit = true; this.damage(9, h.x, h.y); }
      if (!h.passed && h.y > c.y - 26) { h.passed = true; if (Math.abs(c.x - h.x) < 49) this.damage(11, h.x, h.y); }
    }
    this.hazards = this.hazards.filter(h => h.y < 850);
    for (const e of this.enemies) {
      e.age += dt; e.y += (this.phase === 0 ? 61 : 73) * dt; e.x += clamp(c.x - e.x, -38, 38) * dt * .35;
      if (distance(e, p) < 29 && e.hp > 0) { this.damage(8, e.x, e.y); e.hp = 0; this.emit('poof', { x: e.x, y: e.y }); }
      else if (e.y > c.y - 25 && e.hp > 0) { this.damage(13, c.x, c.y); e.hp = 0; this.emit('poof', { x: e.x, y: e.y }); }
    }
    if (!this.route && this.routeHistory.length < 2 && t > [55, 101][this.routeHistory.length]) {
      const second = this.routeHistory.length === 1;
      this.route = { y: 150, left: second ? 'shield' : 'heal', right: second ? 'sun' : 'power' };
      if (this.random() < .5) [this.route.left, this.route.right] = [this.route.right, this.route.left];
      this.emit('fork');
    }
    if (this.route) {
      this.route.y += 45 * dt;
      if (Math.abs(p.y - this.route.y) < 32 && (p.x < 148 || p.x > 242)) this.chooseRoute(p.x < 195 ? 'left' : 'right');
      else if (this.route.y > 640) this.chooseRoute(p.x < 195 ? 'left' : 'right');
    }
    if (this.phase === 2) this.updateBoss(dt);
    if (t >= this.shotAt) {
      const range = this.allies.includes('owl') ? 185 : 143;
      const near = this.enemies.filter(e => e.hp > 0 && distance(p, e) < range).sort((a, b) => distance(p, a) - distance(p, b))[0];
      let target = near;
      if (!target && this.boss?.hp > 0 && distance(p, this.boss) < range + 55 && this.boss.vulnerable) target = this.boss;
      if (target) {
        this.shotAt = t + .7; target.hp -= 1.5 + this.power + this.allies.length * .28;
        this.emit('shot', { x: p.x, y: p.y - 20, tx: target.x, ty: target.y, boss: target === this.boss });
        if (target !== this.boss && target.hp <= 0) { this.stats.defeated++; this.score += 25; this.emit('poof', { x: target.x, y: target.y }); this.addPickup('sun', target.x, target.y); }
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0 && e.y < 760);
    if (this.boss && this.boss.hp <= 0 && this.state === 'playing') { this.boss.hp = 0; this.finish(true, 'Cánh cổng phiêu lưu đã mở!'); }
    if (t >= DURATION && this.state === 'playing') this.finish(false, 'Hết giờ · thần cây vẫn giữ cổng');
  }
  updateBoss(dt) {
    const t = this.time;
    if (!this.boss) { this.boss = { x: 195, y: 272, hp: 300, maxHp: 300, vulnerable: false }; this.enemies = []; this.hazards = []; }
    this.boss.x = 195 + Math.sin(t * .65) * 55;
    this.boss.vulnerable = t % 7 < 4.7;
    if (distance(this.player, this.boss) < 88) { this.damage(10, this.player.x, this.player.y); this.player.y = this.boss.y + 89; }
    if (t > this.bossSunAt) {
      this.bossSunAt = t + 1.8;
      const x = [74, 195, 316][Math.floor(this.random() * 3)];
      this.addPickup('sun', x, 365);
    }
    if (t > this.bossAttackAt) {
      this.bossAttackAt = t + 2.6;
      this.warnings.push({ id: ++this.id, x: this.player.x, y: this.player.y, radius: 51, timer: 1.25, total: 1.25, hit: false });
      if (t > 153) this.warnings.push({ id: ++this.id, x: clamp(this.player.x + (this.random() < .5 ? -95 : 95), 55, 335), y: this.player.y + 48, radius: 45, timer: 1.55, total: 1.55, hit: false });
    }
    for (const w of this.warnings) {
      w.timer -= dt;
      if (!w.hit && w.timer <= 0) { w.hit = true; this.emit('slam', { x: w.x, y: w.y }); if (distance(this.player, w) < w.radius + 7) this.damage(17, w.x, w.y); }
    }
    this.warnings = this.warnings.filter(w => w.timer > -.55);
  }
  snapshot() {
    return { state: this.state, time: this.time, phase: this.phase, player: { ...this.player }, convoy: { ...this.convoy }, allies: [...this.allies], coins: this.coins, power: this.power, shield: this.shield, stats: { ...this.stats }, pickups: this.pickups.map(x => ({ ...x })), rescues: this.rescues.map(x => ({ ...x })), hazards: this.hazards.map(x => ({ ...x })), warnings: this.warnings.map(x => ({ ...x })), enemies: this.enemies.map(x => ({ ...x })), route: this.route ? { ...this.route } : null, routes: [...this.routeHistory], boss: this.boss ? { ...this.boss } : null, seed: this.seed };
  }
}
