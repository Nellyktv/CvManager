import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import CvSkillsSectionEditor from './CvSkillsSectionEditor';

describe('CvSkillsSectionEditor', () => {
  it('reorders skills with accessible up/down controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvSkillsSectionEditor
        skills={[
          { label: 'React' },
          { label: 'TypeScript' },
          { label: 'Node' },
        ]}
        onChange={onChange}
      />,
    );

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });

    expect(moveDownButtons).toHaveLength(3);
    expect(moveUpButtons).toHaveLength(3);
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[2]).toBeDisabled();

    await user.click(moveDownButtons[0]);
    expect(onChange).toHaveBeenCalledWith([
      { label: 'TypeScript' },
      { label: 'React' },
      { label: 'Node' },
    ]);

    onChange.mockClear();
    await user.click(moveUpButtons[2]);
    expect(onChange).toHaveBeenCalledWith([
      { label: 'React' },
      { label: 'Node' },
      { label: 'TypeScript' },
    ]);
  });
});
