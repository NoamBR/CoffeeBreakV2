# Retention Engine — Design & Implementation Plan

## Context
The app has basic loyalty stamps but lacks engagement features that make customers **want to come back daily**. We're adding 5 high-impact retention features: "Your Usual" quick reorder, Daily Streak counter, Scratch Card rewards, Refer a Friend, and VIP Tiers. The audience is mixed (daily regulars + casual promenade visitors) and the tone is value-driven — every feature clearly saves money or time.

---

## Feature 1: "הרגיל שלך" (Your Usual) — Home Screen Widget

### JTBD
"I want my coffee fast without thinking — just give me what I always get."

### Design Spec

```
┌─────────────────────────────────────┐
│  ☕ הרגיל שלך                       │  ← Section header on home
│  ┌─────────────────────────────────┐│
│  │ [thumb]  קפה הפוך רגיל          ││ ← Last repeated order
│  │          חלב רגיל, ללא סוכר     ││    Shows customizations
│  │          ₪14                    ││
│  │                                 ││
│  │  ┌─────────────────────────┐    ││
│  │  │   הזמינו עכשיו ⚡        │    ││ ← Primary CTA, blue bg
│  │  └─────────────────────────┘    ││    One tap → checkout
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Logic
- Track order history in a new `useOrderHistoryStore`
- After a user orders the **same item 3+ times**, it becomes "Your Usual"
- Widget appears on home screen **above** the promo banner
- Tapping "הזמינו עכשיו" skips menu entirely → goes straight to a confirmation/checkout-like screen
- If no usual detected yet, widget doesn't show (no empty state)
- If user has multiple "usuals", show the most recent one

### Files to Create
- `expo/stores/orderHistoryStore.ts` — tracks past orders, detects "usual"
- Widget is added directly in `expo/app/(tabs)/index.tsx`

### Component: `YourUsualWidget`
- Props: `{ item: MenuItem, customizations?: string, onOrder: () => void }`
- White card, border radius 16, blue shadow accent
- Thumbnail (60×60 rounded), item name (17px bold), customizations (13px gray), price (18px bold blue)
- Full-width blue CTA button inside card

---

## Feature 2: 🔥 Daily Streak — Home Screen Widget

### JTBD
"I've been coming every day — I don't want to lose my streak and the bonus that comes with it."

### Design Spec

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────────┐│
│  │  🔥 4 ימים רצופים!              ││ ← Streak count, bold
│  │                                 ││
│  │  ○ ○ ○ ● ● ● ● ◌              ││ ← 7-day dots (Mon-Sun)
│  │  ש ו ה ר ש ש א                 ││    Filled = ordered
│  │                                 ││    Current day pulsing
│  │  עוד 3 ימים לבונוס!  🎁         ││ ← Motivation text
│  │  7 ימים רצופים = חותמת בונוס    ││ ← Reward description
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Logic
- Store: `useStreakStore` (persisted)
  - `currentStreak: number`
  - `longestStreak: number`
  - `lastOrderDate: string` (ISO date, date-only)
  - `weekDays: boolean[]` (7 booleans for current week, Sun-Sat)
- When user adds a stamp (order), call `recordOrder()`
  - If `lastOrderDate` is today → do nothing (already counted)
  - If `lastOrderDate` is yesterday → increment streak
  - If `lastOrderDate` is older → reset streak to 1
  - Update `weekDays` for current day
- **Milestone rewards:**
  - 3-day streak → notification "כל הכבוד! 3 ימים רצופים 🔥"
  - 7-day streak → **bonus stamp** auto-added + celebration
  - 14-day streak → free upgrade (future, when ordering exists)
- Weekly dots reset every Sunday

### Widget: `StreakWidget`
- White card, 16px radius, subtle shadow
- Fire emoji + streak count (24px bold)
- 7 dots row: filled (blue) = ordered that day, empty (gray border) = not yet, current day has pulse animation
- Hebrew day labels below dots (א, ב, ג, ד, ה, ו, ש)
- Motivation text below: dynamic based on days remaining to 7
- Compact — sits on home screen between greeting and loyalty card

### Files to Create
- `expo/stores/streakStore.ts`
- `expo/components/StreakWidget.tsx`

---

## Feature 3: 🎟️ Scratch Card — Post-Stamp Reward

### JTBD
"I just got my stamp — ooh what did I win? Let me scratch and find out!"

### Design Spec

```
┌─────────────────────────────────────┐
│                                     │
│         🎉 יש לך כרטיס גירוד!       │ ← heading2
│                                     │
│    ┌───────────────────────────┐    │
│    │  ╔═══════════════════╗    │    │
│    │  ║                   ║    │    │ ← "Scratch" area
│    │  ║   גרדו כאן! 👆    ║    │    │    Blue overlay
│    │  ║                   ║    │    │    Tap to reveal
│    │  ╚═══════════════════╝    │    │
│    └───────────────────────────┘    │
│                                     │
│  After scratch:                     │
│    ┌───────────────────────────┐    │
│    │   🎁 זכית!                │    │
│    │   חותמת בונוס!            │    │ ← Prize revealed
│    │                           │    │
│    │   [מעולה!]                │    │ ← Dismiss CTA
│    └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Logic
- Triggered every **3rd stamp** (stamp count % 3 === 0)
- When `addStamp()` returns and stamp count is divisible by 3 → set `hasScratchCard: true`
- Prize pool (weighted random):
  - 40%: Bonus stamp (חותמת בונוס)
  - 30%: 10% off next order (10% הנחה)
  - 20%: Free size upgrade (שדרוג גודל חינם)
  - 10%: Free pastry (מאפה חינם)
