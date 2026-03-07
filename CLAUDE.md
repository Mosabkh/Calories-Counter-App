# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Calobite" — a React Native calorie tracking app built with Expo SDK 54 and expo-router v6 (file-based routing). Users photograph meals for automatic calorie tracking. The app has a multi-step onboarding flow (26 screens) and a tabbed main interface with home, progress, and profile screens.

## Commands

- `npx expo start` — start the dev server
- `npx expo start --android` / `--ios` / `--web` — start for a specific platform
- `npm run lint` (runs `expo lint`) — lint with ESLint flat config

No test runner is configured.

## Architecture

### Routing (expo-router, file-based)

- `app/_layout.tsx` — Root Stack: wrapped in `GestureHandlerRootView`, loads Nunito fonts, manages splash screen
- `app/index.tsx` — Entry redirect: sends to `/(tabs)` if onboarding complete, else `/onboarding`
- `app/onboarding/_layout.tsx` — Stack with `slide_from_right` transitions; 26 screens across 3 phases (Basics, Body & Goals, Lifestyle) plus transitions, plan generation, account creation, and paywall
- `app/(tabs)/_layout.tsx` — Bottom tabs (home, progress, profile) with `CustomTabBar`

### State Management

- Zustand store at `store/onboarding-store.ts` — holds all onboarding data (`OnboardingPayload`) and completion state. Not persisted (resets on app restart).
- Notable store fields: `weekendDays` is `string[]` (day names), `weeklyGoalSpeed` is number (kg/week), `activityLevel` is `ActivityLevel` type, `startWeight` is the baseline weight set during onboarding (equal to `currentWeight` at time of entry).

### Theming & Styling

- `constants/theme.ts` — single `Theme` object (`as const`) with colors, fonts (Nunito family), and border radii. Warm palette: coral primary (`#E2856E`), cream background (`#FFFAF5`).
- All styling uses `StyleSheet.create` with `Theme` constants. No external styling library.
- **Never hardcode colors** — use `Theme.colors.*` (e.g., `Theme.colors.white` not `#FFFFFF`, `Theme.colors.textDark` for shadows not `#000`).
- **Never hardcode border radii** — use `Theme.borderRadius.card` (20) / `Theme.borderRadius.button` (20).
- Card-like elements use `borderWidth: 2` consistently (not 1 or 1.5).
- Color contrast: `warning` (#E0B05C) fails WCAG AA on white backgrounds. Use `warningDark` (#996B00) for text, keep `warning` for icons/backgrounds only. Similarly, `warningLight` exists for light background fills.

### In-App Screens

- **Home** (`app/(tabs)/index.tsx`): Animated `DonutChart` using `react-native-reanimated` (`Animated.createAnimatedComponent(Circle)` with `useAnimatedProps`). Intro pulse animation via `withSequence`. Goal prediction bar with `interpolateColor` highlight animation delayed after donut completes.
- **Progress** (`app/(tabs)/progress.tsx`): Weight progress calculated from `startWeight`/`currentWeight`/`targetWeight` (not binary). Encouragement message adapts per `goal` (lose/gain/maintain). BMI visualization with piecewise percent mapping aligned to bar segment flex widths.
- **Profile** (`app/(tabs)/profile.tsx`): Settings list with `SettingItem` (wrapped in `memo()`).
- **CustomTabBar** (`components/CustomTabBar.tsx`): SVG-shaped nav bar with FAB button. Uses `useSafeAreaInsets` for dynamic positioning. All positions (container height, nav items, FAB, overlay padding) computed from `safeBottom`. SVG path, viewBox, and height are memoized.

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
  - `target-date.ts` — calculates estimated goal date from weight difference and weekly speed
  - `calories.ts` — Mifflin-St Jeor BMR, TDEE, daily calorie target, macro split (activity-scaled protein: 1.2-2.2 g/kg), BMI, age calculation. `calculateDailyCalories` enforces a safety floor (`minCal`) for all goals including maintain.

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

### Performance Patterns

- `CustomTabBar`, `SettingItem`, and `DonutChart` are wrapped in `memo()` — preserve this when editing
- Callbacks passed to child components should use `useCallback` for stability
- Avoid inline style objects in render — extract to `StyleSheet.create` or module-level constants
- Static data arrays used in `useMemo`-dependent rendering should themselves be memoized
- Dynamic values derived from `useSafeAreaInsets` should be wrapped in `useMemo`

### Known Workarounds

- `expo-notifications` barrel import is broken in SDK 54 (missing `unregisterForNotificationsAsync`). Import directly from `expo-notifications/build/NotificationPermissions` instead.

### Design Prototypes

- `_design_prototypes/` contains HTML mockups (onboarding and in-app screens) used as visual references for implementation
