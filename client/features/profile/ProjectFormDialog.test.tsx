import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test/renderWithProviders';
import type { CvLink } from '../../shared/types/cv';
import ProjectFormDialog from './ProjectFormDialog';
import {
  initialProjectForm,
  type ProjectFormValues,
} from './ProfilePage.constants';

type HarnessProps = {
  initial?: ProjectFormValues;
  editId?: number | null;
  saving?: boolean;
  onSave?: (form: ProjectFormValues) => void;
  onClose?: () => void;
};

const Harness = ({
  initial = initialProjectForm,
  editId = null,
  saving = false,
  onSave = () => {},
  onClose = () => {},
}: HarnessProps) => {
  const [form, setForm] = useState(initial);

  return (
    <ProjectFormDialog
      open
      editId={editId}
      form={form}
      onChange={setForm}
      onClose={onClose}
      onSave={() => onSave(form)}
      saving={saving}
    />
  );
};

/** Mirrors ProfilePage: close only after a successful save. */
const KeepOpenHarness = ({
  initial = { ...initialProjectForm, title: 'CV Manager' },
  onSaveImpl,
}: {
  initial?: ProjectFormValues;
  onSaveImpl: (form: ProjectFormValues) => Promise<boolean>;
}) => {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await onSaveImpl(form);
      if (saved) setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return <div>closed</div>;

  return (
    <ProjectFormDialog
      open
      editId={null}
      form={form}
      onChange={setForm}
      onClose={() => setOpen(false)}
      onSave={handleSave}
      saving={saving}
    />
  );
};

const twoLinks: CvLink[] = [
  { label: 'GitHub', url: 'https://github.com/example/one' },
  { label: 'Demo', url: 'https://example.com/demo' },
];

describe('ProjectFormDialog', () => {
  it('loads and keeps every link row so edits cannot truncate the array', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <Harness
        editId={3}
        initial={{
          ...initialProjectForm,
          title: 'CV Manager',
          links: twoLinks,
        }}
        onSave={onSave}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('https://github.com/example/one')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('https://example.com/demo')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        links: twoLinks,
      }),
    );
  });

  it('supports adding and removing validated link rows', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <Harness
        initial={{
          ...initialProjectForm,
          title: 'CV Manager',
          links: [{ label: 'GitHub', url: 'https://github.com/example/one' }],
        }}
        onSave={onSave}
      />,
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: /add link/i }));

    const urlFields = within(dialog).getAllByLabelText(/link url/i);
    expect(urlFields).toHaveLength(2);

    await user.type(urlFields[1], 'https://example.com/two');

    const removeButtons = within(dialog).getAllByRole('button', {
      name: /remove link/i,
    });
    await user.click(removeButtons[0]);

    expect(within(dialog).getAllByLabelText(/link url/i)).toHaveLength(1);
    expect(within(dialog).getByDisplayValue('https://example.com/two')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        links: [{ label: '', url: 'https://example.com/two' }],
      }),
    );
  });

  it('validates title, link URLs, and date range before submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <Harness
        initial={{
          ...initialProjectForm,
          title: '',
          startDate: '2024-06-01',
          endDate: '2024-01-01',
          links: [{ label: 'Bad', url: 'not-a-url' }],
        }}
        onSave={onSave}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(await within(dialog).findByText(/project title is required/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/valid url/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/end date must be on or after start date/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables Save and Cancel while saving', async () => {
    renderWithProviders(
      <Harness
        saving
        initial={{ ...initialProjectForm, title: 'CV Manager' }}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /save/i })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('ignores Escape and backdrop onClose while saving', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <Harness
        saving
        initial={{ ...initialProjectForm, title: 'CV Manager' }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('rejects raw HTML in descriptionMarkdown before submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <Harness
        initial={{
          ...initialProjectForm,
          title: 'CV Manager',
          descriptionMarkdown: 'Built <strong>it</strong>.',
          links: [],
        }}
        onSave={onSave}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(
      await within(dialog).findByText(/must not contain html/i),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and form state when save fails', async () => {
    const user = userEvent.setup();
    const onSaveImpl = vi.fn(async () => false);

    renderWithProviders(
      <KeepOpenHarness
        initial={{
          ...initialProjectForm,
          title: 'Keep Me',
          role: 'Engineer',
          links: [],
        }}
        onSaveImpl={onSaveImpl}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('Keep Me')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSaveImpl).toHaveBeenCalled());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByDisplayValue('Keep Me')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByDisplayValue('Engineer')).toBeInTheDocument();
    expect(screen.queryByText('closed')).not.toBeInTheDocument();
  });
});
