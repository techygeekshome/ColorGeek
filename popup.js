// ColorGeek popup: pick, copy, contrast, history and export.
const $ = (id) => document.getElementById(id);
const hasDropper = typeof window.EyeDropper === 'function';
let history = [], format = 'hex', selected = null;

function say(text, kind = 'ok') {
  const m = $('msg'); m.textContent = text; m.className = 'msg ' + kind;
  clearTimeout(say.t); if (kind === 'ok') say.t = setTimeout(() => { m.textContent = ''; }, 3500);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch {}
  ta.remove(); return ok;
}

async function targetTab() {
  const id = Number(new URLSearchParams(location.search).get('tab'));
  if (id) return chrome.tabs.get(id);
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t;
}

function render() {
  const cur = selected || (history[0] && history[0].hex);
  $('empty').hidden = !!cur; $('cur').hidden = !cur; $('contrast').hidden = !cur;
  if (cur) {
    $('swatch').style.background = cur;
    $('vHex').textContent = CG.format(cur, 'hex');
    $('vRgb').textContent = CG.format(cur, 'rgb');
    $('vHsl').textContent = CG.format(cur, 'hsl');
    for (const [bg, k] of [['#FFFFFF', 'White'], ['#000000', 'Black']]) {
      const r = CG.contrast(cur, bg), g = CG.grade(r);
      $('s' + k).style.color = cur;
      $('r' + k).textContent = CG.ratioText(r);
      const ge = $('g' + k);
      ge.textContent = g === 'Fail' ? 'Fails WCAG' : g === 'AA large' ? 'AA large text only' : 'Passes ' + g;
      ge.title = 'WCAG 2: AA needs 4.5:1 for normal text and 3:1 for large text. AAA needs 7:1.';
      ge.className = 'g ' + (g === 'Fail' ? 'fail' : g === 'AA large' ? 'part' : 'pass');
    }
  }
  for (const b of $('format').children) b.classList.toggle('on', b.dataset.f === format);
  const grid = $('history'); grid.textContent = '';
  if (!history.length) { const n = document.createElement('div'); n.className = 'none'; n.textContent = 'Colours you pick are kept here (up to 24).'; grid.appendChild(n); }
  for (const c of history) {
    const b = document.createElement('button');
    b.style.background = c.hex; b.title = c.hex; b.dataset.hex = c.hex; b.setAttribute('aria-label', c.hex);
    if (c.hex === cur) b.classList.add('sel');
    grid.appendChild(b);
  }
  $('count').textContent = history.length ? `(${history.length})` : '';
  $('clear').hidden = !history.length;
  $('expCss').disabled = $('expJson').disabled = !history.length;
}

async function load() {
  const s = await chrome.storage.local.get(['history', 'format']);
  history = s.history || []; format = s.format || 'hex';
  if (selected && !history.some((c) => c.hex === selected)) selected = null;
  render();
}

async function picked(hex) {
  const r = await chrome.runtime.sendMessage({ type: 'picked', hex });
  hex = (r && r.hex) || CG.normalise(hex);
  selected = hex; await load();
  const text = CG.format(hex, format);
  say((await copyText(text)) ? `Copied ${text}` : `Saved ${text}. Use a Copy button to copy it.`);
}

async function magnify() {
  const tab = await targetTab();
  const r = await chrome.runtime.sendMessage({ type: 'magnify', tabId: tab && tab.id });
  if (r && r.ok) { if (!new URLSearchParams(location.search).get('tab')) window.close(); else say('Magnifier open on the page.'); }
  else say('ColorGeek cannot pick from this page. Browser pages and add-on stores are off limits, so try it on a normal web page.', 'bad');
}

async function pick() {
  if (!hasDropper) return magnify();
  try {
    const r = await new EyeDropper().open();
    await picked(r.sRGBHex);
  } catch (e) {
    if (e && e.name === 'AbortError') say('Pick cancelled.', 'bad');
    else magnify();
  }
}

$('pick').addEventListener('click', pick);
$('magnify').addEventListener('click', magnify);
$('format').addEventListener('click', async (e) => {
  const f = e.target.dataset.f; if (!f) return;
  format = f; await chrome.storage.local.set({ format }); render();
});
document.querySelector('.vals').addEventListener('click', async (e) => {
  const b = e.target.closest('button.copy'); if (!b) return;
  const cur = selected || history[0].hex, text = CG.format(cur, b.dataset.f);
  if (await copyText(text)) {
    b.textContent = 'Copied'; b.classList.add('done');
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1400);
  }
});
$('history').addEventListener('click', async (e) => {
  const hex = e.target.dataset && e.target.dataset.hex; if (!hex) return;
  selected = hex; render();
  const text = CG.format(hex, format);
  if (await copyText(text)) say(`Copied ${text}`);
});
$('clear').addEventListener('click', async () => {
  const b = $('clear');
  // two clicks, so one slip does not wipe the palette
  if (!b.dataset.sure) {
    b.dataset.sure = '1'; b.textContent = 'Click again to clear all';
    setTimeout(() => { delete b.dataset.sure; b.textContent = 'Clear'; }, 3000);
    return;
  }
  delete b.dataset.sure; b.textContent = 'Clear';
  selected = null; await chrome.storage.local.set({ history: [] }); $('export').hidden = true; document.body.classList.remove('exporting');
});
let expKind = 'css';
function showExport(kind) {
  expKind = kind;
  $('expText').value = kind === 'css' ? CG.exportCss(history) : CG.exportJson(history);
  $('export').hidden = false; document.body.classList.add('exporting');
  $('export').scrollIntoView({ block: 'end', behavior: 'smooth' });
  $('expCss').classList.toggle('on', kind === 'css'); $('expJson').classList.toggle('on', kind === 'json');
}
$('expCss').addEventListener('click', () => showExport('css'));
$('expJson').addEventListener('click', () => showExport('json'));
$('expClose').addEventListener('click', () => { $('export').hidden = true; document.body.classList.remove('exporting'); $('expCss').classList.remove('on'); $('expJson').classList.remove('on'); });
$('expCopy').addEventListener('click', async () => say((await copyText($('expText').value)) ? 'Palette copied.' : 'Could not copy. Select the text and copy it yourself.', 'ok'));
$('expSave').addEventListener('click', () => {
  const blob = new Blob([$('expText').value], { type: expKind === 'css' ? 'text/css' : 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = expKind === 'css' ? 'colorgeek-palette.css' : 'colorgeek-palette.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
});
chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && (ch.history || ch.format)) load(); });

(async () => {
  if (hasDropper) $('magnify').hidden = false;
  else $('hint').textContent = 'Then click any colour on the page.';
  try {
    const cmd = (await chrome.commands.getAll()).find((c) => c.name === 'pick-colour');
    if (cmd && cmd.shortcut) $('shortcut').textContent = `Shortcut: ${cmd.shortcut}`;
  } catch {}
  await load();
})();
