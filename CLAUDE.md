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

### Editor

VS Code with `fixAll`, `organizeImports`, and `sortMembers` auto-fix on save (`.vscode/settings.json`).

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
- **`textMuted` fails WCAG AA** on cream background — use `textDark` for all body text, subtitles, descriptions, and labels. Reserve `textMuted` only for decorative/secondary elements where contrast isn't critical.
- **Destructive text**: use `urgentRed` (#DC2626) not `calorieAlert` — `calorieAlert` has insufficient contrast for text on light backgrounds.

### In-App Screens

- **Home** (`app/(tabs)/index.tsx`): Animated `DonutChart` using `react-native-reanimated`. Exercise burned calories adjust target. Uses latest weigh-in for goal prediction. Empty state when no profile.
- **Progress** (`app/(tabs)/progress.tsx`): Time-based weight chart (SVG polyline with `vectorEffect="non-scaling-stroke"`, points positioned by actual date not index, dots at each data point), calorie stacked bar chart, streak dots from actual logged days, progress photos preview (up to 3 thumbnails), recent weight entries with edit/delete, BMI visualization. Weight chart is backward-looking (past → today); time tabs control how far back to show (30/60/90/180/365 days); "All time" shows from earliest entry. Dashed green goal line at target weight for lose/gain goals. Single entry shows horizontal line from Y axis to data point with dot. Year suffix (`'27`) shown on labels crossing into a different year. Empty state when no profile.
- **Profile** (`app/(tabs)/profile.tsx`): Settings list with `SettingItem` (wrapped in `memo()`). Dynamic subscription badge. Sign out with confirmation. Empty state has "Start Over" button that resets onboarding. All `SettingItem` onPress callbacks are extracted to `useCallback` to preserve `memo()` effectiveness.
- **CustomTabBar** (`components/CustomTabBar.tsx`): Inline-notch FAB tab bar. Layout: Home | Progress | (+) | Profile. SVG-based curved notch path with dynamic safe-area height calculation. FAB animates 45° rotation on press. Overlay is a 2-column card grid with staggered slide-up animation — 5 actions: Food database, Log weight, Log exercise, Saved foods, Scan food. Icons use Lucide SVG paths (`iconPaths` array + optional `circle`). Notch geometry: `NOTCH_RADIUS = FAB_SIZE / 2 + 10`, `spread = r + 14`, `depth = r - 4`.

### BMI Bar Alignment

Both `custom-plan.tsx` and `progress.tsx` use the same piecewise BMI-to-percent mapping. The bar segments use flex ratios `14:26:20:13:14:13` (total 100), so the percent mapping must match:
- Underweight (BMI 10-18.5) → 0-14%
- Healthy (BMI 18.5-25) → 14-40%
- Overweight (BMI 25-30) → 40-60%
- Obese (BMI 30-40) → 60-100% (3 sub-segments: `obeseLight`, `obeseMid`, `obeseDark`)

Both bars show colored dot legends next to category labels. The onboarding label flex ratios (20:22:22:36) differ from the bar segment ratios to give "Underweight" enough room to render on one line.

If you change the bar segments or percent mapping in one file, change both.

### Key Conventions

- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)
- TypeScript strict mode enabled
- React Compiler and typed routes enabled (`app.json` experiments)
- New Architecture enabled (`newArchEnabled: true`)
- Reusable onboarding components in `components/onboarding/` (ProgressHeader, OnboardingButton, ListButton, CardOption, UnitToggle, ScrollPicker, BouncyView, OnboardingIcon)
- Shared utilities in `utils/`:
  - `calories.ts` — Mifflin-St Jeor BMR, TDEE, daily calorie target, macro split (activity-scaled protein: 1.2-2.2 g/kg), BMI, age calculation. `calculateDailyCalories` enforces a safety floor (`minCal`) for all goals including maintain.
  - `date.ts` — date key helpers (`toDateKey`, `yesterdayKey`, `daysAgoKey`, `weekKeys`, `dayLabel`, `inferMealType`). All use local timezone.
  - `target-date.ts` — `getTargetDate(currentWeight, targetWeight, weeklySpeed)` → formatted target date string. Used by onboarding `custom-plan` and home screen goal prediction.
  - `recalculate-targets.ts` — takes current `UserProfile` + partial patch, merges, recalculates BMR→TDEE→daily calories→macros, returns the patch with recalculated fields. Used by `edit-profile.tsx` and `my-goals.tsx` to keep targets in sync after profile edits.
  - `graduate-onboarding.ts` — one-time onboarding→persistent store migration
  - `auth.ts` — auth stubs (`signInAnonymously`, `signOut`); real OAuth deferred to Supabase integration. `signOut()` resets all stores **except** onboarding — intentional so users land on welcome screen without redoing 26 steps.
  - `food-search.ts` — hybrid food search (USDA offline + Open Food Facts online) and macro calculation
  - `camera.ts` — `launchMealCamera()` for meal photo capture (1:1 aspect ratio)
  - `revenue-cat.ts` — stubbed RevenueCat wrapper
  - `premium.ts` — premium feature gating

