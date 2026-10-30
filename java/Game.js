import { Player } from './Player.js';
import { initInput } from './input.js';
import { GROUND, dist } from './collision.js';
import { img } from './assets.js';
import { Music } from './audio.js';

const H = 540;
const ROOM_W = { 1: 1400, 2: 1800, 3: 1400 };
const BG = { 1: ['#9ad1ff', '#e8f6ff'], 2: ['#3b3358', '#6b5b8f'], 3: ['#5a4a3a', '#8c7358'] };

const DOORS = {
  1: [{ id: 'to2', x: 1270, up: 30 }], 
  2: [
    { id: 'd1', x: 190 , up: 30 }, 
    { id: 'd3', x: 1300, up: 25 }, 
    { id: 'd2', x: 1650, scale: 0.6, up: 115 } 
  ],
  3: [{ id: 'back', x: 190, up: 15 }], 
};

const BEST_KEY = 'quest-best-time';
const DOOR_IMG = { to2: 'door.png', d1: 'door.png', d3: 'door.png', d2: 'door2.png', back: 'door.png' };
const THING_IMG = { key: 'key.png', house: 'house.png', leaf: 'leave.png', cat: 'cat.png', note: 'flowerprint.png', pack: 'backpack.png' };
const CARDS = [
  { id: 'leaf', img: 'leave.png' }, 
  { id: 'cat', img: 'cat.png' }, 
  { id: 'house', img: 'house.png' }
];

const THING_H = { key: 100, house: 70, leaf: 50, cat: 60, note: 80, pack: 90 };

export class Game {
  constructor(cv, ui) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.ui = ui;
    this.p = new Player();
    this.state = 'menu'; this.raf = 0; this.best = this.loadBest();
    this.held = initInput(this);
    cv.addEventListener('pointerdown', e => this.click(e));
    this.music = new Music();
    ui.vol.value = Math.round(this.music.vol * 100);
    ui.vol.oninput = () => this.music.setVolume(ui.vol.value / 100);
    ui.mute.onchange = () => this.music.setMuted(ui.mute.checked);
    ui.pause.onclick = () => this.pause();
    ui.restart.onclick = () => this.play();
    ui.bPlay.onclick = () => this.play();
    ui.bAgain.onclick = () => this.play();
    ui.bRestart2.onclick = () => this.play();
    ui.bSettings.onclick = () => this.screen('settings');
    ui.bBack.onclick = () => this.screen('menu');
    ui.bResume.onclick = () => this.pause();
    ui.bToMenu.onclick = ui.bToMenu2.onclick = () => this.toMenu();
    
    if (ui.bLoseAgain) ui.bLoseAgain.onclick = () => this.play();
    if (ui.bLoseMenu) ui.bLoseMenu.onclick = () => this.toMenu();

