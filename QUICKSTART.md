# 🚀 Quick Start Guide - BitLab

Get BitLab running locally in <5 minutes.

---

## Prerequisites

- **Node.js 14+** or **Python 3.7+** (for local server)
- **Modern Browser:** Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- **Git** (optional, if cloning repo)

---

## Option 1: Run with Python (Easiest)

```bash
# Navigate to project
cd c:\Users\pedro\Desktop\Codigos\ProjetoSap

# Start server
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

**Stop server:** `Ctrl+C`

---

## Option 2: Run with Node.js

```bash
# Navigate to project
cd c:\Users\pedro\Desktop\Codigos\ProjetoSap

# Install http-server globally (one-time)
npm install -g http-server

# Start server
http-server -p 8000

# Open in browser
# http://localhost:8000
```

---

## Option 3: VS Code Live Server

1. Install "Live Server" extension (ms-vscode.live-server)
2. Right-click `index.html` → "Open with Live Server"
3. Browser opens at `http://127.0.0.1:5500`

---

## ✅ Verify Installation

After opening `http://localhost:8000`, check:

1. **Page Loads**
   - Home page (`home.html`) renders
   - No console errors (F12)

2. **Modules Loaded**
   ```javascript
   // In browser console (F12):
   console.log(window.quizAnalytics);   // should be defined
   console.log(window.userProfile);     // should be defined
   console.log(window.telemetry);       // should be defined
   ```

3. **Service Worker Registered**
   - F12 → Application → Service Workers
   - Should show `/service-worker.js` as "activated and running"

4. **LocalStorage Available**
   - F12 → Application → Local Storage → http://localhost:8000
   - Should have empty or existing entries

---

## 🎮 Test Features

### Try Quiz
1. Navigate to `http://localhost:8000/quiz.html`
2. Click "Jogar Novamente" (Start Quiz)
3. Answer 5 questions
4. After quiz, verify:
   - `#analytics-report` shows report card
   - `#profile-card` shows user stats
   - localStorage has `user_profile` + `quiz_session_history`

### Try Offline
1. F12 → Network tab
2. Checkbox "Offline"
3. Reload page
4. Page should load from cache
5. Quiz should work (with empty questions fallback)

### Try Accessibility
1. Open `http://localhost:8000/index.html`
2. Click on hardware-diagram
3. Press `→` (right arrow)
4. Component should highlight

---

## 📁 Project Structure

```
ProjetoSap/
├── index.html ..................... Main emulator page
├── quiz.html ...................... Quiz game
├── home.html ...................... Landing page
├── oqueesap.html .................. Educational content
├── manifest.json .................. PWA config (new)
├── service-worker.js .............. Offline cache (new)
│
├── assets/
│   ├── js/
│   │   ├── script.js .............. Emulator logic
│   │   ├── quiz.js ................ Quiz game
│   │   ├── sw-register.js ......... Service Worker register (new)
│   │   │
│   │   ├── modules/ (NEW)
│   │   │   ├── asset-loader.js
│   │   │   ├── quiz-analytics.js
│   │   │   ├── user-profile.js
│   │   │   ├── accessibility.js
│   │   │   ├── challenge-scaffolding.js
│   │   │   └── telemetry.js
│   │   │
│   │   ├── core/
│   │   │   ├── emulator-core.js
│   │   │   ├── assembler-core.js
│   │   │   └── memory-store.js
│   │   │
│   │   └── workers/
│   │       ├── emulator.worker.js
│   │       └── assembler.worker.js
│   │
│   ├── css/
│   │   ├── base.css
│   │   ├── emular.css
│   │   ├── quiz.css (modified with new styles)
│   │   └── style.css
│   │
│   ├── data/
│   │   ├── questions.json (100+ questions)
│   │   └── achievements.json
│   │
│   ├── audio/
│   │   ├── quiz_correct.ogg
│   │   ├── quiz_wrong.ogg
│   │   └── brute_force_loop.mp3
│   │
│   └── img/
│       └── ... (emulator components, icons, etc)
│
└── docs/
    ├── COMPLETION_SUMMARY.md .... Executive summary (new)
    ├── API_REFERENCE.md ......... Developer API docs (new)
    ├── IMPLEMENTATION_ROADMAP.md  Project plan (new)
    └── TESTING_GUIDE.md ......... Test procedures (new)
```

---

## 🐛 Troubleshooting

### "Service Worker not registered"
- **Cause:** HTTP on localhost (Chrome blocks SW on HTTP)
- **Fix:** Use `http://127.0.0.1:8000` instead of `http://localhost:8000`
- **Or:** Use HTTPS (create self-signed cert)

