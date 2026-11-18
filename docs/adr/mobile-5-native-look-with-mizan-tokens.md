# ADR mobile-5 — The phone app looks native, in Mizan's colours

- Date: 2026-11-19
- Status: accepted; supersedes the UI part of ADR mobile-1 (NativeWind and react-native-reusables)
- Task: T-mobile-app (Phase 4)

## Context
ADR mobile-1 planned the web's shadcn look on phones through NativeWind and
react-native-reusables. Expo's own guidance (the `expo-design-system`, `expo-native-ui` and
`expo-ui` skills) is the opposite: platform semantic colours, native headers, sheets and controls,
and one token theme. NativeWind would also be another layer to keep in step with React Native 0.88.
The owner chose (2026-11-19) "native, Mizan colours" over a shadcn clone.

## Decision
- One theme entry point, `mobile/src/theme`: platform semantic colours for backgrounds, labels and
  separators (they follow light and dark by themselves); a small brand palette taken from the
  web's shadcn tokens (`web/src/index.css`, OKLCH converted to hex) for primary, destructive and
  chart colours, light and dark pairs read through `useBrandColors()`; a 4-point spacing scale,
  the platform text ramp (Dynamic Type stays on), and radii.
- A few primitives in `mobile/src/components`: `Button` (primary, secondary, ghost, destructive),
  `TextField`, `ThemedText`, `Screen`, `Row` and `Group`. Screens import components, not raw
  values; hex colours and font sizes live only in the theme.
- Navigation chrome is native: stack headers with their own buttons, form sheets for composing
  (`presentation: "formSheet"` declared in the root stack), grouped lists instead of cards.
- Arabic and right-to-left come from the platform: `expo-localization` with `supportsRTL` and
  `supportedLocales: ["en", "ar"]`, so each phone has a per-app language in system settings and
  the layout mirrors when it is Arabic.

## Consequences
- The apps read as one product (same blue, same red, same chart colours) without the phone
  imitating a web page.
- No Tailwind on phones: a web class name cannot be copied over; screens are rebuilt with the
  primitives in Phase 5.
- Hermes ignores the `-u-nu-latn` hint, so `formatMoney` converts Arabic-Indic digits when the
  digit preference is Western; dates still follow `Intl` and show Arabic-Indic digits in Arabic.
