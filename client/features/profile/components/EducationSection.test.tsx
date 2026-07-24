import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import EducationSection from './EducationSection';

const educationApi = vi.hoisted(() => ({
  getEducations: vi.fn(),
  createEducation: vi.fn(),
  updateEducation: vi.fn(),
  deleteEducation: vi.fn(),
}));

vi.mock('../../../api/education.api', () => educationApi);

describe('EducationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    educationApi.getEducations.mockResolvedValue({ educations: [] });
    educationApi.createEducation.mockResolvedValue({
      education: {
        id: 1,
        institution: 'BSUIR',
        degree: null,
        field: null,
        location: null,
        startDate: null,
        endDate: null,
        description: null,
        displayOrder: 0,
      },
    });
  });

  it('shows an empty-state CTA and opens the add dialog for owners', async () => {
    const user = userEvent.setup();

    renderWithProviders(<EducationSection canEdit />);

    expect(await screen.findByText(/no education yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add education/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/institution/i)).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /save/i }),
    ).toBeInTheDocument();
  });

  it('opens edit dialog for an existing education row', async () => {
    const user = userEvent.setup();
    educationApi.getEducations.mockResolvedValue({
      educations: [
        {
          id: 7,
          institution: 'Vilnius University',
          degree: 'BSc',
          field: 'CS',
          location: 'Vilnius',
          startDate: '2018-09-01',
          endDate: '2022-06-01',
          description: 'Thesis',
          displayOrder: 0,
        },
      ],
    });

    renderWithProviders(<EducationSection canEdit />);

    expect(await screen.findByText('Vilnius University')).toBeInTheDocument();

    const checkboxes = await screen.findAllByRole('checkbox');
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('Vilnius University')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('BSc')).toBeInTheDocument();
  });

  it('hides owner-only controls for read-only viewers', async () => {
    educationApi.getEducations.mockResolvedValue({
      educations: [
        {
          id: 7,
          institution: 'Vilnius University',
          degree: 'BSc',
          field: 'CS',
          location: 'Vilnius',
          startDate: '2018-09-01',
          endDate: '2022-06-01',
          description: 'Thesis',
          displayOrder: 0,
        },
      ],
    });

    renderWithProviders(<EducationSection canEdit={false} />);

    expect(await screen.findByText('Vilnius University')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add education/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
  });

  it('keeps the dialog open and form state when save fails', async () => {
    const user = userEvent.setup();
    educationApi.createEducation.mockImplementation(() =>
      Promise.reject(new Error('network')),
    );

    renderWithProviders(<EducationSection canEdit />);

    expect(await screen.findByText(/no education yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add education/i }));

    const dialog = await screen.findByRole('dialog');
    const institution = within(dialog).getByLabelText(/^institution/i);

    await act(async () => {
      fireEvent.change(institution, { target: { value: 'BSUIR' } });
    });
    expect(institution).toHaveValue('BSUIR');

    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(educationApi.createEducation).toHaveBeenCalledWith(
        expect.objectContaining({ institution: 'BSUIR' }),
      ),
    );

    await waitFor(() => {
      expect(screen.getAllByText(/something went wrong/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByLabelText(/^institution/i)).toHaveValue(
      'BSUIR',
    );
  });

});