### "Modules undefined (quizAnalytics, etc)"
- **Cause:** Script loading order or CORS
- **Fix:** 
  1. Check F12 → Network tab
  2. Verify `modules/*.js` load successfully (200 status)
  3. Clear browser cache (Ctrl+Shift+Delete) and reload

### "LocalStorage not working"
- **Cause:** Private browsing mode or storage quota exceeded
- **Fix:**
  1. Open in normal (non-incognito) mode
  2. Clear localStorage: `localStorage.clear()`

### "Audio not playing"
- **Cause:** Browser muted or autoplay policy
- **Fix:**
  1. Unmute browser tab (icon in address bar)
  2. Interact with page first (click button)
  3. Check DevTools → Application → Permissions → Audio

### "Quiz loads slow"
- **Cause:** Network condition or large questions.json
- **Fix:** 
  1. Reload page (should be cached on 2nd load)
  2. Check Network tab for slow requests
  3. Verify Service Worker is cached (Application → Cache Storage)

---

## 📊 Available Pages

| URL | Purpose |
|-----|---------|
| `/index.html` | SAP-1 Emulator + Desafios |
| `/quiz.html` | Interactive Quiz Game |
| `/home.html` | Landing Page |
| `/oqueesap.html` | Educational Content (O que é SAP-1) |
| `/equipesap.html` | Team Page |
| `/privacy.html` | Privacy Policy |
| `/terms.html` | Terms of Service |

---

## 🎯 Fun Things to Try

1. **Heatmap Analysis**
   ```javascript
   window.quizAnalytics.finishSession(10, 7);
   // See which topics you struggled with
   ```

2. **Level Progression**
   - Play quiz 5 times
   - Check your level in profile card
   - Level increases with more answers

3. **Offline Mastery**
   1. Enable offline mode
   2. Start quiz
   3. Notice questions are empty (fallback)
   4. Verify UI still works

4. **Screen Reader**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Navigate emulator with arrow keys
   - Hear PC/ACC/T-state announcements

5. **Keyboard Navigation**
   - Skip mouse, use Tab + arrows
   - `←↑→↓` in emulator to select components
   - `Tab` in quiz to select answers

---

## 📱 Mobile Testing

### Android (Chrome)
1. Open on Android device: `http://<your-pc-ip>:8000`
2. Wait 3-5 seconds
3. "Install app" banner appears
4. App works offline with full PWA features

### iOS (Safari)
1. Open on iOS device: `http://<your-pc-ip>:8000`
2. Share → "Add to Home Screen"
3. App opens fullscreen
4. Offline fallback works

**Get PC IP:**
```bash
# Windows (PowerShell)
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep inet
```

Then visit: `http://<IP>:8000`

---

## 🚢 Deploy to Production

### Using Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd c:\Users\pedro\Desktop\Codigos\ProjetoSap
vercel

# Follow prompts, choose production
```

### Using GitHub Pages

```bash
# 1. Create GitHub repo
# 2. Push to GitHub
git init
git add .
git commit -m "BitLab mit 6 features"
git branch -M main
git remote add origin https://github.com/YOUR_USER/bitlab.git
git push -u origin main

# 3. Enable GitHub Pages in Settings
#    Source: main branch / root folder
```

### Using Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["npx", "http-server", "-p", "8000"]
```

```bash
docker build -t bitlab .
docker run -p 8000:8000 bitlab
```

---

## 🔍 Performance Tips

1. **First Load Optimization**
   - Use Chrome Lighthouse (F12 → Lighthouse)
   - Target score: >85 (PWA)
   - Should be <2s Time to Interactive

2. **Caching Strategy**
   - Service Worker caches on first visit
   - 2nd visit: 100% cached (instant load)
   - Stale-while-revalidate: background updates

3. **Lazy Loading**
   - Audit SFX files load only when needed
   - Check DevTools Network for `quiz_correct.ogg`
   - Solution on quiz page save ~200-300ms

---

## 📞 Support

- **Documentation:** See IMPLEMENTATION_ROADMAP.md
- **API Reference:** See API_REFERENCE.md
- **Testing:** See TESTING_GUIDE.md
- **Issues:** File in GitHub Issues with:
  - Browser + OS
  - Console error (F12)
  - Steps to reproduce

---

## ✅ Next Steps

After successful run:

1. [ ] Read COMPLETION_SUMMARY.md (5 min)
2. [ ] Try each feature (quiz, offline, keyboard, etc)
3. [ ] Run tests from TESTING_GUIDE.md (30 min)
4. [ ] Review code in `modules/` folder
5. [ ] Deploy to staging (Vercel optional)
6. [ ] Collect user feedback

---

**Happy learning!** 🚀

---

**Last Updated:** Jan 2025 | **Version:** 1.0