### Progress Photos Flow

Progress photos can **only** be added through the log-weight screen (`app/log-weight.tsx`). There is no upload button in the progress screen or progress-photos library — this is intentional to tie photos to the weigh-in habit.

- `app/log-weight.tsx` — Photo thumbnail strip below the weight picker (hidden in edit mode). "Add Progress Photo" button triggers Alert with camera or library choice. Photo URI is stored in `sessionPhotoUri` state during the session — the photo is **deferred to the store** and only committed via `addPhoto()` inside `handleSave()` when the weight entry is actually saved. This prevents orphan photos if the user backs out. Haptic feedback fires on successful save.
- `app/progress-photos.tsx` — View-only gallery with FlatList grid. Each tile shows full date + weight from closest weight entry (matched by timestamp proximity, max 24h). Tap opens full-screen modal viewer with date, weight, and delete button. Long-press on grid also offers delete. Empty state includes a "Log Weight" navigation button.
- `app/(tabs)/progress.tsx` — Photos card shows up to 3 recent thumbnails + "Tap to view all" text. No upload functionality.

### Weight Log Entries

Today's weight entries with delete are shown in the progress screen (`progress.tsx`) below the top cards, not in the log-weight modal. Uses `todayWeightEntries` filtered from the weight store, with confirmation alert before deletion.

### Settings Screen Empty States

Settings screens that depend on `UserProfile` (edit-profile, my-goals, units) show an empty state when `!profile`. Profile screen's empty state includes a "Start Over" button (resets onboarding store, navigates to `/onboarding`). Empty subtitle text uses `textDark` (not `textMuted`) for WCAG compliance. All settings screens with unsaved changes show a "Discard Changes?" confirmation on back press.

### Dev Skip Button

`app/onboarding/index.tsx` has a "Skip Onboarding (DEV)" button (only visible when `__DEV__` is true). Creates a dummy 75kg male profile with calculated macros and seeds initial weight, then navigates to tabs. Styled with dashed red border to be clearly dev-only.

### ScrollPicker Component

Uses scroll-offset-based selection (`Math.round(contentOffset.y / ITEM_HEIGHT)`). Do NOT use `onViewableItemsChanged` — it unreliably detects the center item. Apple-style design: thin separator lines, opacity fade, bold for selected. For multi-picker screens, use `hideLines` prop and render shared separator lines in the parent `pickerRow`. Exports `PICKER_ITEM_HEIGHT`, `PICKER_VISIBLE_ITEMS`, `PICKER_CENTER` for parent layout.

**CRITICAL**: `ScrollPicker` uses `FlatList` internally — do NOT wrap it inside a `ScrollView` or you'll get "VirtualizedLists should never be nested" errors. If you need scrolling on a screen with `ScrollPicker`, either use a flat layout or build a lightweight wheel using plain `ScrollView` + `.map()` (see `app/reminders.tsx` `TimeWheel` pattern).

### Goal-dependent Flow

The onboarding path and in-app text adapt based on `goal` (lose/gain/maintain):
- **Maintain**: skips `goal-weight`, `realistic-target`, `goal-speed`, `projection` — goes straight from `current-weight` to `transition2`. Target weight = current weight. Weight progress shows 100%. No goal prediction bar on home.
- **Gain**: `goal-weight` picker starts at currentWeight+1, text adapted across screens, goal prediction says "reach" target.
- **Lose**: default path, picker capped at currentWeight-1.
- Encouragement messages in progress screen adapt per goal.

### In-App Goal Editing (`my-goals.tsx`)

Target weight is validated against `startWeight` (current weight at onboarding): must be less for "lose", more for "gain". Switching goal type auto-resets the target weight if it doesn't make sense for the new direction (e.g., switching from lose→gain resets target to `currentWeight + defaultStep`). Save button is disabled when validation fails, with inline error hint. Daily Target Preview card shows recalculated macros live as user changes settings. Gain speed labels ("Moderate" / "Max Surplus") match onboarding `goal-speed.tsx` — keep them in sync.

### Progress Charts

Weight chart uses **time-based positioning** — points are placed by actual date milliseconds, not array index. This ensures correct spacing for irregular logging. The chart is **backward-looking** (past → today): time tabs control how far back to display (30/60/90/180/365 days, All time). "All time" shows from the earliest entry (min 30 days). X-axis labels use `formatShortDate()` which appends year suffix (`'27`) when labels cross a year boundary. A dashed green goal line shows the target weight for lose/gain goals. SVG uses `vectorEffect="non-scaling-stroke"` to prevent stroke distortion from `preserveAspectRatio="none"`. Data point dots are rendered at each weigh-in.

Calorie stacked bar chart renders macro ratios as flex percentages of the daily total (protein/carbs/fat segments).

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
- Screen header titles need `accessibilityRole="header"` for VoiceOver navigation landmarks
- Header spacer views (used for centering titles) must have `accessible={false}`
- Modal containers should include `accessibilityViewIsModal` to trap VoiceOver focus
- Images inside touchable containers should have `accessible={false}` (parent carries the label)

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