- Presented as a **modal** over the loyalty screen after stamp added
- User taps the card to "scratch" → prize animates in with scale + confetti
- Prize is stored and can be redeemed (future integration)

### Implementation
- No actual scratch gesture needed (too complex, low value) — **tap to reveal** with a flip/scale animation is cleaner and more satisfying
- Blue overlay card → tap → flips to reveal prize with bounce animation + haptic
- Confetti particles in blue/white

### Files to Create
- `expo/components/ScratchCard.tsx` — the modal component
- Prize logic added to `expo/stores/loyaltyStore.ts` (new fields: `hasScratchCard`, `currentPrize`, `prizes[]`)

---

## Feature 4: 👥 Refer a Friend — Profile Section + Share

### JTBD
"If I bring friends, we both get rewarded — easy way to share something I love."

### Design Spec

**Profile Section Widget:**
```
┌─────────────────────────────────────┐
│  👥 הזמינו חברים                    │ ← Section in profile
│  ┌─────────────────────────────────┐│
│  │  הזמינו חבר ושניכם תרוויחו!    ││ ← Headline
│  │                                 ││
│  │  ✓ החבר מקבל: משקה ראשון חינם  ││ ← Benefits list
│  │  ✓ אתם מקבלים: חותמת בונוס     ││
│  │                                 ││
│  │  הזמנתם: 3 חברים 🎉            ││ ← Referral count
│  │                                 ││
│  │  ┌─────────────────────────┐    ││
│  │  │   שתפו קישור 📤         │    ││ ← Share CTA
│  │  └─────────────────────────┘    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Share Action:**
- Tapping opens native share sheet with message:
  - "הצטרפו להפסקת קפה! ☕ הורידו את האפליקציה וקבלו משקה ראשון חינם. [link]"
- For now, share a static message (no deep link tracking yet)
- Track referral count manually in store (staff enters when friend shows up)

### Logic
- Store: `useReferralStore` (persisted)
  - `referralCount: number`
  - `referralCode: string` (generated from user phone/id)
- Share uses `expo-sharing` or React Native's `Share` API
- Referral count displayed in profile widget
- Each referral = bonus stamp (triggered by staff via PIN, like current stamp system)

### Files to Create
- `expo/stores/referralStore.ts`
- `expo/components/ReferralWidget.tsx`
- Widget added to `expo/app/(tabs)/profile.tsx`

---

## Feature 5: ⭐ VIP Tier System — Status Engine

### JTBD
"I'm a loyal customer — I deserve better perks than someone who just walked in. Show me my status and what I'm working toward."

### Tier Structure

| Tier | Hebrew | Orders Required | Badge Color | Perks |
|------|--------|----------------|-------------|-------|
| **Bronze** | ברונזה | 0–19 orders | `#CD7F32` | Basic loyalty stamps |
| **Silver** | כסף | 20–49 orders | `#A8A9AD` | 5% off every order + birthday double reward |
| **Gold** | זהב | 50+ orders | `#FFD700` | 10% off every order + free monthly pastry + priority |

### Design Spec — Tier Badge (Home Screen Header)

The tier badge sits in the header gradient, next to the greeting:

```
┌─────────────────────────────────────┐
│  ▓  הפסקת קפה        ☕           ▓  │
│  ▓  ,בוקר טוב [name]!            ▓  │
│  ▓  ┌──────────┐                  ▓  │
│  ▓  │ ⭐ זהב   │  ← Tier badge    ▓  │ Small pill, tier color bg
│  ▓  └──────────┘                  ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
```

### Design Spec — Tier Progress Card (Loyalty Tab)

Sits above the stamp card in the loyalty tab:

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────────┐│
│  │  ⭐ דרגת VIP: כסף               ││ ← Current tier name
│  │                                 ││
│  │  ● ברונזה ────── ● כסף ── ○ זהב ││ ← Progress dots + line
│  │                                 ││    Completed = filled
│  │  42/50 הזמנות — עוד 8 לזהב!    ││ ← Progress text
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 84%    ││ ← Progress bar
│  │                                 ││
│  │  ── ההטבות שלך ──               ││
│  │  ✓ 5% הנחה על כל הזמנה         ││ ← Active perks
│  │  ✓ מתנת יום הולדת כפולה        ││
│  │                                 ││
│  │  ── בדרגת זהב תקבלו ──         ││
│  │  ○ 10% הנחה על כל הזמנה        ││ ← Next tier perks (grayed)
│  │  ○ מאפה חינם כל חודש           ││
│  │  ○ תור מועדף                   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Design Spec — Tier Badge in Profile

