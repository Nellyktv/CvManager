import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import CvEducationSectionEditor from './CvEducationSectionEditor';

describe('CvEducationSectionEditor', () => {
  it('reorders education with accessible up/down controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CvEducationSectionEditor
        education={[
          { institution: 'BSUIR' },
          { institution: 'MIT' },
        ]}
        onChange={onChange}
      />,
    );

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    await user.click(moveDownButtons[0]);

    expect(onChange).toHaveBeenCalledWith([
      { institution: 'MIT' },
      { institution: 'BSUIR' },
    ]);
  });
});
