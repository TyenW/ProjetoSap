# 🧪 Testing Guide - BitLab 6 Modules

Comprehensive testing procedures for all new features.

---

## 1️⃣ Quiz Analytics & Heatmap

### Test Case 1.1: Basic Heatmap Recording

**Steps:**
1. Open `quiz.html` in browser
2. Start quiz
3. Answer 5 questions deliberately WRONG on T-states/Barramento topics
4. Answer 5 questions RIGHT on PC/ACC topics
5. Let quiz end (lose 3 lives or manually close)

**Expected Results:**
- Console: No errors
- `#analytics-report` shows report card with:
  - ✅ "⚠️ Tópicos frágeis: T-states, Barramento"
  - ✅ "✨ Tópicos fortes: PC, ACC"
- localStorage['quiz_session_history'] contains session object

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 1.2: Error Classification

**Setup:**
```javascript
// In console (quiz.html)
window.quizAnalytics.recordError(
  "Quantos estados T o ciclo da máquina possui?", 
  42
);
```

**Expected:**
```javascript
window.quizAnalytics.currentSessionErrors
// { "T-states": [42] }
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 1.3: Study Recommendations

**Steps:**
1. Complete quiz with weakTopics = ['T-states', 'Barramento']
2. Check console output or report card
3. Verify recommendations include study links

**Expected:**
- Weak topics have `description` and `link` fields
- Links point to `#oqueesap` (study page)

**Pass:** ✅ | **Fail:** ❌

---

## 2️⃣ User Profile & Persistence

### Test Case 2.1: Profile Creation

**Steps:**
1. Open `quiz.html`
2. Open DevTools → Application → Local Storage
3. Clear `user_profile` (delete entry)
4. Reload page
5. Verify `user_profile` key exists

**Expected:**
```json
{
  "userId": "anonymous",
  "level": 1,
  "totalAnswered": 0,
  "difficultyStats": { ... },
  "sessions": []
}
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 2.2: Answer Recording

**Steps:**
```javascript
// In console
window.userProfile.recordAnswer("PC question", "fácil", true, 3200);
window.userProfile.recordAnswer("ACC question", "médio", false, 4100);
window.userProfile.getStats();
```

**Expected Output:**
```javascript
{
  totalAnswered: 2,
  totalCorrect: 1,
  accuracy: 50.0,
  difficultyBreakdown: {
    fácil: { answered: 1, correct: 1, accuracy: "100%" },
    médio: { answered: 1, correct: 0, accuracy: "0%" }
  }
}
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 2.3: Session Persistence

**Steps:**
1. Answer 5 questions (~3200ms each)
2. End quiz
3. Verify `#profile-card` renders with stats
4. Reload page
5. Check localStorage: `user_profile.sessions.length` should increase

**Expected:**
- Profile card shows running totals after each session
- Sessions persist across reloads
- Level may update if totalAnswered increased

**Pass:** ✅ | **Fail:** ❌

---

## 3️⃣ Lazy Loading

### Test Case 3.1: Audio Defer

**Steps:**
1. Open DevTools → Network tab
2. Filter by Media (Audio)
3. Reload `quiz.html`
4. Start quiz
5. Answer question correctly (triggers audio)

**Expected:**
- Initial load: NO audio files in Network tab
- After correct answer: `quiz_correct.ogg` appears in Network

**Network Timeline:**
| Event | quiz_correct.ogg |
|-------|-----------------|
| Page Load | ❌ Not loaded |
| Answer Correct | ✅ Loads (200 OK) |

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 3.2: Preload on Page Load

**Steps:**
```javascript
// In console (after page load)
window.assetLoader.getStatus();
```

**Expected:**
```javascript
{ loadedAssets: >=2, cachedAudio: >=2 }
// (quiz_correct.ogg and quiz_wrong.ogg preloaded)
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 3.3: Play Audio

**Steps:**
```javascript
// In console
await window.assetLoader.playAudio('assets/audio/quiz_correct.ogg');
// Should hear "ding" sound
```

**Expected:**
- Sound plays immediately (from cache)
- No console errors

**Pass:** ✅ | **Fail:** ❌

---

## 4️⃣ PWA & Offline

### Test Case 4.1: Service Worker Registration

**Steps:**
1. Open DevTools → Application → Service Workers
2. Check if `/service-worker.js` registered
3. Status should say "activated and is running"

**Expected:**
```
Name: http://localhost/service-worker.js
Status: activated and running
Scope: /
Update on reload: (checked)
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 4.2: Offline Cache

**Steps:**
1. Load `index.html` or `quiz.html` completely
2. DevTools → Network → Offline (checkbox)
3. Reload page
4. Navigate between pages
5. Open DevTools Console

**Expected:**
- HTML loads from cache (no 404s)
- Layout intact (CSS cached)
- Scripts loaded (JS cached)
- Console: No "Failed to fetch" errors

**Edge Cases:**
- questions.json returns `{ questions: [] }` (fallback)
- achievements.json returns `{ achievements: [] }` (fallback)

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 4.3: Manifest Install Prompt

**Steps (Android Chrome):**
1. Abre em Chrome
2. Wait 3-5 segundos
3. "Install" banner deve aparecer (bottom)
4. Tap "Install"

**Expected:**
- App instala na home screen
- Abre em standalone mode (sem URL bar)
- Ícone = logoBitLab.png

**Steps (iOS Safari):**
1. Share → "Add to Home Screen"
2. Tap app icon

