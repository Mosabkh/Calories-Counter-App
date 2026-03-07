# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Calobite" — a React Native calorie tracking app built with Expo SDK 54 and expo-router v6 (file-based routing). Users photograph meals for automatic calorie tracking. The app has a multi-step onboarding flow (26 screens) and a tabbed main interface with home, progress, and profile screens.

## Development Environment

**CRITICAL: Expo Go only.** No Apple Developer account yet — do NOT use native modules that require `expo prebuild` or a development build. Everything must run in Expo Go on physical iPhone and Android devices.

## Commands

- `npx expo start` — start the dev server (use `--clear` to clear Metro cache)
- `npx expo start --android` / `--ios` — start for a specific platform
- `npm run lint` (runs `expo lint`) — lint with ESLint flat config

No test runner is configured.

## Architecture

### Routing (expo-router, file-based)

- `app/_layout.tsx` — Root Stack: wrapped in `GestureHandlerRootView`, loads Nunito fonts, manages splash screen
- `app/index.tsx` — Entry redirect: sends to `/(tabs)` if onboarding complete, else `/onboarding`
- `app/onboarding/_layout.tsx` — Stack with `slide_from_right` transitions; 26 screens across 3 phases (Basics, Body & Goals, Lifestyle) plus transitions, plan generation, account creation, and paywall
- `app/(tabs)/_layout.tsx` — Bottom tabs (home, progress, profile) with `CustomTabBar`
- Modal screens: `log-meal`, `food-search`, `log-weight`, `log-exercise`, `saved-foods` (slide from bottom)
- Settings screens: `edit-profile`, `my-goals`, `reminders`, `units`, `help`, `subscription`, `progress-photos` (slide from right)

### State Management

All persistent stores use Zustand with `persist` middleware backed by an in-memory `Map` (`store/storage.ts`). Data does **not** persist across app restarts in current Expo Go setup.

- `store/onboarding-store.ts` — temporary onboarding data (`OnboardingPayload`). Notable fields: `weekendDays` is `string[]` (day names), `weeklyGoalSpeed` is number (kg/week), `activityLevel` is `ActivityLevel` type, `startWeight` equals `currentWeight` at time of entry.
- `store/user-store.ts` — `UserProfile` (graduated from onboarding) + `AuthState`. Persist key: `calobite-user`.
- `store/diary-store.ts` — meal entries keyed by `'YYYY-MM-DD'`. Has `getDailySummary()` for totals. `addMeal` auto-triggers streak recording. Persist key: `calobite-diary`.
- `store/weight-store.ts` — weight log entries sorted by timestamp descending. Persist key: `calobite-weight`.
- `store/streak-store.ts` — tracks logging streaks via `recordActivity(todayKey)`. Persist key: `calobite-streak`.
- `store/exercise-store.ts` — exercise entries keyed by date. Persist key: `calobite-exercise`.
- `store/favorites-store.ts` — saved food IDs + cached `FoodItem` data for online foods. `toggle(id, food?)` caches online items. Persist key: `calobite-favorites`.
- `store/photo-store.ts` — progress photos sorted by timestamp. Persist key: `calobite-photos`.
- `store/subscription-store.ts` — subscription state (plan, isActive, expiresAt). Persist key: `calobite-subscription`.
- `store/reminders-store.ts` — reminder configs per meal + weigh-in (enabled, hour, minute). Persist key: `calobite-reminders`.

### Storage Migration Path

`store/storage.ts` currently uses an in-memory `Map` for Expo Go compatibility. When switching to a development build:
1. `npm install react-native-mmkv`
2. Swap the adapter in `storage.ts` (commented-out MMKV code is there)
3. `npm install react-native-purchases` and add real API keys in `utils/revenue-cat.ts`

### Onboarding Graduation

`utils/graduate-onboarding.ts` copies the onboarding payload into the persistent user store and seeds the initial weight entry. Called once at the end of onboarding. It recalculates BMR/TDEE/macros and handles unit conversions (ft→cm, lb→kg) before persisting.

### Types

- `types/data.ts` — `UserProfile`, `AuthState`, `MealEntry`, `ExerciseEntry`, `DailySummary`, `WeightEntry`, `StreakData`
- `types/food.ts` — `FoodItem` (per-100g macros, default serving)
- All date strings use `'YYYY-MM-DD'` format (see `utils/date.ts`)

### Food Search (Hybrid: Offline + Online)

