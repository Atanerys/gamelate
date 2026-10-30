export const GROUND = 450;

// Приземление сверху: учитываем прежнее (prev) и новое положение ног
export function landOn(p, prev, plats) {
  for (const pl of plats) {
    if (p.vy >= 0 && prev <= pl.y + 0.5 && p.y >= pl.y &&
        p.x + p.w / 2 > pl.x && p.x - p.w / 2 < pl.x + pl.w) {
      p.y = pl.y; p.vy = 0; p.onGround = true;
    }
  }
}

export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
