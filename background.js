// ColorGeek background. Saves picked colours and starts the page magnifier (used by the keyboard shortcut,
// the right-click menu, Firefox, and any browser without the EyeDropper API). Nothing is sent anywhere.
if (typeof CG === 'undefined' && typeof importScripts === 'function') importScripts('colors.js');

const MENU_ID = 'colorgeek-pick';

function makeMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: 'Pick a colour', contexts: ['page', 'image', 'link', 'selection', 'frame', 'video'] }, () => void chrome.runtime.lastError);
  });
}
chrome.runtime.onInstalled.addListener(makeMenu);
chrome.runtime.onStartup.addListener(makeMenu);

// Adds a colour to the front of the history (no duplicates, newest first, up to 24).
async function savePick(hex) {
  hex = CG.normalise(hex);
  if (!hex) return null;
  const { history = [] } = await chrome.storage.local.get('history');
  await chrome.storage.local.set({ history: CG.addToHistory(history, hex) });
  return hex;
}

async function flashError(tabId) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#C62828', tabId });
    await chrome.action.setBadgeText({ text: '!', tabId });
    await chrome.action.setTitle({ title: 'ColorGeek cannot read this page. Try it on a normal web page.', tabId });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});
      chrome.action.setTitle({ title: 'ColorGeek: pick a colour', tabId }).catch(() => {});
    }, 4000);
  } catch {}
}

// Takes a picture of the visible part of the tab, then shows the magnifier over the page so the user can click a pixel.
async function startMagnifier(tab) {
  try {
    if (!tab || tab.id == null) {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No tab to pick from');
    }
    if (!tab.active) throw new Error('That tab is not on screen');
    const { format = 'hex' } = await chrome.storage.local.get('format');
    const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['picker.js'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (u, f) => window.__colorGeekPick(u, f), args: [shot, format] });
    return { ok: true };
  } catch (e) {
    if (tab && tab.id != null) await flashError(tab.id);
    return { ok: false, error: String((e && e.message) || e) };
  }
}

function onMenu(info, tab) { if (info.menuItemId === MENU_ID) return startMagnifier(tab); }
function onCommand(command, tab) { if (command === 'pick-colour') return startMagnifier(tab); }
chrome.contextMenus.onClicked.addListener(onMenu);
chrome.commands.onCommand.addListener(onCommand);

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'picked') {
    savePick(msg.hex).then((hex) => reply({ ok: !!hex, hex }));
    return true;
  }
  if (msg.type === 'magnify') {
    // only from our own popup, never from a page
    if (!sender.url || !sender.url.startsWith(chrome.runtime.getURL(''))) return;
    const get = msg.tabId != null ? chrome.tabs.get(msg.tabId) : chrome.tabs.query({ active: true, currentWindow: true }).then((t) => t[0]);
    get.then((tab) => startMagnifier(tab)).then(reply, (e) => reply({ ok: false, error: String(e) }));
    return true;
  }
});