- **Offline**: `data/usda-sr-legacy.json` — USDA SR Legacy dataset (~7,766 whole foods, ~2MB bundled). IDs prefixed `usda_`.
- **Online**: Open Food Facts API (3M+ packaged foods) via `searchOnline()`. Uses v1 search endpoint (`/cgi/search.pl`), 500ms debounce, 20s timeout, requires `User-Agent` header. IDs prefixed `off_`.
- `utils/food-search.ts` — `searchFoods()` (local, prefix-biased + multi-word matching), `searchOnline()`, `getFoodById()`, `calculateMacros()`, `getCategories()`, `getFoodsByCategory()`
- `app/food-search.tsx` — merged results with section headers ("Local Results" / "Online Results"), loading spinner for online, `KeyboardAvoidingView` + `keyboardDismissMode="on-drag"`
- `store/favorites-store.ts` — saves food IDs + caches full `FoodItem` data for online foods (`off_*`). `toggle()` accepts optional `FoodItem` so online favorites can be resolved later in saved-foods screen.

### Subscriptions (Stubbed)

RevenueCat is fully stubbed for Expo Go — no native SDK is imported. `utils/revenue-cat.ts` returns fake offerings and simulates purchases. Related files:
- `store/subscription-store.ts` — persisted subscription state
- `utils/premium.ts` — `isPremium()` and `usePremium()` hook for gating features
- `app/subscription.tsx` — subscription management screen
- `app/onboarding/paywall.tsx` — paywall with `StubPackage` types

### Theming & Styling

- `constants/theme.ts` — single `Theme` object (`as const`) with colors, fonts (Nunito family), and border radii. Warm palette: coral primary (`#E2856E`), cream background (`#FFFAF5`).
- All styling uses `StyleSheet.create` with `Theme` constants. No external styling library.
- **Never hardcode colors** — use `Theme.colors.*` (e.g., `Theme.colors.white` not `#FFFFFF`, `Theme.colors.textDark` for shadows not `#000`).
- **Never hardcode border radii** — use `Theme.borderRadius.card` (20) / `Theme.borderRadius.button` (20).
- Card-like elements use `borderWidth: 2` consistently (not 1 or 1.5).
- Color contrast: `warning` (#E0B05C) fails WCAG AA on white backgrounds. Use `warningDark` (#996B00) for text, keep `warning` for icons/backgrounds only. Similarly, `warningLight` exists for light background fills.

### In-App Screens

- **Home** (`app/(tabs)/index.tsx`): Animated `DonutChart` using `react-native-reanimated`. Exercise burned calories adjust target. Uses latest weigh-in for goal prediction. Empty state when no profile.
- **Progress** (`app/(tabs)/progress.tsx`): Weight chart (SVG polyline), calorie stacked bar chart, streak dots from actual logged days, progress photos with upload, BMI visualization. Empty state when no profile.
- **Profile** (`app/(tabs)/profile.tsx`): Settings list with `SettingItem` (wrapped in `memo()`). Dynamic subscription badge. Sign out with confirmation.
- **CustomTabBar** (`components/CustomTabBar.tsx`): SVG-shaped nav bar with FAB button. FAB actions: camera, log exercise, saved foods. Uses `useSafeAreaInsets` for dynamic positioning.

### BMI Bar Alignment

Both `custom-plan.tsx` and `progress.tsx` use the same piecewise BMI-to-percent mapping. The bar segments use flex ratios `14:26:20:40`, so the percent mapping must match:
- Underweight (BMI 10-18.5) → 0-14%
- Healthy (BMI 18.5-25) → 14-40%
- Overweight (BMI 25-30) → 40-60%
- Obese (BMI 30-40) → 60-100%

If you change one, change both.

### Key Conventions

- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)
- TypeScript strict mode enabled
- React Compiler and typed routes enabled (`app.json` experiments)
- New Architecture enabled (`newArchEnabled: true`)
- Reusable onboarding components in `components/onboarding/` (ProgressHeader, OnboardingButton, ListButton, CardOption, UnitToggle, ScrollPicker, BouncyView, OnboardingIcon)
- Shared utilities in `utils/`:
  - `calories.ts` — Mifflin-St Jeor BMR, TDEE, daily calorie target, macro split (activity-scaled protein: 1.2-2.2 g/kg), BMI, age calculation. `calculateDailyCalories` enforces a safety floor (`minCal`) for all goals including maintain.
  - `date.ts` — date key helpers (`toDateKey`, `yesterdayKey`, `daysAgoKey`, `weekKeys`, `dayLabel`, `inferMealType`). All use local timezone.
  - `recalculate-targets.ts` — shared utility for edit-profile and my-goals to recalculate BMR/TDEE/macros from profile changes
  - `graduate-onboarding.ts` — one-time onboarding→persistent store migration
  - `auth.ts` — auth stubs (`signInAnonymously`, `signOut`); real OAuth deferred to Supabase integration
  - `food-search.ts` — hybrid food search (USDA offline + Open Food Facts online) and macro calculation
  - `camera.ts` — camera/image picker utilities
  - `revenue-cat.ts` — stubbed RevenueCat wrapper
  - `premium.ts` — premium feature gating