**Expected:**
- Abre fullscreen
- Offline fallback works

**Pass:** ✅ | **Fail:** ❌

---

## 5️⃣ Accessibility

### Test Case 5.1: Keyboard Navigation (Emulator)

**Steps:**
1. Open `index.html`
2. Focus hardware-diagram (click on it)
3. Press `→` (right arrow)

**Expected:**
- Next component focuses (visual highlight)
- ARIA live region announces component name

**Repeat:** `←`, `↓`, `↑` all work

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 5.2: ARIA Live Announcements

**Steps:**
1. Open `index.html`
2. Screenshot console.log output from emulator ticks
3. Enable screen reader (NVDA, JAWS, VoiceOver)

**Expected:**
- PC, ACC, T-state changes announced
- Text: "PC = 0, ACC = 0, T-state 1"

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 5.3: Quiz Accessibility

**Steps:**
1. Open `quiz.html`
2. Use Tab to navigate options
3. Each option gets focus

**Expected:**
- Option text announced by screen reader
- "Option 1 of 4: [text]"
- Focus order = top to bottom

**Pass:** ✅ | **Fail:** ❌

---

## 6️⃣ Telemetry Local

### Test Case 6.1: Page Load Recording

**Steps:**
1. Open `quiz.html`
2. Wait for page to fully load
3. Open DevTools → Application → Local Storage
4. Check `telemetry_sessions`

**Expected:**
```json
[
  {
    "sessionId": "session_abc123...",
    "startTime": 1705339200000,
    "events": [
      {
        "type": "page_load",
        "timestamp": 1705339205000,
        "elapsed": 5000,
        "page": "BitLab | Quiz SAP-1",
        "windoLoadTime": 1850
      }
    ]
  }
]
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 6.2: Quiz Attempt Logging

**Steps:**
```javascript
// In console (quiz.html, before answering)
window.telemetry.logQuizAttempt(5, "fácil", true, 3200);
window.telemetry.logQuizAttempt(7, "médio", false, 4100);
window.telemetry.getSummary();
```

**Expected:**
```javascript
{
  totalSessions: 1,
  quizAttemptsTotal: 2,
  avgTimePerQuestion: 3650,  // (3200 + 4100) / 2
  abnormalAttempts: 0         // both < 30s
}
```

**Pass:** ✅ | **Fail:** ❌

---

### Test Case 6.3: Abandonment Tracking

**Steps:**
1. Start quiz in `quiz.html`
2. Answer 3 questions
3. Close tab/window WITHOUT finishing
4. Open quiz.html again
5. Check telemetry

**Expected:**
```javascript
window.telemetry.getSummary().abandonmentRate > 0
// Previous session marked as "abandoned"
```

**Pass:** ✅ | **Fail:** ❌

---

## 7️⃣ Integration Smoke Test

### Full User Journey

**Scenario:** Complete a full quiz session with all modules active

**Steps:**

1. **Load Quiz Page**
   - ✅ CSS/JS loaded quickly
   - ✅ Service Worker activated
   - ✅ Telemetry records page_load

2. **Start Quiz**
   - ✅ User profile initialized
   - ✅ Analytics session reset
   - ✅ Accessibility live region ready

3. **Answer 10 Questions**
   - ✅ Each answer timing recorded in profile
   - ✅ Errors classified by topic
   - ✅ Audio plays lazily on correct
   - ✅ ARIA announces progress to screen readers
   - ✅ Keyboard nav works (Tab through options)

4. **End Quiz**
   - ✅ Analytics report generated
   - ✅ Profile updated + rendered
   - ✅ Telemetry logs quiz_attempts
   - ✅ localStorage contains all data

5. **Reload Page**
   - ✅ Profile persists
   - ✅ Analytics history accessible
   - ✅ Service Worker serves cached assets

6. **Go Offline**
   - ✅ Quiz page loads from cache
   - ✅ Start quiz works (offline)
   - ✅ questions.json returns empty array (graceful)

**Overall Result:** ✅ Pass | ❌ Fail

---

## 🐛 Known Issues & Workarounds

| Issue | Platform | Workaround |
|-------|----------|-----------|
| Service Worker not registering | localhost HTTP | Use HTTPS or `http://127.0.0.1:8000` |
| ARIA live not spoken | Safari < 15 | Fallback text-to-speech via Web Speech API |
| localStorage full (>5MB) | All | Implement IndexedDB for history >5MB |
| Offline quiz doesn't submit | All | Implement Background Sync for sync queue |

---

## ✅ Test Environment Checklist

Before running tests, ensure:

- [ ] Browser: Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- [ ] Network: Fast 3G (DevTools throttling) or offline mode
- [ ] Devtools: Open (F12) with Application tab visible
- [ ] Console: Clear before each test
- [ ] localStorage: Consider clearing between tests
- [ ] Screen Reader: NVDA 2023 (Windows) or VoiceOver (Mac)

---

## 📊 Coverage Summary

| Module | Test Cases | Status |
|--------|-----------|--------|
| quiz-analytics.js | 3 | ⏳ Ready |
| user-profile.js | 3 | ⏳ Ready |
| asset-loader.js | 3 | ⏳ Ready |
| service-worker.js | 3 | ⏳ Ready |
| accessibility.js | 3 | ⏳ Ready |
| telemetry.js | 3 | ⏳ Ready |
| **Integration** | 1 | ⏳ Ready |
| **Total** | **19** | **✅ Ready** |

---

**Last Updated:** 2025 | **Version:** 1.0