    addEventListener('pointerdown', () => this.music.play(), { once: true });
    document.addEventListener('visibilitychange', () => this.music.hold(document.hidden));
    this.reset();
    this.W = 960; this.s = 1;
    addEventListener('resize', () => this.resize());
    this.resize();
    this.setState('menu'); this.screen('menu');
    this.draw();
  }

  resize() {
    const d = devicePixelRatio || 1;
    this.cv.width = innerWidth * d; this.cv.height = innerHeight * d;
    this.s = this.cv.height / H; this.W = this.cv.width / this.s;
    if (this.state !== 'playing') this.draw();
  }

  reset() {
    this.inv = []; this.room = 1; this.time = 0; this.box = false; this.code = ''; this.hang = false; this.slots = []; this.hangMsg = '';
    this.f = { red: true, paper: false, password: false, pic: false, lockOpened: false, doorOpen: false, hung: false, noteHint: false };
    
    this.things = [
      { id: 'key', room: 1, x: 700, up: 190, ch: '🔑' }, 
      { id: 'house', room: 1, x: 840, up: 145, ch: '🏠' }, 
      { id: 'leaf', room: 1, x: 644, up: 206, scale: 2.2, ch: '🍃' }, 
      { id: 'cat', room: 2, x: 1100, up: 40, scale: 1.9, ch: '🐱' },
      { id: 'note', room: 2, x: 520, up: 250, ch: '🌸', fixed: true },
      { id: 'pack', room: 3, x: 1000, up: 80, ch: '🎒' },
    ];
    this.p.reset(64);
    this.say('Я опаздываю. Где мой портфель?', 4);
  }

  say(t, s = 3) { this.msg = t; this.msgT = s; }
  loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; } }
  saveBest() {
    if (!this.best || this.time < this.best) {
      this.best = this.time;
      try { localStorage.setItem(BEST_KEY, String(this.time)); } catch { }
    }
  }

  screen(name) {
    const u = this.ui;
    // ИСПРАВЛЕНО: убрали 'gVol' из паузы
    const G = { 
      menu: ['gMenu'], 
      bye: ['gMenu'], 
      pause: ['gPause'], 
      settings: ['gSettings', 'gVol'], 
      won: ['gWon'], 
      lose: ['gLose'] 
    };
    
    const T = {
      menu: ['Опаздываю!', 'Найди портфель, разгадай загадку с картинами и выберись из дома.'],
      bye: ['До встречи!', 'Можно закрыть вкладку или снова нажать «Играть».'],
      pause: ['Пауза', 'Нажми «Продолжить», чтобы вернуться в игру.'],
      settings: ['Настройки', 'Громкость музыки:'],
      won: ['Ты успела!', this.wonText || ''],
      lose: ['Ты опоздала!', 'Время вышло. Учёба началась без тебя...'],
    };
    
    if (u.ot) u.ot.textContent = T[name][0]; 
    if (u.op) u.op.textContent = T[name][1];
    
    for (const g of ['gMenu', 'gPause', 'gVol', 'gSettings', 'gWon', 'gLose']) {
      if (u[g]) u[g].classList.toggle('hidden', !G[name].includes(g));
    }
    
    if (u.overlay) {
      u.overlay.classList.toggle('solid', ['menu', 'bye', 'settings'].includes(name));
      u.overlay.classList.remove('hidden');
    }
  }
  hideOverlay() { this.ui.overlay.classList.add('hidden'); }

  setState(st) {
    this.state = st; this.ui.bar.classList.toggle('hidden', st !== 'playing');
    document.activeElement?.blur?.();
  }
  play() {
    this.music.play(); this.stopLoop(); this.reset();
    this.setState('playing'); this.hideOverlay(); this.loop();
  }
  pause(onlyIfPlaying) {
    if (this.state === 'playing') {
      this.stopLoop(); this.setState('paused'); this.screen('pause'); this.draw();
    } else if (this.state === 'paused' && !onlyIfPlaying) {
      this.setState('playing'); this.hideOverlay(); this.loop();
    }
  }
  toMenu() { this.stopLoop(); this.reset(); this.setState('menu'); this.screen('menu'); this.draw(); }
  loop() {
    if (this.raf) return;
    this.last = 0;
    const frame = t => {
      this.raf = 0;
      if (this.state !== 'playing') return;
      const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 0;
      this.last = t;
      this.update(dt); this.draw();
      if (this.state === 'playing') this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  stopLoop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  press(a) {
    if (a === 'pause') return this.pause();
    if (this.state !== 'playing' || this.box || this.hang) return;
    if (a === 'jump') this.p.jump();
    else if (a === 'act') this.interact();
  }

  typeKey(e) {
    if (this.hang) {
      if (e.key !== 'Escape') return false;
      this.hang = false; this.slots = []; return true;
    }
    if (/^\d$/.test(e.key)) { if (this.code.length < 4) this.code += e.key; }
    else if (e.key === 'Backspace') this.code = this.code.slice(0, -1);
    else if (e.key === 'Enter') this.checkCode(this.code);
    else if (e.key === 'Escape') { this.box = false; this.code = ''; }
    else return false;
    return true;
  }

  checkCode(c) {
    if (c === '1234') { this.f.lockOpened = true; this.f.pic = false; this.say('Портфель я иду к тебе', 5); }
    else this.say('Что-то не то');
    this.box = false; this.code = '';
  }

  has(n) { return this.inv.includes(n); }
  get(id) { return this.things.find(t => t.id === id && t.room === this.room && !t.taken); }
  near(t, r) { return dist(this.p.x, this.p.y - 40, t.x, GROUND - t.up) < r; }
  nearDoor(x, r) { return Math.abs(this.p.x - x) < r; }

  take(t, name) {
    t.taken = true; this.inv.push(name);
    if (this.has('кот') && this.has('лист') && this.has('дом'))
      this.say('Всё собрано! Теперь можно собрать пароль.', 6);
  }

  interact() {
    const r = this.room;
    if (r === 1) {
      const key = this.get('key');
      if (this.has('портфель') && key && this.near(key, 250)) { this.take(key, 'ключ'); this.say('Нашёл ключ!'); }
      
      const h = this.get('house'), l = this.get('leaf');
      if (h && this.near(h, 250)) this.take(h, 'дом');
      if (l && this.near(l, 250)) this.take(l, 'лист');
      
    } else if (r === 2) {
      const note = this.get('note'), nr = note && this.near(note, 300);
      
      if (!this.f.hung && this.has('кот') && this.has('лист') && this.has('дом')) {
        if (nr) {
          this.hang = true; this.slots = []; this.hangMsg = '';
        } else this.say('Подойди ближе к записке.');
      } else if (nr) {
        if (!this.has('лист') || !this.has('дом')) this.say('Мне не хватает картин. Лист и дом остались в первой комнате.');
        else if (!this.has('кот')) this.say('Я ещё не нашёл кота в этой комнате.');
        else if (this.f.red) { this.say('Тут записка.'); this.f.red = false; }
        else this.say('лист, кот, дом, цветок. Что это может значить?');
      }
      
      const code = this.get('code');
      if (code && this.near(code, 200)) {
        code.taken = true; this.inv.push('записка'); this.f.pic = true;
        this.say('На бумажке написано: 1234. Серьезно, ладно?!', 8);
      }
      const cat = this.get('cat');
      if (cat && this.near(cat, 250)) this.take(cat, 'кот');
    } else {
      const pk = this.get('pack');
      if (pk && this.near(pk, 250)) { this.take(pk, 'портфель'); this.say('Теперь можно идти на учёбу!'); }
    }
  }

  click(e) {
    if (this.state !== 'playing' || this.box) return;
    if (this.hang) return this.hangClick(e);
    
    const b = this.cv.getBoundingClientRect();
    const mx = (e.clientX - b.left) * this.W / b.width + this.camX();
    const my = (e.clientY - b.top) * H / b.height;
    
    for (const d of DOORS[this.room]) {
      const di = img(DOOR_IMG[d.id]);
      
      const scale = d.scale || 1;
      let h = 400 * scale; 
      let w = 100 * scale;
      
      if (di) {
        w = di.naturalWidth * h / di.naturalHeight;
      }
      const yOffset = d.up || 0;
      const doorX = d.x - w / 2;
      const doorY = GROUND - h - yOffset;

      if (mx > doorX && mx < doorX + w && my > doorY && my < doorY + h) {
        const rad = this.room === 1 ? 800 : 250;
        if (this.nearDoor(d.x, rad)) {
          this.useDoor(d);
        } else {
          this.say('Подойди ближе к двери.');
        }
        return; 
      }
    }
  }

  hangClick(e) {
    const b = this.cv.getBoundingClientRect();
    const x = (e.clientX - b.left) * this.W / b.width, y = (e.clientY - b.top) * H / b.height, cx = this.W / 2;
    
    if (x > cx + 225 && y < 135) { this.hang = false; this.slots = []; return; }

    CARDS.forEach((k, i) => {
      const cardX = cx + (i - 1) * 150;
      const cardY = 390; 
      if (this.slots.length < 3 && !this.slots.includes(k.id) && dist(x, y, cardX, cardY) < 60) {
        this.slots.push(k.id);
      }
    });
    
    if (this.slots.length === 3) this.checkHang();
  }

  checkHang() {
    if (this.slots.join() === 'leaf,cat,house') {
      this.hang = false; this.inv = []; this.f.hung = true;
      this.things.push({ id: 'code', room: 2, x: 470, up: 150, floor: 30, ch: '📜' });
      this.say('Картины висят! Из-за них выпала бумажка…', 6);
    } else { this.slots = []; this.hangMsg = 'Не то. Вспомни записку: лист, кот, дом, цветок.'; }
  }

  go(room, x) { this.room = room; this.p.reset(x); }

  useDoor(d) {
    const f = this.f;
    if (d.id === 'to2') this.go(2, 64);
    else if (d.id === 'back') this.go(2, 1250);
    else if (d.id === 'd1') this.go(1, 1250);
    else if (d.id === 'd2') {
      if (f.doorOpen) this.win();
      else if (this.has('ключ')) {
        f.doorOpen = true;
        this.inv = this.inv.filter(i => i !== 'ключ');
        this.say('Дверь открыта');
        this.win();
      } else {
        this.say('Ну, кто бы сомневался. Нужен ключ.');
      }
    } else if (f.pic) {
      if (matchMedia('(pointer:coarse)').matches) this.checkCode(prompt('Введите пароль:') || '');
      else { this.box = true; this.code = ''; }
    } else if (f.lockOpened) this.go(3, 220);
    else if (!f.paper) { this.say('Закрыто. Что и ожидалось — надо найти пароль.'); f.paper = true; }
    else this.say('Я не могу открыть дверь без пароля.');
  }

  win() {
    this.stopLoop(); this.setState('won'); this.saveBest();
    const s = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    this.wonText = `Время: ${s(this.time)} · Рекорд: ${s(this.best)}`; this.screen('won');
  }

  lose() {
    this.stopLoop(); this.setState('lose'); this.screen('lose');
  }

  plats() { return [{ x: 0, y: GROUND, w: ROOM_W[this.room] }]; }
  camX() { 
    let cam = this.p.x - this.W / 2;
    if (cam < 0) cam = 0;
    if (cam > ROOM_W[this.room] - this.W) cam = ROOM_W[this.room] - this.W;
    return cam; 
  }

  update(dt) {
    this.time += dt;
    
    if (this.time >= 120) {
      this.lose();
      return;
    }

    if (this.msgT > 0) this.msgT -= dt;
    if (this.box || this.hang) return;

    if (this.room === 2 && !this.f.hung && !this.f.noteHint) {
      const note = this.get('note');
      if (note && this.near(note, 350)) {
        if (!this.has('лист') || !this.has('дом') || !this.has('кот')) {
           this.say('А где все картины? Тут записка...\nПохоже, их нужно развесить по порядку:\nлист, кот, дом, цветок.', 7);
           this.f.noteHint = true; 
        }
      }
    }

    for (const t of this.things) if (t.floor !== undefined && t.up > t.floor) t.up = Math.max(t.floor, t.up - 500 * dt);
    this.p.update(dt, this.held, ROOM_W[this.room], this.plats());
  }

  draw() {
    const c = this.ctx, cam = this.camX(), r = this.room;
    c.setTransform(this.s, 0, 0, this.s, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, BG[r][0]); g.addColorStop(1, BG[r][1]);
    c.fillStyle = g; c.fillRect(0, 0, this.W, H);
    
    c.save(); c.translate(-cam, 0);
    const bg = img(['', 'fon1.png', 'fon22.png', 'room 3.png'][r]);
    if (bg) c.drawImage(bg, 0, 0, ROOM_W[r], H);
    else { c.fillStyle = r === 1 ? '#5fae5f' : '#3a2f4d'; c.fillRect(0, GROUND, ROOM_W[r], H - GROUND); }

    for (const d of DOORS[r]) {
      const di = img(DOOR_IMG[d.id]);
      if (di) { 
        const scale = d.scale || 1;
        const h = 400 * scale; 
        const w = di.naturalWidth * h / di.naturalHeight; 
        const yOffset = d.up || 0; 
        c.drawImage(di, d.x - w / 2, GROUND - h - yOffset, w, h); 
        continue; 
      }
      c.fillStyle = d.id === 'd2' ? (this.f.doorOpen ? '#4caf50' : '#b03a3a') : '#8a5a2b';
      c.fillRect(d.x - 45, GROUND - 190, 90, 190);
      c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(d.x + 28, GROUND - 95, 5, 0, 7); c.fill();
    }
    
    c.textAlign = 'center'; c.font = '46px serif';
    for (const t of this.things) {
      if (t.room !== r || t.taken) continue;
      const ti = img(THING_IMG[t.id]);
      if (ti) { 
        const baseH = THING_H[t.id];
        const s = t.scale || 1; 
        const h = baseH * s; 
        const w = ti.naturalWidth * h / ti.naturalHeight; 
        c.drawImage(ti, t.x - w / 2, GROUND - t.up - h / 2, w, h); 
      }
      else c.fillText(t.ch, t.x, GROUND - t.up + 16);
    }
    
    if (r === 2 && this.f.hung) {
      const wallCards = [
        { img: 'leave.png', x: 280, y: 90 },   
        { img: 'cat.png', x: 390, y: 140 },    
        { img: 'house.png', x: 500, y: 80 }    
      ];
      wallCards.forEach(item => {
        const ci = img(item.img);
        if (ci) {
          const h = 140, w = ci.naturalWidth * h / ci.naturalHeight;
          c.drawImage(ci, item.x - w/2, item.y - h/2, w, h);
        }
      });
    }
    
    this.p.draw(c);
    
    if (this.msgT > 0) {
      c.font = '20px system-ui'; 
      
      const lines = this.msg.split('\n');
      let maxW = 0;
      lines.forEach(line => {
        const w = c.measureText(line).width;
        if (w > maxW) maxW = w;
      });
      
      const boxW = maxW + 24;
      const boxH = lines.length * 24 + 10;
      const startY = this.p.y - 140 - (lines.length - 1) * 24;

      c.fillStyle = 'rgba(255,255,255,0.9)'; 
      c.fillRect(this.p.x - boxW / 2, startY, boxW, boxH);
      
      c.fillStyle = '#222'; 
      lines.forEach((line, i) => {
        c.fillText(line, this.p.x, startY + 20 + i * 24);
      });
    }
    c.restore();

    c.textAlign = 'left'; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, this.W, 38);
    c.fillStyle = '#fff'; c.font = '20px system-ui';
    c.fillText('Инвентарь: ' + this.inv.join(', '), 12, 26);
    
    const timeLeft = Math.max(0, 120 - Math.floor(this.time));
    c.textAlign = 'center';
    if (timeLeft <= 20) {
      c.fillStyle = (Math.floor(this.time * 2) % 2 === 0) ? '#ff4a4a' : '#fff'; 
    } else {
      c.fillStyle = '#fff';
    }
    c.fillText(`⏱ ${Math.floor(this.time)} / 120 c`, this.W / 2, 26);

    if (this.hang) {
      const cx = this.W / 2;
      c.fillStyle = 'rgba(20,18,40,.94)'; c.fillRect(cx - 280, 70, 560, 400);
      c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '26px system-ui';
      c.fillText('Повесь картины по порядку', cx, 112); 
      c.fillText('✕', cx + 255, 108);
      
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const x = cx + (i - 1.5) * 120;
        c.strokeRect(x - 45, 150, 90, 100);
        
        if (i === 3) {
           const fi = img('flowerprint.png');
           if (fi) {
             const h = 80, w = fi.naturalWidth * h / fi.naturalHeight;
             c.drawImage(fi, x - w/2, 150 + 50 - h/2, w, h);
           } else {
             c.fillText('🌸', x, 215);
           }
        } else if (this.slots[i]) {
           const card = CARDS.find(k => k.id === this.slots[i]);
           const ci = img(card.img);
           if (ci) {
             const h = 80, w = ci.naturalWidth * h / ci.naturalHeight;
             c.drawImage(ci, x - w/2, 150 + 50 - h/2, w, h);
           }
        }
      }
      
      CARDS.forEach((k, i) => {
        if (!this.slots.includes(k.id)) {
          const x = cx + (i - 1) * 150;
          const y = 390;
          c.fillStyle = 'rgba(255,255,255,0.1)';
          c.fillRect(x - 45, y - 45, 90, 90);
          
          const ci = img(k.img);
          if (ci) {
            const h = 80, w = ci.naturalWidth * h / ci.naturalHeight;
            c.drawImage(ci, x - w/2, y - h/2, w, h);
          }
        }
      });

      c.font = '18px system-ui'; c.fillStyle = '#fff';
      c.fillText('Нажимай на картины, чтобы повесить их в раму по порядку.', cx, 330);
      c.fillStyle = '#ffb4b4'; c.fillText(this.hangMsg, cx, 452);
    }
    if (this.box) {
      c.fillStyle = '#2b2740'; c.fillRect(this.W / 2 - 220, 170, 440, 200);
      c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '30px system-ui';
      c.fillText('Введите пароль:', this.W / 2, 225);
      c.font = '56px monospace'; c.fillText(this.code.padEnd(4, '_'), this.W / 2, 300);
      c.font = '16px system-ui'; c.fillText('Enter — ввод, Esc — отмена', this.W / 2, 345);
    }
  }
}
