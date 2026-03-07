# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Calobite" — a React Native calorie tracking app built with Expo SDK 54 and expo-router v6 (file-based routing). Users photograph meals for automatic calorie tracking. The app has a multi-step onboarding flow (26 screens) and a tabbed main interface.

## Commands

- `npx expo start` — start the dev server
- `npx expo start --android` / `--ios` / `--web` — start for a specific platform
- `npm run lint` (runs `expo lint`) — lint with ESLint flat config
- `npm run reset-project` — moves starter code to `app-example/` and creates a blank `app/`

No test runner is configured.

## Architecture

### Routing (expo-router, file-based)

- `app/_layout.tsx` — Root Stack: wrapped in `GestureHandlerRootView`, loads Nunito fonts from Google Fonts URLs, manages splash screen
- `app/index.tsx` — Entry redirect: sends to `/(tabs)` if onboarding complete, else `/onboarding`
- `app/onboarding/_layout.tsx` — Stack with `slide_from_right` transitions; 26 screens across 3 phases (Basics, Body & Goals, Lifestyle) plus transitions, plan generation, account creation, and paywall
- `app/(tabs)/_layout.tsx` — Bottom tabs (home, progress, profile) with a custom tab bar (`CustomTabBar`)

### State Management

- Zustand store at `store/onboarding-store.ts` — holds all onboarding data (`OnboardingPayload`) and completion state. Not persisted (resets on app restart).
- Notable store fields: `weekendDays` is `string[]` (array of day names), `weeklyGoalSpeed` is a number (kg/week), `activityLevel` is `ActivityLevel` (sedentary/light/moderate/active/very_active).

### Theming & Styling

- `constants/theme.ts` — single `Theme` object (`as const`) with colors, fonts (Nunito family), and border radii. Warm palette: coral primary (`#E2856E`), cream background (`#FFFAF5`), muted text `#6B4A40` (WCAG AA compliant).
- All styling uses `StyleSheet.create` with `Theme` constants. No external styling library.
- Always use `Theme.colors.*` — never hardcode hex values like `#FFFFFF` (use `Theme.colors.white`) or `#000` (use `Theme.colors.textDark` for shadows).
- Always use `Theme.borderRadius.card` (20) / `Theme.borderRadius.button` (20) — never hardcode `borderRadius: 16` or `15`.
- Card-like elements use `borderWidth: 2` consistently (not 1 or 1.5).

### Key Conventions

- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)
- TypeScript strict mode enabled
- React Compiler and typed routes are enabled (`app.json` experiments)
- New Architecture enabled (`newArchEnabled: true`)
- Reusable onboarding components in `components/onboarding/` (ProgressHeader, OnboardingButton, ListButton, CardOption, UnitToggle, ScrollPicker)
- Shared utilities in `utils/`:
  - `target-date.ts` — calculates estimated goal date from weight difference and weekly speed
  - `calories.ts` — Mifflin-St Jeor BMR, TDEE, daily calorie target, macro split (activity-scaled protein: 1.2-2.2 g/kg), BMI, age calculation. Scientific references: Mifflin et al. (1990), ACSM, ISSN.

### ScrollPicker Component

The `ScrollPicker` uses scroll-offset-based selection (`Math.round(contentOffset.y / ITEM_HEIGHT)`). Do NOT use `onViewableItemsChanged` — it unreliably detects the center item. Apple-style design: thin separator lines, opacity fade, bold for selected. For multi-picker screens, use `hideLines` prop and render shared separator lines in the parent `pickerRow`. Exports `PICKER_ITEM_HEIGHT`, `PICKER_VISIBLE_ITEMS`, `PICKER_CENTER` for parent layout.

### Goal-dependent Onboarding Flow

The onboarding path adapts based on `goal` (lose/gain/maintain):
- **Maintain**: skips `goal-weight`, `realistic-target`, `goal-speed`, `projection` — goes straight from `current-weight` to `transition2`. Target weight = current weight.
- **Gain**: `goal-weight` picker starts at currentWeight+1 (min), `realistic-target` says "Gaining", `goal-speed` says "Gain weight speed", `roadblocks` shows gain-specific options.
- **Lose**: default path, picker capped at currentWeight-1 (max).
- Screen text (accomplish, roadblocks, weekends, diet-adjustment, burned-calories, projection, custom-plan, generating) adapts per goal.

### Navigation Patterns

- `generating.tsx` uses `router.replace` (not push) to navigate to `custom-plan` — prevents back-loop where the auto-timer re-fires
- Back button touch targets must be at least 44x44px with `hitSlop` — smaller targets are untappable on real devices
- Back buttons must have `accessibilityLabel="Go back"` and `accessibilityRole="button"`, with the `<` text marked `accessible={false}`
- Bottom action padding: all onboarding screens use `paddingBottom: 36`

### Accessibility Standards

- All decorative emojis and icons must have `accessible={false}`
- Interactive elements need `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` where applicable
- `UnitToggle` uses `accessibilityRole="radiogroup"`, individual options use `accessibilityRole="radio"`
- `ScrollPicker` has `accessibilityRole="adjustable"` with value in the label (uses `?? ''` for bounds safety)
- `ProgressHeader` bar uses `accessibilityRole="progressbar"` with `accessibilityValue`
- Data cards (calories, macros, BMI) should have consolidated `accessibilityLabel` combining their values
- SVG decorative backgrounds use `accessible={false}`

### Performance Patterns

- `CustomTabBar` and `SettingItem` are wrapped in `memo()` — preserve this when editing
- Callbacks passed to child components should use `useCallback` for stability
- Avoid inline style objects in render — extract to `StyleSheet.create` or module-level constants
- Static data arrays used in `useMemo`-dependent rendering should themselves be memoized

### Known Workarounds

- `expo-notifications` barrel import is broken in SDK 54 (missing `unregisterForNotificationsAsync`). Import directly from `expo-notifications/build/NotificationPermissions` instead.

### Design Prototypes

- `_design_prototypes/` contains HTML mockups (onboarding and in-app screens) used as visual references for implementation
