const MAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyE: 'act', Escape: 'pause',
};

export function initInput(game) {
  const held = { left: 0, right: 0 };
  const down = a => { if (a === 'left' || a === 'right') held[a] = 1; else game.press(a); };
  const up = a => { if (a === 'left' || a === 'right') held[a] = 0; };

  addEventListener('keydown', e => {
    if (game.state === 'playing' && (game.box || game.hang) && game.typeKey(e)) { e.preventDefault(); return; }
    const a = MAP[e.code];
    if (!a) return;
    if (game.state === 'playing') e.preventDefault(); // страница не прокручивается
    if (!e.repeat) down(a);
  });
  addEventListener('keyup', e => { const a = MAP[e.code]; if (a) up(a); });

  // экранные кнопки с удержанием
  document.querySelectorAll('[data-k]').forEach(b => {
    const a = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); down(a); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, () => up(a)));
  });

  const clear = () => { held.left = held.right = 0; };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clear(); game.pause(true); } });
  addEventListener('blur', clear);
  return held;
}