import { describe, expect, it } from 'vitest';
import {
    containsHtmlTags,
    validateCvContent,
    validateCvUpdate,
    validateProjectCreate,
    validateEducationCreate,
    validateProfileUpdate,
} from './cvContentSchema.js';

const validContent = () => ({
    contact: {
        name: 'Ivan Ivanov',
        email: 'ivan@demo.com',
        links: [{ label: 'GitHub', url: 'https://github.com/ivan' }],
    },
    skills: [{ label: 'React', value: 'Advanced' }],
    education: [{ institution: 'MSU' }],
    projects: [{ title: 'Store', links: [], descriptionMarkdown: 'Built a **store**' }],
});

describe('containsHtmlTags', () => {
    it.each(['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'text <b>bold</b>', '</div>'])(
        'detects HTML in %s',
        (value) => {
            expect(containsHtmlTags(value)).toBe(true);
        },
    );

    it.each(['Array<T>', 'List<a> and Map<K, V>', 'a < b and c > d', '**bold** and *italic*'])(
        'does not flag %s',
        (value) => {
            expect(containsHtmlTags(value)).toBe(false);
        },
    );
});

describe('validateCvContent', () => {
    it('accepts valid content', () => {
        expect(() => validateCvContent(validContent())).not.toThrow();
    });

    it('rejects HTML in a project description', () => {
        const content = validContent();
        content.projects[0].descriptionMarkdown = 'Hi <script>alert(1)</script>';

        expect(() => validateCvContent(content)).toThrow();
    });

    it('rejects javascript: links', () => {
        const content = validContent();
        content.contact.links = [{ label: 'x', url: 'javascript:alert(1)' }];

        expect(() => validateCvContent(content)).toThrow();
    });

    it('rejects content without required sections', () => {
        const { contact } = validContent();

        expect(() => validateCvContent({ contact })).toThrow();
    });
});

describe('validateCvUpdate', () => {
    it('requires content or templateKey', () => {
        expect(() => validateCvUpdate({})).toThrow();
    });

    it('accepts a known template', () => {
        expect(validateCvUpdate({ templateKey: 'structured-minimal' })).toEqual({
            templateKey: 'structured-minimal',
        });
    });

    it('rejects an unknown template', () => {
        expect(() => validateCvUpdate({ templateKey: 'fancy' })).toThrow();
    });
});

describe('project and education dates', () => {
    it('rejects an end date before the start date', () => {
        expect(() =>
            validateProjectCreate({ title: 'App', startDate: '2024-05-01', endDate: '2023-01-01' }),
        ).toThrow();
    });

    it('accepts a valid date range', () => {
        expect(() =>
            validateEducationCreate({ institution: 'MSU', startDate: '2018-09-01', endDate: '2022-06-30' }),
        ).not.toThrow();
    });

    it('rejects a date in a wrong format', () => {
        expect(() => validateEducationCreate({ institution: 'MSU', startDate: '01.09.2018' })).toThrow();
    });

    it('requires a project title', () => {
        expect(() => validateProjectCreate({ title: '' })).toThrow();
    });
});

describe('validateProfileUpdate', () => {
    it('allows empty optional fields', () => {
        expect(() => validateProfileUpdate({ publicEmail: '', linkedinUrl: null })).not.toThrow();
    });

    it('rejects an invalid email and a non-http link', () => {
        expect(() => validateProfileUpdate({ publicEmail: 'not-an-email' })).toThrow();
        expect(() => validateProfileUpdate({ githubUrl: 'ftp://github.com/ivan' })).toThrow();
    });
});
