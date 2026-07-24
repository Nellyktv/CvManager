# Compact CV workspace

## Goal

Reduce the CV page’s vertical form bulk while preserving a continuously visible, print-like document preview. The page should feel like a focused editor, not a long settings form.

## Scope

- Replace the stacked CV editor with a desktop three-pane workspace.
- Keep the existing dark MUI application shell and light document preview.
- Reuse existing CV section editors, save behavior, i18n, theme, responsive tabs, and PDF export.
- Replace full-width template cards with a compact template trigger and thumbnail popover.

## Desktop layout

```text
[ title · status ]                         [ template · refresh · export ]

[ section rail ] [ active section editor ] [ independently scrolling A4 preview ]
```

### Section rail

- Four MUI list items: Contacts, Skills, Education, Projects.
- Each item shows a label, small item count where relevant, and completion state.
- Selecting an item changes the active editor section without changing the CV data.

### Active editor

- Exactly one section is visible at a time.
- Contacts use a compact responsive field grid.
- Skills, education, and projects retain their existing repeatable entry controls.
- Only the editor pane scrolls; no document-length page scroll is required.

### Document preview

- The A4 preview remains light paper and independently scrollable.
- Selecting a section briefly highlights the corresponding preview section using a subtle non-color-only outline.
- The preview remains the same data-driven template renderer used by PDF export.

## Template selection

- A compact `Template` action in the sticky header opens a thumbnail popover.
- The popover shows the two existing templates with name, short description, and selected state.
- The full-width template picker cards are removed from the editor flow.

## Responsive behavior

- `lg` and up: three persistent panes (vertical section rail, active editor, preview).
- `md` through below `lg`: two persistent panes (editor with a horizontal section rail above it, plus preview) using shrinkable grid columns.
- Below `md`: existing Editor/Preview tabs; within the Editor tab, the section rail is a horizontally scrollable selector.

## Accessibility and interaction

- Section rail uses semantic button/list navigation with visible selected state.
- The template popover supports keyboard selection and returns focus to its trigger.
- Preview highlighting accompanies the active rail selection but does not replace its text selected state.
- Existing save, refresh, publish, and export feedback remains visible in the header.

## Non-goals

- No new design system, fonts, color palette, or template data model.
- No changes to PDF layout, CV content, persistence, or saving behavior.
- No new drag-and-drop interactions.
