# Future Features & Design Decisions

Items surfaced during code reviews that require product decisions before implementation. Not bugs — these are enhancements and design considerations.

## Streak System

### Streak Freeze / Grace Day
**Source:** Scientific review (behavioral science research)
**Problem:** Missing 1 day destroys months of streak progress. Research shows loss aversion is 2-3x stronger than reward (Kray & Haselhuhn 2007). Users who lose a long streak often abandon the habit entirely rather than rebuild.
**Options:**
- Allow 1 "freeze" per month — skip a day without breaking the streak
- 48-hour leeway window — log within 2 days to keep streak alive
- Show weekly consistency % alongside streak to shift focus from perfection to consistency

### Extend Streak to All Activity Types
**Source:** Scientific + Business Flow reviews
**Problem:** Only meal logging counts toward the streak. Exercise and weight logging are ignored. Research shows holistic tracking improves adherence 40-50% (Gollwitzer 2016).
**Options:**
- Rename to "Activity Streak" — any log type (meal, exercise, weight) counts
- Dual streaks — separate "Meal Streak" and "Activity Streak"
- User-configurable — settings toggle for what counts

### Show Longest Streak
**Source:** UI/UX review
**Problem:** `longestStreak` is tracked in the store but never displayed anywhere. Showing it adds motivation ("Best: 23 days") and softens the blow of a broken streak.
**Action:** Add "Best: N days" below the streak title or in the card footer.

### Streak vs Dots Clarification
**Source:** UI/UX + Business Flow reviews
**Problem:** The streak number counts consecutive days (can span weeks), but the dots show only this week's meal logs. A "15-day streak" with 3 dots lit could confuse users.
**Options:**
- Add a subtle label: "This week" above the dots
- Separate the metrics: "15-day streak · 3 meals this week"
- Replace dots with a calendar grid showing the full streak period

### Streak Card Visual Prominence
**Source:** UI/UX + Design reviews
**Problem:** Streak number (14px) is much smaller than weight value (24px). The medal icon takes space without adding info. Card feels sparser than the weight card beside it.
**Options:**
- Increase streak number to 20-22px
- Remove medal icon, use reclaimed space for larger number
- Add secondary metric (longest streak, weekly progress) for density balance

## Progress Screen

### Maintain Goal — Weight Card UX
**Source:** UI/UX review
**Problem:** For maintain users, the progress bar is always 100% and goal weight equals current weight. This looks like a completed goal rather than ongoing maintenance.
**Options:**
- Replace progress bar with "Weight Maintenance Range" (e.g., +/-2 kg)
- Hide progress bar for maintain, show "Maintaining at X kg" instead
- Show weight variance over time instead of progress toward a target

### Weigh-in Frequency
**Source:** Scientific review
**Problem:** 7-day weigh-in cycle is hardcoded. Weekly is scientifically defensible but not user-configurable. Some users prefer daily, others bi-weekly.
**Action:** Consider adding weigh-in frequency preference in settings (daily, weekly, bi-weekly).
