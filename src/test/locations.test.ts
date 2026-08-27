import { describe, it, expect } from 'vitest';
import { LabSchema } from '@/data/labs/lab.schema';
import { getLocation, getObject } from '@/features/locations/registry';
import lab01Raw from '@/data/labs/content/lab-01.json';
import lab11Raw from '@/data/labs/content/lab-11-macos-troubleshoot.json';
import lab05Raw from '@/data/labs/content/lab-05-windows-slow.json';

const lab01 = LabSchema.parse(lab01Raw);
const lab11 = LabSchema.parse(lab11Raw);
const lab05 = LabSchema.parse(lab05Raw);

describe('location registry', () => {
  it('reads Lab 01 location (Classroom 12B)', () => {
    const loc = getLocation(lab01);
    expect(loc.id).toBe('faculty-office');
    expect(loc.name).toContain('Classroom 12B');
    expect(loc.objects).toHaveLength(2);
    expect(loc.objects.map((o) => o.id)).toEqual(['faculty-mac', 'campus-phone']);
  });

  it('reads Lab 11 location (IT Office with MacBook)', () => {
    const loc = getLocation(lab11);
    expect(loc.id).toBe('it-office');
    expect(loc.objects).toHaveLength(1);
    expect(loc.objects[0]?.id).toBe('chen-macbook');
  });

  it('reads Lab 05 location (Facilities Office with Windows PC)', () => {
    const loc = getLocation(lab05);
    expect(loc.id).toBe('facilities-office');
    expect(loc.objects).toHaveLength(1);
    expect(loc.objects[0]?.id).toBe('facilities-pc');
  });

  it('looks up a specific object by id', () => {
    const loc = getLocation(lab01);
    const mac = getObject(loc, 'faculty-mac');
    expect(mac?.name).toContain('MacBook');
    const phone = getObject(loc, 'campus-phone');
    expect(phone?.name).toContain('Phone');
  });

  it('returns undefined for an unknown object id', () => {
    const loc = getLocation(lab01);
    expect(getObject(loc, 'not-an-object')).toBeUndefined();
  });

  it('preserves lab-defined state for use by inspectors', () => {
    const loc = getLocation(lab01);
    const mac = getObject(loc, 'faculty-mac');
    expect(mac?.state).toBeDefined();
    // The faculty-mac has a wifi state field
    expect(mac?.state['wifi']).toBeDefined();
  });

  it('preserves the Wi-Fi error and APIPA IP for the faculty Mac', () => {
    const loc = getLocation(lab01);
    const mac = getObject(loc, 'faculty-mac');
    const wifi = mac?.state['wifi'] as { lastAuthError?: string; connected?: boolean };
    expect(wifi.connected).toBe(false);
    expect(wifi.lastAuthError).toMatch(/EAP|802\.1X/);
    expect(mac?.state['ip']).toMatch(/^169\.254/); // APIPA
  });
});
