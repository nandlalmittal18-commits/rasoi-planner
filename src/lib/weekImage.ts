// Draws the week menu as a table picture (PNG), for sharing on WhatsApp.
// WhatsApp text has no tables, so a picture is the only way to send a real one.

import { MEAL_NAME, weekTable, type FamilyProfile, type WeekPlan } from '../engine';

const C = {
  primary: '#1f3a9e',
  primaryDark: '#172d80',
  haldi: '#ffb703',
  vratSoft: '#fff4d6',
  ink: '#141c2e',
  muted: '#5e6a80',
  line: '#e4e9f2',
  stripe: '#f5f7fc',
  white: '#ffffff',
};
const FONT = 'Outfit, "Hind", system-ui, sans-serif';

const W = 1600;
const PAD = 48;
const DAY_COL = 180;
const CELL_PAD = 18;
const MAIN = 26;
const WITH = 20;

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Make the picture. Fonts are the app's own (bundled), so wait for them first. */
export async function weekImage(plan: WeekPlan, profile: FamilyProfile): Promise<Blob> {
  await Promise.all([document.fonts.load(`700 ${MAIN}px Outfit`), document.fonts.load(`400 ${WITH}px Outfit`)]).catch(() => {});
  const table = weekTable(plan);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const colW = (W - PAD * 2 - DAY_COL) / table.meals.length;
  const textW = colW - CELL_PAD * 2;

  // Measure every cell first so each row is as tall as its longest cell.
  const laid = table.rows.map((row) => {
    const cells = row.cells.map((cell) => {
      if (!cell) return { main: ['–'], with: [] as string[] };
      ctx.font = `700 ${MAIN}px ${FONT}`;
      const main = wrap(ctx, cell.main, textW);
      ctx.font = `400 ${WITH}px ${FONT}`;
      const rest = cell.with.length ? wrap(ctx, `with ${cell.with.join(', ')}${cell.tiffin ? ' · tiffin' : ''}`, textW) : cell.tiffin ? ['tiffin'] : [];
      return { main, with: rest };
    });
    const h = Math.max(
      row.isFast ? 120 : 92,
      ...cells.map((c) => CELL_PAD * 2 + c.main.length * (MAIN + 8) + (c.with.length ? 6 + c.with.length * (WITH + 7) : 0)),
    );
    return { row, cells, h };
  });

  const TITLE_H = 150;
  const HEAD_H = 64;
  const FOOT_H = 70;
  const H = TITLE_H + HEAD_H + laid.reduce((s, r) => s + r.h, 0) + FOOT_H + PAD;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);

  // Title band
  ctx.fillStyle = C.primary;
  ctx.fillRect(0, 0, W, TITLE_H);
  ctx.fillStyle = C.haldi;
  ctx.fillRect(0, TITLE_H - 8, W, 8);
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'Our';
  ctx.fillStyle = C.white;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText(`${who} – week menu`, PAD, 78);
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const range = table.rows.length ? `${table.rows[0].day} to ${table.rows[table.rows.length - 1].day}` : '';
  ctx.fillText(range, PAD, 118);

  // Column heads
  let y = TITLE_H;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('Day', PAD + CELL_PAD, y + 42);
  table.meals.forEach((t, i) => ctx.fillText(MEAL_NAME[t], PAD + DAY_COL + colW * i + CELL_PAD, y + 42));
  y += HEAD_H;

  // Rows
  laid.forEach(({ row, cells, h }, r) => {
    ctx.fillStyle = row.isFast ? C.vratSoft : r % 2 ? C.stripe : C.white;
    ctx.fillRect(PAD, y, W - PAD * 2, h);
    ctx.fillStyle = C.line;
    ctx.fillRect(PAD, y, W - PAD * 2, 2);

    const [wd, ...date] = row.day.split(' ');
    ctx.fillStyle = C.primary;
    ctx.font = `800 28px ${FONT}`;
    ctx.fillText(wd, PAD + CELL_PAD, y + CELL_PAD + 28);
    ctx.fillStyle = C.muted;
    ctx.font = `500 21px ${FONT}`;
    ctx.fillText(date.join(' '), PAD + CELL_PAD, y + CELL_PAD + 58);
    if (row.isFast) {
      ctx.fillStyle = '#8a5a00';
      ctx.font = `700 19px ${FONT}`;
      ctx.fillText('Vrat', PAD + CELL_PAD, y + CELL_PAD + 86);
    }

    cells.forEach((c, i) => {
      const x = PAD + DAY_COL + colW * i + CELL_PAD;
      let ty = y + CELL_PAD + MAIN;
      ctx.fillStyle = C.ink;
      ctx.font = `700 ${MAIN}px ${FONT}`;
      for (const l of c.main) {
        ctx.fillText(l, x, ty);
        ty += MAIN + 8;
      }
      if (c.with.length) {
        ty += 4;
        ctx.fillStyle = C.muted;
        ctx.font = `400 ${WITH}px ${FONT}`;
        for (const l of c.with) {
          ctx.fillText(l, x, ty - 6);
          ty += WITH + 7;
        }
      }
    });
    y += h;
  });
  ctx.fillStyle = C.line;
  ctx.fillRect(PAD, y, W - PAD * 2, 2);

  // Footer
  ctx.fillStyle = C.muted;
  ctx.font = `500 21px ${FONT}`;
  ctx.fillText('Planned with Rasoi Planner · rasoi-planner-eta.vercel.app', PAD, y + 48);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), 'image/png'));
}

export type ShareResult = 'shared' | 'copied' | 'downloaded' | 'cancelled';

/**
 * On a phone: open the share sheet so the picture goes straight to WhatsApp.
 * On a computer: copy the picture, ready to paste into WhatsApp Web (and download it if copying is blocked).
 */
export async function shareWeekImage(plan: WeekPlan, profile: FamilyProfile): Promise<ShareResult> {
  const blob = await weekImage(plan, profile);
  const file = new File([blob], 'rasoi-week-menu.png', { type: 'image/png' });
  const phone = window.matchMedia('(pointer: coarse)').matches;
  if (phone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Week menu' });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return 'copied';
  } catch {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
  }
}
