# Compact CV Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertically stacked CV form with a focused section-based editor and a persistent document preview.

**Architecture:** `CvPage` owns the selected CV section. A new section rail drives `CvEditorPanel`, which renders only the selected existing section editor. `lg+` uses a three-pane CSS grid; `md`–below-`lg` uses a two-pane shrinkable grid with a horizontal rail above the editor; below `md` retains Editor/Preview tabs with a horizontal section selector. Template selection moves from the header’s full-width card picker into an accessible thumbnail popover.

**Tech Stack:** React 19, TypeScript, MUI 7, react-i18next, Vitest, Testing Library.

## Global Constraints

- Preserve all current CV data, save/refresh/publish/export behavior and API contracts.
- Keep the dark/light MUI workspace and light document preview split.
- Reuse existing MUI controls and current section editor components; no new design system or dependencies.
- All new labels and accessibility text require EN/RU translations.
- Keep code concise and aligned with existing codebase patterns; avoid unnecessary comments and abstraction.
- Do not commit or push unless explicitly requested.

---

### Task 1: Add typed section navigation and focused editor rendering

**Files:**
- Modify: `client/features/cv/CvPage.constants.ts`
- Modify: `client/features/cv/components/CvEditorPanel.tsx`
- Create: `client/features/cv/components/CvSectionRail.tsx`
- Create: `client/features/cv/components/CvSectionRail.test.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- Produces `CvEditorSection = 'contact' | 'skills' | 'education' | 'projects'`.
- `CvEditorPanel` consumes `activeSection: CvEditorSection`.
- `CvSectionRail` consumes `value`, `onChange`, `content`, and `orientation`.

- [ ] **Step 1: Add failing section-rail tests**

Test that the rail:

```tsx
render(<CvSectionRail value="contact" onChange={onChange} content={cvContentFixture} />);
await user.click(screen.getByRole('button', { name: /education/i }));
expect(onChange).toHaveBeenCalledWith('education');
expect(screen.getByRole('button', { name: /skills/i })).toHaveAccessibleName(/skills.*3/i);
```

Also assert selected state is exposed with `aria-current="step"` or `aria-pressed`, and the mobile orientation is horizontally scrollable.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm run test:run -- client/features/cv/components/CvSectionRail.test.tsx
```

Expected: FAIL because no section rail exists.

- [ ] **Step 3: Add translations and section types**

Add parallel EN/RU keys for section labels, item counts, and completion state. Add:

```ts
export type CvEditorSection = 'contact' | 'skills' | 'education' | 'projects';
```

to `CvPage.constants.ts`.

- [ ] **Step 4: Build the MUI section rail**

Use a `List`/`ListItemButton` composition. Contacts shows completion based on nonblank name/email; the other sections show their item count. Use a vertical rail on `lg+`, and an `overflowX: 'auto'` horizontal row on `md` and mobile.

- [ ] **Step 5: Render only the active editor section**

Replace the unconditional stack in `CvEditorPanel` with an exhaustive section switch. Preserve each existing section editor, its change handler, reorder controls, disabled state, and data shape.

- [ ] **Step 6: Verify focused editing**

Run:

```bash
npm run test:run -- client/features/cv/components/CvSectionRail.test.tsx
npm run build
```

Expected: section rail tests and TypeScript build pass.

---

### Task 2: Move template selection into a compact accessible popover

**Files:**
- Modify: `client/features/cv/components/CvTemplatePicker.tsx`
- Modify: `client/features/cv/components/CvWorkspaceHeader.tsx`
- Modify: `client/features/cv/components/CvTemplatePicker.test.tsx`
- Modify: `client/features/cv/components/CvWorkspaceHeader.test.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- `CvTemplatePicker` becomes a compact trigger plus `Menu`/`Popover`.
- `CvWorkspaceHeader` continues to own all action controls and passes template props unchanged.

- [ ] **Step 1: Write failing popover tests**

Test:

```tsx
await user.click(screen.getByRole('button', { name: /template/i }));
expect(screen.getByRole('menu')).toBeVisible();
await user.click(screen.getByRole('menuitemradio', { name: /structured minimal/i }));
expect(onChange).toHaveBeenCalledWith('structured-minimal');
expect(screen.queryByRole('menu')).not.toBeInTheDocument();
```

Also assert selected state and focus return to the trigger on close.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm run test:run -- client/features/cv/components/CvTemplatePicker.test.tsx
```

