import { describe, expect, it } from 'vitest';
import { documentTitle, SITE_TITLE } from '.';

describe('documentTitle', () => {
  it('falls back to the site title', () => expect(documentTitle()).toBe(SITE_TITLE));
  it('combines title, tagline and site', () =>
    expect(documentTitle('Letter Wheel', 'Spin it')).toBe('Letter Wheel — Spin it · Word Games'));
  it('omits a missing tagline', () =>
    expect(documentTitle('Letter Wheel')).toBe('Letter Wheel · Word Games'));
});
