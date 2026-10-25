<div align="center">

<img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/icons/icon128.png" alt="ColorGeek logo" width="96" height="96">

# ColorGeek: Color Picker

**Pick any colour on your screen and copy it as HEX, RGB or HSL. Keeps your recent colours, checks contrast and exports a palette.**

[![Version](https://img.shields.io/github/v/release/techygeekshome/ColorGeek?label=version&color=4c9bff)](https://github.com/techygeekshome/ColorGeek/releases)
[![Platform](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Firefox-0078d4)](#%EF%B8%8F-download--install)
[![License](https://img.shields.io/badge/license-GPL--3.0-3fb950)](LICENSE)
[![Made by TechyGeeksHome](https://img.shields.io/badge/made%20by-TechyGeeksHome-b191f2)](https://techygeekshome.info)
[![Support on Ko-fi](https://img.shields.io/badge/support-Ko--fi-ff5e5b)](https://ko-fi.com/techygeekshome)

[Download](#%EF%B8%8F-download--install) · [Features](#-what-it-does) · [Privacy](#-privacy) · [Full guide](https://techygeekshome.info/browser-extensions/colorgeek/) · [License](#-license)

</div>

---

## 🎬 See it in action

[![ColorGeek demo video](https://img.youtube.com/vi/zBSL4crCjPw/maxresdefault.jpg)](https://www.youtube.com/watch?v=zBSL4crCjPw)

---

Pick any colour on your screen and copy it as HEX, RGB or HSL. ColorGeek keeps your recent colours, checks contrast against white and black, and exports your palette as CSS variables or JSON.

The full guide, with every step explained, is on [TechyGeeksHome](https://techygeekshome.info/browser-extensions/colorgeek/).

## 📸 Screenshots

<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-contrast.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-export.jpg" width="49%" />
</p>
<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-magnifier.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-page.jpg" width="49%" />
</p>
<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-picked.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/ColorGeek/main/screenshots/colorgeek-popup.jpg" width="49%" />
</p>

## ✨ What it does

- **Pick a colour anywhere on screen** in Chrome, Edge, Brave, Opera and Vivaldi, using the browser's own eyedropper.
- **Page magnifier** in every browser, Firefox included: a zoomed view follows your pointer so you can click the exact pixel. Arrow keys move one pixel at a time, Enter picks, Esc cancels.
- **Copied as you pick** in the format you choose (HEX, RGB or HSL), with one-click Copy buttons for the other two.
- **Contrast check** against white and black, with the WCAG ratio and whether it passes AA, AAA or large text only.
- **Your colours**: the last 24 picks, newest first, with no duplicates. Click one to see it again and copy it.
- **Export** your colours as CSS variables or JSON: copy the text or save it as a file.
- **Keyboard shortcut** (Alt+Shift+E) and a **"Pick a colour"** item on the right-click menu, both open the magnifier on the page.

## 🚫 What it won't do

- Firefox has no eyedropper for add-ons, so in Firefox you pick from the page you are on (with the magnifier), not from other apps.
- It cannot pick from browser pages such as settings, new tab pages or the add-on stores. The icon shows a red "!" if you try.
- The magnifier works from a picture of the page taken when you start, so moving parts (videos, animations) are picked as they were at that moment.

## ⬇️ Download & install

Pick the download for your browser from the [latest release](https://github.com/techygeekshome/ColorGeek/releases/latest).

| Browser | Download |
|---|---|
| Chrome, Brave, Opera, Vivaldi | `ColorGeek-chrome.zip` |
| Microsoft Edge | `ColorGeek-edge.zip` |
| Firefox (142 or newer) | `ColorGeek-firefox.zip` |

`ColorGeek.zip` is the same package as the Chrome and Edge downloads.

### Chrome, Edge, Brave, Opera and Vivaldi

1. Unzip the download somewhere you'll keep it.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `colorgeek` folder.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and pick `ColorGeek-firefox.zip`.

Firefox removes temporary add-ons when it closes.

### Build it yourself

The code in this repo is the Chromium version. `manifest.firefox.json` is the Firefox manifest. Run `./build.sh` to make every package in `dist/`.

## 🧭 How to use

1. Click the ColorGeek icon and press **Pick a colour**.
2. Click the colour you want. It is copied straight away in the format you picked under **Copy as I pick**.
3. Use the **Copy** buttons for the other formats, and check the contrast boxes if the colour is for text.
4. Press **Export CSS** or **Export JSON** to take your colours with you.
5. On any page, press **Alt+Shift+E** (or right-click and choose **Pick a colour**) to open the magnifier.

You can change the shortcut at `chrome://extensions/shortcuts` (Chrome and Edge) or in Firefox's add-ons page under **Manage Extension Shortcuts**.

## ⚙️ How it works

- `popup.js` uses the browser's EyeDropper when there is one. Otherwise, and for the shortcut and the right-click menu, `background.js` takes a picture of the visible part of the tab and adds `picker.js` to the page.
- `picker.js` shows the magnifier over the page and reads the pixel you click from that picture. It is only added when you start a pick, and it removes itself straight after.
- `colors.js` does the colour maths: HEX, RGB and HSL, the WCAG contrast ratio, the history list and the exports.
- There are no libraries and nothing is loaded from the internet.

## 🔑 Permissions

- `activeTab`: lets ColorGeek see the tab you are on, only after you click its icon, press its shortcut or use its menu item.
- `scripting`: adds the magnifier to that page when you start a pick.
- `storage`: keeps your colours and your chosen format on your computer.
- `contextMenus`: adds "Pick a colour" to the right-click menu.
- `clipboardWrite`: copies the colour for you, even when picking takes a few seconds.

## 🔒 Privacy

ColorGeek has no account, no analytics and sends nothing anywhere. The picture of the page used by the magnifier stays in that page's memory and is thrown away as soon as you pick or cancel. Your colours are stored on your own computer.

## ☕ Support

ColorGeek is free and always will be. If it saved you some time, you can [buy us a coffee on Ko-fi](https://ko-fi.com/techygeekshome). Welcome, but never expected.

## 🐛 Support & contributing

Found a bug or have a request? [Open an issue](https://github.com/techygeekshome/ColorGeek/issues) or [get in touch](https://techygeekshome.info/contact/). Pull requests are welcome.

## 📄 License

GPL-3.0. Free for everyone, including commercial use.

ColorGeek is an independent tool made by [TechyGeeksHome](https://techygeekshome.info).

© 2026 TechyGeeksHome.

---

<div align="center">

Made with ❤️ by [**TechyGeeksHome**](https://techygeekshome.info)

[Website](https://techygeekshome.info) · [YouTube](https://www.youtube.com/channel/UCtEuFj1SMLiuRoucD1hv8dA) · [X](https://x.com/TechyGeeks1) · [Instagram](https://www.instagram.com/andrewarmstrongtgh/)

</div>
