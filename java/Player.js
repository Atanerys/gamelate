import { GROUND, landOn } from './collision.js';
import { img } from './assets.js';

const SPEED = 300, GRAVITY = 1800, JUMP = 640, SCALE = 0.12; // Оптимальный размер
const IDLE_R = ['stop1.png', 'stop2.png', 'stop.png'];

export class Player {
  constructor() { this.w = 40; this.h = 80; this.reset(64); }

  reset(x) {
    this.x = x; this.y = GROUND; this.vy = 0;
    this.onGround = true; this.dir = 1; this.anim = 0; this.idleT = 0; this.moving = false;
  }

  jump() {
    if (this.onGround) { this.vy = -JUMP; this.onGround = false; }
  }

  update(dt, held, roomW, plats) {
    const dx = held.right - held.left;
    this.moving = !!dx;
    if (dx) { this.dir = dx; this.anim += dt * 12; } else this.idleT += dt;
    this.x = Math.max(30, Math.min(roomW - 30, this.x + dx * SPEED * dt));
    const prev = this.y;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    this.onGround = false;
    landOn(this, prev, plats);
  }

  frame() {
    const n = 1 + Math.floor(this.anim / 1.5) % 8;
    if (this.dir > 0) return this.moving ? `${n}p.png` : IDLE_R[Math.floor(this.idleT * 5) % 3];
    return this.moving ? `${n}pl.png` : 'Untitled-1.png';
  }

  draw(ctx) {
    const im = img(this.frame()) || img('Untitled.png');
    if (im) {
      const w = im.naturalWidth * SCALE, h = im.naturalHeight * SCALE;
      // Ноги ровно на полу
      ctx.drawImage(im, this.x - w / 2, this.y - h + 15, w, h);
      return;
    }
    // Заглушка
    const { x, y, w, h } = this, leg = Math.sin(this.anim) * 8;
    ctx.fillStyle = '#2b2d6e';
    ctx.fillRect(x - 12 + leg, y - 22, 10, 22);
    ctx.fillRect(x + 2 - leg, y - 22, 10, 22);
    ctx.fillStyle = '#7b6cff';
    ctx.fillRect(x - w / 2, y - h + 22, w, h - 44);
    ctx.fillStyle = '#ffd9b8';
    ctx.beginPath(); ctx.arc(x, y - h + 12, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(x + this.dir * 6 - 2, y - h + 8, 4, 4);
  }
}