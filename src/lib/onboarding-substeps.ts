/**
 * ZaaykaTech Sub-Step Onboarding Architecture
 * Maps granular sub-steps (1a to 5b) to integer codes stored in database.
 * Supports legacy single-digit steps (1..5) with zero breaking changes.
 */

export type SubStepId =
  | '1a'
  | '1b'
  | '1c'
  | '1d'
  | '2a'
  | '2b'
  | '2c'
  | '3a'
  | '3b'
  | '3c'
  | '4a'
  | '5a'
  | '5b';

export interface SubStepConfig {
  id: SubStepId;
  code: number;
  mainStep: number;
  mainStepTitle: string;
  subStepIndex: number;
  totalSubSteps: number;
  isSkippable?: boolean;
}

export const SUB_STEPS: SubStepConfig[] = [
  // Step 1: About you (4 questions)
  { id: '1a', code: 11, mainStep: 1, mainStepTitle: 'About you', subStepIndex: 1, totalSubSteps: 4 },
  { id: '1b', code: 12, mainStep: 1, mainStepTitle: 'About you', subStepIndex: 2, totalSubSteps: 4 },
  { id: '1c', code: 13, mainStep: 1, mainStepTitle: 'About you', subStepIndex: 3, totalSubSteps: 4 },
  { id: '1d', code: 14, mainStep: 1, mainStepTitle: 'About you', subStepIndex: 4, totalSubSteps: 4 },

  // Step 2: Look (3 questions - all skippable)
  { id: '2a', code: 21, mainStep: 2, mainStepTitle: 'Look', subStepIndex: 1, totalSubSteps: 3, isSkippable: true },
  { id: '2b', code: 22, mainStep: 2, mainStepTitle: 'Look', subStepIndex: 2, totalSubSteps: 3, isSkippable: true },
  { id: '2c', code: 23, mainStep: 2, mainStepTitle: 'Look', subStepIndex: 3, totalSubSteps: 3, isSkippable: true },

  // Step 3: Menu (3 questions)
  { id: '3a', code: 31, mainStep: 3, mainStepTitle: 'Menu', subStepIndex: 1, totalSubSteps: 3 },
  { id: '3b', code: 32, mainStep: 3, mainStepTitle: 'Menu', subStepIndex: 2, totalSubSteps: 3 },
  { id: '3c', code: 33, mainStep: 3, mainStepTitle: 'Menu', subStepIndex: 3, totalSubSteps: 3 },

  // Step 4: Check (1 question)
  { id: '4a', code: 41, mainStep: 4, mainStepTitle: 'Check', subStepIndex: 1, totalSubSteps: 1 },

  // Step 5: Go live (2 questions)
  { id: '5a', code: 51, mainStep: 5, mainStepTitle: 'Go live', subStepIndex: 1, totalSubSteps: 2 },
  { id: '5b', code: 52, mainStep: 5, mainStepTitle: 'Go live', subStepIndex: 2, totalSubSteps: 2 },
];

const SUB_STEP_ORDER: SubStepId[] = [
  '1a', '1b', '1c', '1d',
  '2a', '2b', '2c',
  '3a', '3b', '3c',
  '4a',
  '5a', '5b'
];

/**
 * Converts stored integer step (either legacy 1..5 or composite 11..52) to SubStepId.
 */
export function stepNumberToSubStep(rawStep: number | null | undefined): SubStepId {
  if (!rawStep || rawStep <= 1) return '1a';

  // Legacy single-digit values
  if (rawStep === 1) return '1a';
  if (rawStep === 2) return '2a';
  if (rawStep === 3) return '3a';
  if (rawStep === 4) return '4a';
  if (rawStep === 5) return '5a';

  // Direct sub-step integer code match
  const found = SUB_STEPS.find((s) => s.code === rawStep);
  if (found) return found.id;

  // Fallback ranges if code is between milestones
  if (rawStep >= 11 && rawStep < 20) {
    if (rawStep === 11) return '1a';
    if (rawStep === 12) return '1b';
    if (rawStep === 13) return '1c';
    return '1d';
  }
  if (rawStep >= 21 && rawStep < 30) {
    if (rawStep === 21) return '2a';
    if (rawStep === 22) return '2b';
    return '2c';
  }
  if (rawStep >= 31 && rawStep < 40) {
    if (rawStep === 31) return '3a';
    if (rawStep === 32) return '3b';
    return '3c';
  }
  if (rawStep === 41) return '4a';
  if (rawStep >= 50) return rawStep >= 52 ? '5b' : '5a';

  return '1a';
}

/**
 * Returns integer code for saving to database.
 */
export function subStepToStepNumber(subStep: SubStepId): number {
  const found = SUB_STEPS.find((s) => s.id === subStep);
  return found ? found.code : 11;
}

/**
 * Retrieves configuration for a given sub-step.
 */
export function getSubStepConfig(subStep: SubStepId): SubStepConfig {
  const found = SUB_STEPS.find((s) => s.id === subStep);
  if (!found) {
    return SUB_STEPS[0];
  }
  return found;
}

/**
 * Returns the next sub-step in sequence.
 */
export function getNextSubStep(current: SubStepId): SubStepId | null {
  const idx = SUB_STEP_ORDER.indexOf(current);
  if (idx >= 0 && idx < SUB_STEP_ORDER.length - 1) {
    return SUB_STEP_ORDER[idx + 1];
  }
  return null;
}

/**
 * Returns the previous sub-step in sequence.
 */
export function getPreviousSubStep(current: SubStepId): SubStepId | null {
  const idx = SUB_STEP_ORDER.indexOf(current);
  if (idx > 0) {
    return SUB_STEP_ORDER[idx - 1];
  }
  return null;
}

/**
 * Validates 10-digit Indian mobile number:
 * Must be exactly 10 digits starting with 6, 7, 8, or 9.
 */
export function isValidIndianPhone(phone: string): boolean {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return /^[6-9]\d{9}$/.test(cleaned);
}
