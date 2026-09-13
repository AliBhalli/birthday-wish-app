# 🎂 A Little Birthday Surprise

A light, interactive birthday web application crafted with HTML, CSS, and JavaScript. It provides a interactive journey featuring animated balloons, customizable gift reveals, an interactive cake, mini-games, fireworks, music, and custom messages.

---

## ✨ Features

* **Interactive Elements:** Gift reveals, customizable cake decoration, catch-the-gifts mini-game, and an interactive wish gallery.
* **Visual & Sound:** Animated balloons, confetti, fireworks celebrations, and browser-generated background music/SFX (Web Audio API).
* **Technical Highlights:** Static hosting compatible, mobile-friendly design, reduced-motion support, local high-score storage, and zero dependencies/build steps.

---

## 🎨 Journey Overview

```text
Welcome ➔ Gift Reveal ➔ Birthday Balloons ➔ Decorate Cake ➔ Mini-Game ➔ Wish Gallery ➔ Fireworks ➔ Final Card

```

---

## 🚀 Quick Setup Guide

Edit `app.js` to personalize the experience:

### 1. Basic Details

Modify the configuration block at the top of `app.js`:

```javascript
const CONFIG = {
  NAME: "Sarah", // Recipient's Name
  FROM: "Alex",   // Your Name
  SHOW_NAME_ON_FINAL: true,
  REDUCED_MOTION: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

```

### 2. Custom Messages

Update the text arrays in `app.js`:

* **Balloon Wishes:** `const BALLOON_WISHES = ["Wish 1", "Wish 2", ...];`
* **Gift Message:** `const GIFT_FIRST_WISH = "Your gift box message...";`
* **Wish Gallery:** `const GALLERY_WISHES = ["Note 1", "Note 2", ...];`

### 3. Website Title (Optional)

In `index.html`, update the `<title>` tag:

```html
<title>Sarah's Birthday Surprise 🎂</title>

```

---

## 📁 Project Structure

```text
birthday-surprise/
├── index.html          # Main website structure
├── app.js              # Interactions, logic, audio, & wishes
├── style.css           # Visual layout & styling
├── manifest.json       # Web app metadata
├── service-worker.js   # Offline support
├── gen_icons.py        # Icon generator utility
└── assets/icons/       # Web icons

```

---

## 💻 Local Testing & Deployment

### Run Locally

Run a local server using Python (recommended due to Service Worker usage):

```bash
python -m http.server 8000

```

Open `http://localhost:8000` in your browser.

### Deploy

Upload all repository files to any static host (GitHub Pages, Vercel, Netlify, Cloudflare Pages). No build processes, backend services, or API keys are required.

---

## 🛠️ Launch Checklist

* [ ] Personalize recipient (`NAME`) and sender (`FROM`) names.
* [ ] Update all wish arrays in `app.js`.
* [ ] Verify page title in `index.html`.
* [ ] Test interactions locally (Gift, Cake, Mini-game, Sound).
* [ ] Check mobile responsiveness.
* [ ] Deploy to host and share the link!

---

## 📜 License & Support

* **License:** Add an open-source license (e.g., MIT) if you'd like others to reuse or distribute your code.
* **Support:** Star or fork this repository on GitHub to build custom versions!

```

```