```
┌─────────────────────────────────────┐
│           ┌────┐                    │
│           │ גי │                    │ ← Avatar
│           └────┘                    │
│          גיא גיל                    │
│       ┌──────────┐                  │
│       │ ⭐ כסף   │                  │ ← Tier badge under name
│       └──────────┘                  │
│       050-123-4567                  │
└─────────────────────────────────────┘
```

### Logic
- Tier is **computed** from `totalCoffees` (already tracked in userStore):
  - `totalCoffees < 20` → bronze
  - `totalCoffees >= 20 && < 50` → silver
  - `totalCoffees >= 50` → gold
- **Tier-up celebration**: When crossing a threshold, show a modal:
  - "🎉 מזל טוב! עליתם לדרגת כסף!"
  - List of new perks unlocked
  - Confetti animation + haptic success feedback

### Files to Create
- `expo/components/TierBadge.tsx` — small pill component (reusable in header, profile, loyalty)
- `expo/components/TierProgressCard.tsx` — full progress card for loyalty tab
- `expo/components/TierUpModal.tsx` — celebration modal on tier change
- `expo/utils/tiers.ts` — helper: `getTier(totalOrders)`, `getTierConfig(tier)`, `getNextTierProgress(totalOrders)`

### Tier Colors & Styling
```
Bronze: bg #CD7F32, text white — warm copper
Silver: bg #A8A9AD, text white — cool steel
Gold:   bg #FFD700, text #111  — bright gold, dark text
```
- Badge is a pill (paddingH 12, paddingV 4, radius full)
- Star icon from Lucide `Star` component, size 14
- Progress bar uses tier color for fill

---

## Home Screen Layout (Updated)

The home screen needs to be reorganized to fit the new widgets:

```
┌─────────────────────────────────────┐
│  ▓▓ Blue Gradient Header ▓▓▓▓▓▓▓▓  │ ← Bleeds to top
│  ▓  הפסקת קפה        ☕           ▓  │
│  ▓  ,בוקר טוב [name]!            ▓  │
│  ▓  ┌──────────┐                  ▓  │
│  ▓  │ ⭐ כסף   │  ← Tier badge    ▓  │
│  ▓  └──────────┘                  ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                     │
│  1. 🔥 StreakWidget                 │ ← Daily streak
│                                     │
│  2. ☕ YourUsualWidget              │ ← Quick reorder
│     (only if user has a "usual")    │
│                                     │
│  3. Loyalty Card (compact)          │ ← Existing
│                                     │
│  4. מבצעים חמים                     │ ← Existing promo banner
│     HeroBanner                      │
│                                     │
│  5. Store Status                    │ ← Existing
│                                     │
│  6. לתפריט המלא CTA                │ ← Existing
└─────────────────────────────────────┘
```

---

## Files Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `expo/stores/streakStore.ts` | Streak tracking, milestone detection |
| `expo/stores/orderHistoryStore.ts` | Order history, "usual" detection |
| `expo/stores/referralStore.ts` | Referral count, code generation |
| `expo/components/StreakWidget.tsx` | 7-day dots + streak count widget |
| `expo/components/YourUsualWidget.tsx` | Quick reorder card |
| `expo/components/ScratchCard.tsx` | Tap-to-reveal prize modal |
| `expo/components/ReferralWidget.tsx` | Refer a friend card |
| `expo/components/TierBadge.tsx` | Small tier pill (reusable) |
| `expo/components/TierProgressCard.tsx` | Full tier progress for loyalty tab |
| `expo/components/TierUpModal.tsx` | Tier-up celebration modal |
| `expo/utils/tiers.ts` | getTier(), getTierConfig(), getNextTierProgress() |

### Existing Files to Modify
| File | Changes |
|------|---------|
| `expo/app/(tabs)/index.tsx` | Add StreakWidget + YourUsualWidget + TierBadge in header |
| `expo/app/(tabs)/loyalty.tsx` | Add TierProgressCard above stamps, trigger ScratchCard + TierUpModal |
| `expo/app/(tabs)/profile.tsx` | Add ReferralWidget + TierBadge under user name |
| `expo/stores/loyaltyStore.ts` | Add scratch card state (hasScratchCard, currentPrize, prizes[]) |

---

## Verification

1. **Streak**: Add stamps on consecutive days → streak increments. Skip a day → resets to 1. Hit 7 → bonus stamp auto-added.
2. **Your Usual**: Add the same item 3 times → widget appears on home. Tap "הזמינו עכשיו" → navigates correctly.
3. **Scratch Card**: Add stamps until divisible by 3 → modal appears. Tap → prize reveals with animation + haptic.
4. **Referral**: Tap share in profile → native share sheet opens with Hebrew message. Referral count displays correctly.
5. **Tiers**: Badge shows correct tier based on totalCoffees. Crossing threshold → celebration modal.
6. **Home layout**: All widgets render in correct order, no overlap, proper spacing.
7. **Persistence**: Kill app and reopen → streak, history, referral count all preserved.

Run with `bun run start` and test each flow.
