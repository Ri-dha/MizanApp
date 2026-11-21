# T-home-templates — Home cards from templates
- Status: in review
- Context: user request 2026-11-21: add and remove cards from templates, more than one of a kind, rename them, and
  limit a cash card to some accounts. Extends ADR home-1.
- Notes: `HomeWidget` gains `id`, `title` and `pick`; cards saved before take their kind as id. `addWidget`,
  `removeWidget` (the last of a kind stays hidden so an older app still finds one of each), `pickedFrom`,
  `shownWidgets`; move, place and update work by id. Cash cards pick accounts, goals cards goals, debts cards debts.
  Web: Settings → Home screen lists the shown cards with a name field, remove, the picker and "Add a card"; Home draws
  each card by id with its name and picks. Phone: Home and its settings work by id and show names and picks; adding,
  removing, renaming and picking are web-only for now.
