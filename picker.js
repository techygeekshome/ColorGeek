// ColorGeek page magnifier. Added to the page only when you start a pick. It shows a zoomed view of a picture of the
// visible page that the browser took a moment ago, so you can click the exact pixel you want. Nothing leaves the page.
(() => {
  if (window.__colorGeekPick) return;
  let active = null;

  const fmtHex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  function format(hex, kind) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    if (kind === 'rgb') return `rgb(${r}, ${g}, ${b})`;
    if (kind === 'hsl') {
      const R = r / 255, G = g / 255, B = b / 255, max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60;
      }
      return `hsl(${Math.round(h) % 360}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    return hex;
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    (document.body || document.documentElement).appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); return ok;
  }

  const CSS = `
    :host { all: initial; }
    .cover { position: fixed; inset: 0; cursor: crosshair; background: transparent; }
    .lens { position: fixed; left: 0; top: 0; pointer-events: none; display: none; filter: drop-shadow(0 6px 18px rgba(0,0,0,.35)); }
    canvas { display: block; width: 132px; height: 132px; border-radius: 50%; border: 3px solid #fff; background: #fff; }
    .tag { margin: 8px auto 0; display: flex; align-items: center; gap: 7px; width: max-content; max-width: 220px; padding: 5px 10px 5px 6px; border-radius: 999px;
      background: #17171c; color: #fff; font: 600 12px/1.2 ui-monospace, Consolas, monospace; }
    .sw { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff; flex: none; }
    .hint { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); pointer-events: none; padding: 9px 16px; border-radius: 999px;
      background: rgba(23,23,28,.92); color: #fff; font: 500 13px/1.3 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; white-space: nowrap; }
    .hint b { color: #f0abfc; }
  `;

  function open(dataUrl, kind) {
    const host = document.createElement('colorgeek-picker');
    host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647;';
    const root = host.attachShadow({ mode: 'open' });
    const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; parent.appendChild(e); return e; };
    el('style', '', root, CSS);
    el('div', 'cover', root);
    const hint = el('div', 'hint', root);
    el('b', '', hint, 'ColorGeek'); hint.append('\u00a0 Click to pick a colour. Arrow keys move 1 pixel, Enter picks, Esc cancels.');
    const lensBox = el('div', 'lens', root);
    const cnv = el('canvas', '', lensBox); cnv.width = 132; cnv.height = 132;
    const tag = el('div', 'tag', lensBox); el('span', 'sw', tag); el('span', 'val', tag);
    document.documentElement.appendChild(host);
    const cover = root.querySelector('.cover'), lens = root.querySelector('.lens'), cv = root.querySelector('canvas');
    const sw = root.querySelector('.sw'), val = root.querySelector('.val');
    const c2 = cv.getContext('2d');
    let data = null, W = 0, H = 0, sx = 1, sy = 1, px = -1, py = -1, closed = false;

    const at = (x, y) => {
      const i = (y * W + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    function draw() {
      if (!data || px < 0) return;
      const N = 11, C = 12, half = 5;
      c2.clearRect(0, 0, 132, 132);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = px + i - half, y = py + j - half;
        if (x < 0 || y < 0 || x >= W || y >= H) { c2.fillStyle = '#ddd'; } else { const [r, g, b] = at(x, y); c2.fillStyle = `rgb(${r},${g},${b})`; }
        c2.fillRect(i * C, j * C, C, C);
      }
      c2.strokeStyle = 'rgba(0,0,0,.08)'; c2.lineWidth = 1;
      for (let k = 1; k < N; k++) { c2.beginPath(); c2.moveTo(k * C + .5, 0); c2.lineTo(k * C + .5, 132); c2.moveTo(0, k * C + .5); c2.lineTo(132, k * C + .5); c2.stroke(); }
      c2.lineWidth = 2; c2.strokeStyle = '#000'; c2.strokeRect(half * C, half * C, C, C);
      c2.lineWidth = 1; c2.strokeStyle = '#fff'; c2.strokeRect(half * C - 1.5, half * C - 1.5, C + 3, C + 3);
      const hex = fmtHex(...at(px, py));
      sw.style.background = hex; val.textContent = format(hex, kind);
      host.dataset.hex = hex; host.dataset.pos = px + ',' + py;
      // place the lens next to the pointer, flipping near the edges
      const cx = px / sx, cy = py / sy, lw = 140, lh = 175;
      let lx = cx + 22, ly = cy + 22;
      if (lx + lw > innerWidth) lx = cx - 22 - lw;
      if (ly + lh > innerHeight) ly = cy - 22 - lh;
      lens.style.transform = `translate(${Math.max(4, lx)}px, ${Math.max(4, ly)}px)`;
      lens.style.display = 'block';
    }
    let lastX = null, lastY = null;
    function moveTo(clientX, clientY) {
      lastX = clientX; lastY = clientY;
      if (!data) return;
      px = Math.min(W - 1, Math.max(0, Math.floor(clientX * sx)));
      py = Math.min(H - 1, Math.max(0, Math.floor(clientY * sy)));
      draw();
    }
    function close() {
      if (closed) return; closed = true;
      removeEventListener('keydown', onKey, true); removeEventListener('resize', close); removeEventListener('wheel', onWheel, { capture: true });
      host.remove(); if (active && active.close === close) active = null;
    }
    function pick() {
      if (!data || px < 0) return;
      const hex = fmtHex(...at(px, py)), text = format(hex, kind);
      close();
      const copied = copy(text);
      copied.then((ok) => toast(hex, text, ok));
      chrome.runtime.sendMessage({ type: 'picked', hex }).catch(() => {});
    }
    function onKey(e) {
      const step = e.shiftKey ? 10 : 1;
      const k = e.key;
      if (k === 'Escape') close();
      else if (k === 'Enter' || k === ' ') pick();
      else if (k === 'ArrowLeft') { px = Math.max(0, px - step); draw(); }
      else if (k === 'ArrowRight') { px = Math.min(W - 1, px + step); draw(); }
      else if (k === 'ArrowUp') { py = Math.max(0, py - step); draw(); }
      else if (k === 'ArrowDown') { py = Math.min(H - 1, py + step); draw(); }
      else return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }
    const onWheel = (e) => e.preventDefault();
    cover.addEventListener('mousemove', (e) => moveTo(e.clientX, e.clientY));
    cover.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
    cover.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); moveTo(e.clientX, e.clientY); pick(); });
    cover.addEventListener('contextmenu', (e) => { e.preventDefault(); close(); });
    addEventListener('keydown', onKey, true);
    addEventListener('wheel', onWheel, { capture: true, passive: false });
    addEventListener('resize', close);

    (async () => {
      // decode the data: URL by hand (no fetch), so a strict page Content-Security-Policy cannot block it
      const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });
      const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      W = bmp.width; H = bmp.height; sx = W / innerWidth; sy = H / innerHeight;
      // the picture should match the window; if its shape is off (a bar over the page), trust the width
      if (Math.abs(sx - sy) > 0.02 * sx) sy = sx;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(bmp, 0, 0); data = g.getImageData(0, 0, W, H).data;
      host.dataset.ready = '1'; host.dataset.size = W + 'x' + H + '@' + innerWidth + 'x' + innerHeight;
      if (lastX != null) moveTo(lastX, lastY);
    })().catch(() => close());

    return { close };
  }

  function toast(hex, text, ok) {
    const old = document.querySelector('colorgeek-toast'); if (old) old.remove();
    const t = document.createElement('colorgeek-toast');
    t.style.cssText = 'all: initial; position: fixed; right: 18px; bottom: 18px; z-index: 2147483647;';
    const r = t.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
      .t { display: flex; align-items: center; gap: 10px; padding: 10px 14px 10px 10px; border-radius: 12px; background: #17171c; color: #fff;
        font: 500 13px/1.3 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,.3); }
      .s { width: 30px; height: 30px; border-radius: 8px; border: 2px solid #fff; }
      code { font: 600 13px ui-monospace, Consolas, monospace; }
      small { display: block; color: #b9b9c6; font-size: 11px; }
    </style><div class="t"><span class="s"></span><div><small></small><code></code></div></div>`;
    r.querySelector('.s').style.background = hex;
    r.querySelector('small').textContent = ok ? 'ColorGeek: copied' : 'ColorGeek: saved to your colours';
    r.querySelector('code').textContent = text;
    t.dataset.text = text; t.dataset.copied = ok ? '1' : '0';
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  window.__colorGeekPick = (dataUrl, kind) => {
    if (active) active.close();
    active = open(dataUrl, kind || 'hex');
  };
})();
