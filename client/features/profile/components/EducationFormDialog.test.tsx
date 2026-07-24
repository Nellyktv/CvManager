import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import {
  initialEducationForm,
  type EducationFormValues,
} from '../ProfilePage.constants';
import EducationFormDialog from './EducationFormDialog';

type HarnessProps = {
  initial?: EducationFormValues;
  saving?: boolean;
  onClose?: () => void;
  onSave?: () => void;
};

const Harness = ({
  initial = initialEducationForm,
  saving = false,
  onClose = () => {},
  onSave = () => {},
}: HarnessProps) => {
  const [form, setForm] = useState(initial);

  return (
    <EducationFormDialog
      open
      editId={null}
      form={form}
      onChange={setForm}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
    />
  );
};

describe('EducationFormDialog', () => {
  it('ignores Escape and backdrop onClose while saving', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <Harness
        saving
        initial={{ ...initialEducationForm, institution: 'BSUIR' }}
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

  it('rejects end date earlier than start date before submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <Harness
        initial={{
          ...initialEducationForm,
          institution: 'BSUIR',
          startDate: '2024-06-01',
          endDate: '2024-01-01',
        }}
        onSave={onSave}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(
      await within(dialog).findByText(/end date must be on or after start date/i),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
