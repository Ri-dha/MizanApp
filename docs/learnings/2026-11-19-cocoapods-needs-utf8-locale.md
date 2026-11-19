# 2026-11-19 — mobile iOS build
`npx expo run:ios` (and `pod install`) can fail with `Unicode Normalization not appropriate for
ASCII-8BIT (Encoding::CompatibilityError)` from CocoaPods under Homebrew Ruby 4 when the shell has
no UTF-8 locale. Run with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`; nothing in the project is wrong.
Source: T-mobile-app, Phase 6 step 2
