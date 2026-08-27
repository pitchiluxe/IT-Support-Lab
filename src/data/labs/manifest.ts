import { SKILL_AREAS } from '@/data/skills/areas';

/**
 * Canonical lab manifest. The single source of truth for how many labs there are
 * and what they cover. This reconciles:
 *   - 01_Lab_Roadmap.md (36 labs across 9 phases)
 *   - 16_Lab_Tracker.csv (48 labs)
 *   - MASTER_PROMPT_FOR_CLAUDE.md (48 labs + capstone)
 *
 * For MVP we define the manifest with placeholders for un-authored labs. Lab
 * 01 is the only one fully authored. The validator in scripts/validate-labs.ts
 * will report which manifests are still awaiting content.
 *
 * Each entry references a JSON file by id under src/data/labs/content/.
 */

export interface ManifestEntry {
  id: string;
  title: string;
  week: number;
  track: string;
  order: number;
  skills: readonly string[];
  /** Path under src/data/labs/content/. null = not yet authored. */
  contentPath: string | null;
}

export const LAB_MANIFEST: readonly ManifestEntry[] = [
  // ─────────────────────────────────────────────────────────────
  // Phase 1 — Service Desk Foundations (Labs 01–04)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-01',
    title: 'Faculty Laptop Cannot Connect to Wi-Fi',
    week: 1,
    track: 'service-desk',
    order: 1,
    skills: ['customer-service', 'ticketing', 'networking'],
    contentPath: 'lab-01.json',
  },
  {
    id: 'lab-02',
    title: 'Urgent Classroom Outage',
    week: 1,
    track: 'service-desk',
    order: 2,
    skills: ['customer-service', 'ticketing', 'classroom-tech'],
    contentPath: 'lab-02.json',
  },
  {
    id: 'lab-03',
    title: 'Parent Technology Support',
    week: 1,
    track: 'service-desk',
    order: 3,
    skills: ['customer-service', 'ticketing'],
    contentPath: 'lab-03.json',
  },
  {
    id: 'lab-04',
    title: 'Complex Escalation',
    week: 1,
    track: 'service-desk',
    order: 4,
    skills: ['customer-service', 'ticketing', 'incident-response'],
    contentPath: 'lab-04.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 2 — Windows Support (Labs 05–10)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-05-windows-slow',
    title: 'Windows 11 Slow Computer',
    week: 2,
    track: 'windows',
    order: 5,
    skills: ['windows', 'ticketing', 'documentation'],
    contentPath: 'lab-05-windows-slow.json',
  },
  {
    id: 'lab-06',
    title: 'Windows Application Will Not Launch',
    week: 2,
    track: 'windows',
    order: 6,
    skills: ['windows', 'ticketing'],
    contentPath: 'lab-06.json',
  },
  {
    id: 'lab-07',
    title: 'Windows User Profile Problem',
    week: 2,
    track: 'windows',
    order: 7,
    skills: ['windows', 'ticketing'],
    contentPath: 'lab-07.json',
  },
  {
    id: 'lab-08',
    title: 'Build a Standard Windows Workstation',
    week: 3,
    track: 'windows',
    order: 8,
    skills: ['windows', 'hardware-lifecycle', 'documentation'],
    contentPath: 'lab-08.json',
  },
  {
    id: 'lab-09',
    title: 'Windows Upgrade',
    week: 3,
    track: 'windows',
    order: 9,
    skills: ['windows', 'projects', 'documentation'],
    contentPath: 'lab-09.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 3 — Apple Support (Labs 11–16)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-11-macos-troubleshoot',
    title: 'macOS No Internet',
    week: 3,
    track: 'apple',
    order: 11,
    skills: ['apple', 'networking', 'ticketing', 'documentation'],
    contentPath: 'lab-11-macos-troubleshoot.json',
  },
  {
    id: 'lab-10',
    title: 'macOS Performance Issue',
    week: 3,
    track: 'apple',
    order: 10,
    skills: ['apple', 'ticketing'],
    contentPath: 'lab-10.json',
  },
  {
    id: 'lab-12',
    title: 'macOS Application Support',
    week: 4,
    track: 'apple',
    order: 12,
    skills: ['apple', 'ticketing'],
    contentPath: 'lab-12.json',
  },
  {
    id: 'lab-13',
    title: 'iPhone/iPad Enrollment',
    week: 4,
    track: 'apple',
    order: 13,
    skills: ['apple', 'mdm', 'ticketing'],
    contentPath: 'lab-13.json',
  },
  {
    id: 'lab-14',
    title: 'Lost iPhone/iPad',
    week: 4,
    track: 'apple',
    order: 14,
    skills: ['apple', 'mdm', 'hardware-lifecycle'],
    contentPath: 'lab-14.json',
  },
  {
    id: 'lab-15',
    title: 'Apple Update and Device Lifecycle',
    week: 5,
    track: 'apple',
    order: 15,
    skills: ['apple', 'mdm', 'projects'],
    contentPath: 'lab-15.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 4 — Google Workspace (Labs 16–21)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-16',
    title: 'Gmail Troubleshooting',
    week: 5,
    track: 'google-workspace',
    order: 16,
    skills: ['google-workspace', 'ticketing'],
    contentPath: 'lab-16.json',
  },
  {
    id: 'lab-17',
    title: 'Google Drive Permissions',
    week: 5,
    track: 'google-workspace',
    order: 17,
    skills: ['google-workspace', 'ticketing'],
    contentPath: 'lab-17.json',
  },
  {
    id: 'lab-18',
    title: 'Drive Sync Issues',
    week: 5,
    track: 'google-workspace',
    order: 18,
    skills: ['google-workspace', 'ticketing'],
    contentPath: 'lab-18.json',
  },
  {
    id: 'lab-19',
    title: 'Google Account / Login Issues',
    week: 6,
    track: 'google-workspace',
    order: 19,
    skills: ['google-workspace', 'ticketing', 'security-awareness'],
    contentPath: 'lab-19.json',
  },
  {
    id: 'lab-20',
    title: 'Google Workspace Training Support',
    week: 6,
    track: 'google-workspace',
    order: 20,
    skills: ['google-workspace', 'customer-service'],
    contentPath: 'lab-20.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 5 — MDM/JAMF (Labs 22–26)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-21',
    title: 'MDM Enrollment Issues',
    week: 6,
    track: 'mdm',
    order: 21,
    skills: ['mdm', 'apple', 'windows'],
    contentPath: 'lab-21.json',
  },
  {
    id: 'lab-22',
    title: 'Configuration Profile Deployment',
    week: 6,
    track: 'mdm',
    order: 22,
    skills: ['mdm'],
    contentPath: 'lab-22.json',
  },
  {
    id: 'lab-23',
    title: 'Application Deployment',
    week: 7,
    track: 'mdm',
    order: 23,
    skills: ['mdm', 'apple', 'windows'],
    contentPath: 'lab-23.json',
  },
  {
    id: 'lab-24',
    title: 'Device Compliance',
    week: 7,
    track: 'mdm',
    order: 24,
    skills: ['mdm', 'security-awareness'],
    contentPath: 'lab-24.json',
  },
  {
    id: 'lab-25',
    title: 'Lost / Stolen Device Response',
    week: 7,
    track: 'mdm',
    order: 25,
    skills: ['mdm', 'security-awareness', 'hardware-lifecycle'],
    contentPath: 'lab-25.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 6 — Network, Classroom, Office Technology (Labs 26–31)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-26',
    title: 'Basic Network Troubleshooting',
    week: 7,
    track: 'network',
    order: 26,
    skills: ['networking', 'ticketing'],
    contentPath: 'lab-26.json',
  },
  {
    id: 'lab-27',
    title: 'DNS / DHCP Incident',
    week: 7,
    track: 'network',
    order: 27,
    skills: ['networking', 'incident-response'],
    contentPath: 'lab-27.json',
  },
  {
    id: 'lab-28',
    title: 'Printer / Copier Troubleshooting',
    week: 8,
    track: 'network',
    order: 28,
    skills: ['classroom-tech', 'ticketing'],
    contentPath: 'lab-28.json',
  },
  {
    id: 'lab-29',
    title: 'Projector / Display Incident',
    week: 8,
    track: 'classroom-tech',
    order: 29,
    skills: ['classroom-tech', 'customer-service', 'ticketing'],
    contentPath: 'lab-29.json',
  },
  {
    id: 'lab-30',
    title: 'Classroom Pre-Flight Check',
    week: 8,
    track: 'classroom-tech',
    order: 30,
    skills: ['classroom-tech'],
    contentPath: 'lab-30.json',
  },
  {
    id: 'lab-31',
    title: 'VoIP / Telephone Troubleshooting',
    week: 8,
    track: 'network',
    order: 31,
    skills: ['networking', 'ticketing'],
    contentPath: 'lab-31.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 7 — Asset and Lifecycle Management (Labs 32–37)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-32',
    title: 'Technology Inventory Audit',
    week: 8,
    track: 'asset',
    order: 32,
    skills: ['hardware-lifecycle', 'documentation'],
    contentPath: 'lab-32.json',
  },
  {
    id: 'lab-33',
    title: 'Hardware Diagnosis and Repair',
    week: 9,
    track: 'asset',
    order: 33,
    skills: ['hardware-lifecycle', 'ticketing'],
    contentPath: 'lab-33.json',
  },
  {
    id: 'lab-34',
    title: 'RMA and Vendor Workflow',
    week: 9,
    track: 'asset',
    order: 34,
    skills: ['hardware-lifecycle', 'projects'],
    contentPath: 'lab-34.json',
  },
  {
    id: 'lab-35',
    title: 'Insurance / Lost-Damaged Equipment',
    week: 9,
    track: 'asset',
    order: 35,
    skills: ['hardware-lifecycle', 'documentation'],
    contentPath: 'lab-35.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Phase 8 — Projects and Operations (Labs 36–48)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lab-36',
    title: 'New Classroom Technology Deployment',
    week: 9,
    track: 'projects',
    order: 36,
    skills: ['projects', 'classroom-tech'],
    contentPath: 'lab-36.json',
  },
  {
    id: 'lab-37',
    title: 'School-Wide macOS/iPadOS Upgrade',
    week: 10,
    track: 'projects',
    order: 37,
    skills: ['projects', 'apple', 'mdm'],
    contentPath: 'lab-37.json',
  },
  {
    id: 'lab-38',
    title: 'New Employee Technology Onboarding',
    week: 10,
    track: 'projects',
    order: 38,
    skills: ['projects', 'windows', 'google-workspace'],
    contentPath: 'lab-38.json',
  },
  {
    id: 'lab-39',
    title: 'Technology Change Management',
    week: 10,
    track: 'projects',
    order: 39,
    skills: ['projects', 'documentation'],
    contentPath: 'lab-39.json',
  },
  {
    id: 'lab-40',
    title: 'Vendor Management',
    week: 10,
    track: 'projects',
    order: 40,
    skills: ['projects'],
    contentPath: 'lab-40.json',
  },
  {
    id: 'lab-41',
    title: 'Knowledge Base Authoring',
    week: 10,
    track: 'documentation',
    order: 41,
    skills: ['documentation'],
    contentPath: 'lab-41.json',
  },
  {
    id: 'lab-42',
    title: 'End-User Training Materials',
    week: 11,
    track: 'documentation',
    order: 42,
    skills: ['documentation', 'customer-service'],
    contentPath: 'lab-42.json',
  },
  {
    id: 'lab-43',
    title: 'Post-Resolution Follow-Up',
    week: 11,
    track: 'documentation',
    order: 43,
    skills: ['customer-service', 'documentation'],
    contentPath: 'lab-43.json',
  },
  {
    id: 'lab-44',
    title: 'Major Incident Simulation',
    week: 11,
    track: 'incident-response',
    order: 44,
    skills: ['incident-response', 'ticketing', 'documentation'],
    contentPath: 'lab-44.json',
  },
  {
    id: 'lab-45',
    title: 'Security-Sensitive Request',
    week: 11,
    track: 'incident-response',
    order: 45,
    skills: ['security-awareness', 'ticketing'],
    contentPath: 'lab-45.json',
  },
  {
    id: 'lab-46',
    title: 'CIO Escalation',
    week: 11,
    track: 'incident-response',
    order: 46,
    skills: ['incident-response', 'documentation'],
    contentPath: 'lab-46.json',
  },
  {
    id: 'lab-47',
    title: 'After-Hours Pager Response',
    week: 11,
    track: 'incident-response',
    order: 47,
    skills: ['incident-response', 'ticketing'],
    contentPath: 'lab-47.json',
  },

  // ─────────────────────────────────────────────────────────────
  // Capstone
  // ─────────────────────────────────────────────────────────────
  {
    id: 'capstone-01',
    title: 'School IT Support Command Center',
    week: 12,
    track: 'capstone',
    order: 99,
    skills: [
      'customer-service',
      'windows',
      'apple',
      'google-workspace',
      'networking',
      'classroom-tech',
      'incident-response',
      'ticketing',
      'documentation',
      'hardware-lifecycle',
      'mdm',
      'projects',
      'security-awareness',
    ],
    contentPath: 'capstone-01.json',
  },
] as const;

/** Maps every SkillArea to the lab IDs that exercise it. Derived from manifest. */
export function skillsForArea(area: (typeof SKILL_AREAS)[number]): string[] {
  return LAB_MANIFEST.filter((l) => l.skills.includes(area)).map((l) => l.id);
}

/** Returns labs that have authored JSON content. */
export function availableLabs(): ManifestEntry[] {
  return LAB_MANIFEST.filter(
    (l): l is ManifestEntry & { contentPath: string } => l.contentPath !== null,
  );
}

/** Total lab count for verification. */
export const TOTAL_LABS = LAB_MANIFEST.length;