### ScrollPicker Component

Uses scroll-offset-based selection (`Math.round(contentOffset.y / ITEM_HEIGHT)`). Do NOT use `onViewableItemsChanged` — it unreliably detects the center item. Apple-style design: thin separator lines, opacity fade, bold for selected. For multi-picker screens, use `hideLines` prop and render shared separator lines in the parent `pickerRow`. Exports `PICKER_ITEM_HEIGHT`, `PICKER_VISIBLE_ITEMS`, `PICKER_CENTER` for parent layout.

### Goal-dependent Flow

The onboarding path and in-app text adapt based on `goal` (lose/gain/maintain):
- **Maintain**: skips `goal-weight`, `realistic-target`, `goal-speed`, `projection` — goes straight from `current-weight` to `transition2`. Target weight = current weight. Weight progress shows 100%. No goal prediction bar on home.
- **Gain**: `goal-weight` picker starts at currentWeight+1, text adapted across screens, goal prediction says "reach" target.
- **Lose**: default path, picker capped at currentWeight-1.
- Encouragement messages in progress screen adapt per goal.

### Navigation Patterns

- `generating.tsx` uses `router.replace` (not push) to navigate to `custom-plan` — prevents back-loop where the auto-timer re-fires
- Back button touch targets must be at least 44x44px with `hitSlop`
- Back buttons must have `accessibilityLabel="Go back"` and `accessibilityRole="button"`, with the `<` text marked `accessible={false}`
- Bottom action padding: all onboarding screens use `paddingBottom: 36`

### Accessibility Standards

- All decorative emojis, icons, and SVG backgrounds must have `accessible={false}`
- Interactive elements need `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` where applicable
- `UnitToggle` uses `accessibilityRole="radiogroup"`, individual options use `accessibilityRole="radio"`
- `ScrollPicker` has `accessibilityRole="adjustable"` with value in the label (uses `?? ''` for bounds safety)
- `ProgressHeader` bar uses `accessibilityRole="progressbar"` with `accessibilityValue`
- Data cards (calories, macros, BMI) should have consolidated `accessibilityLabel` combining their values
- Overlay dismiss pressables need `accessibilityLabel="Close menu"` and `accessibilityRole="button"`

### Zustand Selector Pattern (CRITICAL)

Never call store methods that return new objects inside selectors — this causes infinite re-render loops (`getSnapshot should be cached`). Select raw state and derive with `useMemo`:
```tsx
// BAD — creates new object each render, breaks React's snapshot caching:
const summary = useDiaryStore((s) => s.getDailySummary(date));

// GOOD — select raw data, derive in component:
const entries = useDiaryStore((s) => s.entries);
const summary = useMemo(() => /* derive from entries */, [entries, date]);
```

### Performance Patterns

- `CustomTabBar`, `SettingItem`, and `DonutChart` are wrapped in `memo()` — preserve this when editing
- Callbacks passed to child components should use `useCallback` for stability
- Avoid inline style objects in render — extract to `StyleSheet.create` or module-level constants
- Static data arrays used in `useMemo`-dependent rendering should themselves be memoized
- Dynamic values derived from `useSafeAreaInsets` should be wrapped in `useMemo`

### Known Workarounds

- `expo-notifications` barrel import is broken in SDK 54 (missing `unregisterForNotificationsAsync`). Import directly from `expo-notifications/build/NotificationPermissions` instead.
- Notification scheduling in `reminders.tsx` is wrapped in try/catch — silently fails in Expo Go.
- `react-native-mmkv` and `react-native-purchases` are NOT installed — they require NitroModules / native builds incompatible with Expo Go.

### Design Prototypes

- `_design_prototypes/` contains HTML mockups (onboarding and in-app screens) used as visual references for implementation
