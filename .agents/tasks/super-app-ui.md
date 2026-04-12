# xPay Super App UI — Implementation Plan

## Principles

- **Component-based**: Every visual section is its own component file in `src/components/`.
- **Shadcn primitives**: Use `Drawer`, `DrawerContent`, `DrawerHeader`, etc. from `~/components/ui/drawer` (wraps vaul). Use `Dialog` from `~/components/ui/dialog` for the kill-switch confirmation. No raw `vaul` imports in feature code.
- **No HTML nesting soup**: Route files are thin orchestrators — they import and compose named components. No inline `<div>` blocks deeper than ~2 levels in route files.
- **Tailwind v4 style**: Use `shrink-0` (not `flex-shrink-0`), `bg-linear-to-br` (not `bg-gradient-to-br`).

---

## File Map

### New components to create

| File                                        | Purpose                                              |
| ------------------------------------------- | ---------------------------------------------------- |
| `components/guard/guard-hero.tsx`           | Status hero card with shield icon + toggle           |
| `components/guard/daily-allowance.tsx`      | Slider + progress bar for daily XLM limit            |
| `components/guard/approved-agents.tsx`      | Approved agents list with usage bars                 |
| `components/guard/kill-switch-dialog.tsx`   | Shadcn Dialog for emergency kill switch confirmation |
| `components/activity/activity-header.tsx`   | Title + refresh button                               |
| `components/activity/search-filter-bar.tsx` | Search input + filter pills                          |
| `components/activity/transaction-list.tsx`  | Grouped transaction list + skeleton + empty          |
| `components/activity/tx-detail-drawer.tsx`  | Shadcn Drawer for transaction detail                 |

### Files to refactor

| File                                  | Change                                      |
| ------------------------------------- | ------------------------------------------- |
| `routes/(public)/_public/guard.tsx`   | Thin shell composing guard/\* components    |
| `routes/(public)/_public/history.tsx` | Thin shell composing activity/\* components |
| `components/allowance-drawer.tsx`     | Switch from raw `vaul` to shadcn `Drawer*`  |
| `components/bottom-nav.tsx`           | Already done ✓                              |
| `components/guard-status-widget.tsx`  | Fix lint (shrink-0)                         |
| `routes/(public)/_public/index.tsx`   | Already done ✓                              |

---

## Execution Order

1. Create `components/guard/*` (4 files)
2. Rewrite `guard.tsx` route as thin shell
3. Create `components/activity/*` (4 files)
4. Rewrite `history.tsx` route as thin shell
5. Refactor `allowance-drawer.tsx` to use shadcn Drawer
6. Fix all remaining lint warnings (shrink-0, bg-linear-to-br)
