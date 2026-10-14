// ColorGeek colour maths, shared by the popup and the background. No network, no libraries.
(function (root) {
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const hex2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();

  // Accepts "#rgb", "#rrggbb", "#rrggbbaa", "rgb(r, g, b)" or "rgba(...)". Returns "#RRGGBB" or null.
  function normalise(input) {
    if (typeof input !== 'string') return null;
    let s = input.trim();
    let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      return '#' + h.slice(0, 6).toUpperCase();
    }
    m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (m) return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]);
    return null;
  }

  function toRgb(hex) {
    const h = normalise(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function toHsl(hex) {
    const [r, g, b] = toRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
  }

  function format(hex, kind) {
    hex = normalise(hex);
    if (!hex) return '';
    if (kind === 'rgb') { const [r, g, b] = toRgb(hex); return `rgb(${r}, ${g}, ${b})`; }
    if (kind === 'hsl') { const [h, s, l] = toHsl(hex); return `hsl(${h}, ${s}%, ${l}%)`; }
    return hex;
  }

  // WCAG 2 relative luminance and contrast ratio.
  function luminance(hex) {
    const c = toRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  // Ratio shown to 2 decimal places, rounded down so a colour never looks like it passes when it does not.
  const ratioText = (r) => (Math.floor(r * 100) / 100).toFixed(2) + ':1';
  function grade(r) {
    if (r >= 7) return 'AAA';
    if (r >= 4.5) return 'AA';
    if (r >= 3) return 'AA large';
    return 'Fail';
  }

  const MAX = 24;
  function addToHistory(list, hex, now = Date.now()) {
    hex = normalise(hex);
    if (!hex) return list || [];
    const out = (list || []).filter((c) => c.hex !== hex);
    out.unshift({ hex, t: now });
    return out.slice(0, MAX);
  }

  function exportCss(list) {
    const lines = (list || []).map((c, i) => `  --color-${i + 1}: ${c.hex};`);
    return `:root {\n${lines.join('\n')}\n}\n`;
  }
  function exportJson(list) {
    return JSON.stringify({ colors: (list || []).map((c) => ({ hex: c.hex, rgb: format(c.hex, 'rgb'), hsl: format(c.hex, 'hsl') })) }, null, 2) + '\n';
  }

  root.CG = { normalise, toRgb, toHsl, format, luminance, contrast, ratioText, grade, addToHistory, exportCss, exportJson, MAX };
})(typeof self !== 'undefined' ? self : this);