Expected: FAIL because the current picker renders permanent radiocard surfaces.

- [ ] **Step 3: Implement compact trigger and thumbnail menu**

Use a text `Template` button with current template name and a MUI `Menu`. Keep miniature template previews in each `MenuItem`; use `role="menuitemradio"` and selected text/icon state. Remove full-width picker rendering from below workspace alerts.

- [ ] **Step 4: Verify header compactness**

Run:

```bash
npm run test:run -- client/features/cv/components/CvTemplatePicker.test.tsx client/features/cv/components/CvWorkspaceHeader.test.tsx
npm run build
```

Expected: picker/header tests and build pass.

---

### Task 3: Compose responsive three-pane workspace and preview linkage

**Files:**
- Modify: `client/features/cv/CvPage.tsx`
- Modify: `client/features/cv/components/CvPreviewPanel.tsx`
- Modify: `client/features/cv/components/CvMobileTabs.tsx`
- Modify: `client/features/cv/preview/CvDocumentFrame.tsx`
- Modify: `client/features/cv/preview/EditorialSidebarPreview.tsx`
- Modify: `client/features/cv/preview/StructuredMinimalPreview.tsx`
- Create: `client/features/cv/CvPage.test.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- `CvPage` owns `activeSection`.
- Preview receives `highlightedSection?: CvEditorSection`.
- `lg+` layout uses rail/editor/preview panes; `md` uses editor+preview with a horizontal rail above the editor; mobile passes rail + active editor through existing Editor tab.

- [ ] **Step 1: Write failing layout and linkage tests**

Test desktop and mobile behavior:

```tsx
render(<CvPage />, { wrapper: renderWithCvRoute('/cv/2') });
expect(screen.getByRole('navigation', { name: /cv sections/i })).toBeVisible();
await user.click(screen.getByRole('button', { name: /projects/i }));
expect(screen.getByTestId('cv-preview-projects')).toHaveAttribute('data-highlighted', 'true');
```

Mock `useMediaQuery` for desktop/mobile and assert mobile retains only Editor/Preview tabs while section selection remains inside the editor panel.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test:run -- client/features/cv/CvPage.test.tsx
```

Expected: FAIL because the current page has only a two-column split and no active section state.

- [ ] **Step 3: Implement desktop pane composition**

Use a flex page shell (nonshrinking header + `flex: 1` / `minHeight: 0` workspace) and a MUI `Box` CSS grid from `md` up:

```ts
// lg+
gridTemplateColumns: 'minmax(0, 176px) minmax(0, 1fr) minmax(0, 1.2fr)';
// md through below lg
gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)';
```

Avoid nested `100dvh` / hard height calcs. At `lg+`, keep a vertical rail; at `md`, put a horizontal rail above the editor. Make each visible pane independently scrollable and retain all existing save/error/publish/export feedback.

- [ ] **Step 4: Add preview section linkage**

Pass `highlightedSection` into both web templates. Mark the matching document section with a data attribute and a brief, reduced-motion-safe outline/background shift. Preserve semantic headings and do not alter PDF renderers.

- [ ] **Step 5: Implement mobile composition**

Inside the existing Editor tab, render the horizontal rail above the active editor. Keep the Preview tab and its A4 panel unchanged except for section highlight state when it becomes visible.

- [ ] **Step 6: Verify the workspace**

Run:

```bash
npm run test:run -- client/features/cv
npm run build
```

Expected: CV tests and production build pass. Manually check one long project description: the editor and document scroll independently with no page-length form scroll.

---

## Final verification

Run:

```bash
npm run test:run
npm run build
```

Manual checks:

1. Section navigation changes only editor focus, not CV data.
2. Contacts, skills, education, and projects remain editable and autosave as before.
3. Template popover is keyboard operable and changes the live preview.
4. Desktop preview remains visible while the editor scrolls.
5. Mobile retains Editor/Preview tabs and horizontal section selection.
6. EN/RU and light/dark workspace modes remain coherent; the document remains light paper.
