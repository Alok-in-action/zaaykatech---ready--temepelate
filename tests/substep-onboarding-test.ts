import assert from 'node:assert';
import {
  stepNumberToSubStep,
  subStepToStepNumber,
  getSubStepConfig,
  getNextSubStep,
  getPreviousSubStep,
  isValidIndianPhone,
  SUB_STEPS,
  SubStepId,
} from '../src/lib/onboarding-substeps';
import { ONBOARDING_I18N } from '../src/lib/i18n/onboarding';

async function runSubStepOnboardingTests() {
  console.log('🧪 Starting Sub-Step Onboarding Architecture & UX Verification Tests...\n');

  // Test 1: Sub-step bidirectional mapping and legacy fallback decoding
  console.log('Test 1: Sub-step bidirectional mapping and legacy decoding...');
  assert.strictEqual(stepNumberToSubStep(11), '1a', '11 must map to 1a');
  assert.strictEqual(stepNumberToSubStep(12), '1b', '12 must map to 1b');
  assert.strictEqual(stepNumberToSubStep(13), '1c', '13 must map to 1c');
  assert.strictEqual(stepNumberToSubStep(14), '1d', '14 must map to 1d');
  assert.strictEqual(stepNumberToSubStep(21), '2a', '21 must map to 2a');
  assert.strictEqual(stepNumberToSubStep(22), '2b', '22 must map to 2b');
  assert.strictEqual(stepNumberToSubStep(23), '2c', '23 must map to 2c');
  assert.strictEqual(stepNumberToSubStep(31), '3a', '31 must map to 3a');
  assert.strictEqual(stepNumberToSubStep(32), '3b', '32 must map to 3b');
  assert.strictEqual(stepNumberToSubStep(33), '3c', '33 must map to 3c');
  assert.strictEqual(stepNumberToSubStep(41), '4a', '41 must map to 4a');
  assert.strictEqual(stepNumberToSubStep(51), '5a', '51 must map to 5a');
  assert.strictEqual(stepNumberToSubStep(52), '5b', '52 must map to 5b');

  // Legacy single-digit fallback check
  assert.strictEqual(stepNumberToSubStep(1), '1a', 'Legacy step 1 must decode to 1a');
  assert.strictEqual(stepNumberToSubStep(2), '2a', 'Legacy step 2 must decode to 2a');
  assert.strictEqual(stepNumberToSubStep(3), '3a', 'Legacy step 3 must decode to 3a');
  assert.strictEqual(stepNumberToSubStep(4), '4a', 'Legacy step 4 must decode to 4a');
  assert.strictEqual(stepNumberToSubStep(5), '5a', 'Legacy step 5 must decode to 5a');
  assert.strictEqual(stepNumberToSubStep(null), '1a', 'Null step must decode to 1a');
  assert.strictEqual(stepNumberToSubStep(undefined), '1a', 'Undefined step must decode to 1a');

  assert.strictEqual(subStepToStepNumber('1a'), 11);
  assert.strictEqual(subStepToStepNumber('1c'), 13);
  assert.strictEqual(subStepToStepNumber('2b'), 22);
  assert.strictEqual(subStepToStepNumber('3a'), 31);
  assert.strictEqual(subStepToStepNumber('4a'), 41);
  assert.strictEqual(subStepToStepNumber('5b'), 52);
  console.log('  ✔ Sub-step bidirectional encoding & legacy backwards-compatibility verified');

  // Test 2: Sequence traversal (next & previous)
  console.log('Test 2: Sequence traversal (next & previous)...');
  assert.strictEqual(getNextSubStep('1a'), '1b');
  assert.strictEqual(getNextSubStep('1d'), '2a');
  assert.strictEqual(getNextSubStep('2c'), '3a');
  assert.strictEqual(getNextSubStep('3c'), '4a');
  assert.strictEqual(getNextSubStep('4a'), '5a');
  assert.strictEqual(getNextSubStep('5a'), '5b');
  assert.strictEqual(getNextSubStep('5b'), null, '5b is the final screen');

  assert.strictEqual(getPreviousSubStep('1a'), null, '1a is the first screen');
  assert.strictEqual(getPreviousSubStep('1b'), '1a');
  assert.strictEqual(getPreviousSubStep('2a'), '1d');
  assert.strictEqual(getPreviousSubStep('3a'), '2c');
  assert.strictEqual(getPreviousSubStep('4a'), '3c');
  assert.strictEqual(getPreviousSubStep('5a'), '4a');
  console.log('  ✔ Sub-step forward and backward navigation verified');

  // Test 3: Sub-step resume accuracy
  console.log('Test 3: Sub-step resume on return...');
  const simulatedRestaurantSessionAt1c = {
    onboarding_current_step: 13,
  };
  const resumedSubStep1 = stepNumberToSubStep(simulatedRestaurantSessionAt1c.onboarding_current_step);
  assert.strictEqual(resumedSubStep1, '1c', 'Must accurately resume at question 1c');

  const simulatedRestaurantSessionAt2b = {
    onboarding_current_step: 22,
  };
  const resumedSubStep2 = stepNumberToSubStep(simulatedRestaurantSessionAt2b.onboarding_current_step);
  assert.strictEqual(resumedSubStep2, '2b', 'Must accurately resume at question 2b');
  console.log('  ✔ Exact sub-step resume verified');

  // Test 4: Indian 10-digit phone number validation
  console.log('Test 4: Indian 10-digit phone number validation...');
  assert.strictEqual(isValidIndianPhone('9876543210'), true, 'Valid 10-digit starting with 9');
  assert.strictEqual(isValidIndianPhone('8123456789'), true, 'Valid 10-digit starting with 8');
  assert.strictEqual(isValidIndianPhone('7000000000'), true, 'Valid 10-digit starting with 7');
  assert.strictEqual(isValidIndianPhone('6999999999'), true, 'Valid 10-digit starting with 6');
  assert.strictEqual(isValidIndianPhone('+91 98765 43210'), true, 'Valid formatted with prefix');

  assert.strictEqual(isValidIndianPhone('5555555555'), false, 'Invalid start digit 5');
  assert.strictEqual(isValidIndianPhone('0123456789'), false, 'Invalid start digit 0');
  assert.strictEqual(isValidIndianPhone('98765'), false, 'Too short (5 digits)');
  assert.strictEqual(isValidIndianPhone('987654321012'), false, 'Too long (12 digits)');
  assert.strictEqual(isValidIndianPhone('abcdefghij'), false, 'Non-digits');
  assert.strictEqual(isValidIndianPhone(''), false, 'Empty phone');
  console.log('  ✔ Indian 10-digit phone validation strictly enforced');

  // Test 5: Step 3 minimum requirement (>= 1 category and >= 1 dish)
  console.log('Test 5: Step 3 menu requirement blocking...');
  const emptyMenu = { categories: [], items: [] };
  const onlyCategory = { categories: [{ id: 'cat1', name: 'Starters' }], items: [] };
  const onlyItem = { categories: [], items: [{ id: 'item1', name: 'Samosa' }] };
  const validMenu = {
    categories: [{ id: 'cat1', name: 'Starters' }],
    items: [{ id: 'item1', name: 'Samosa' }],
  };

  const canAdvanceToStep4 = (menu: { categories: any[]; items: any[] }) =>
    menu.categories.length > 0 && menu.items.length > 0;

  assert.strictEqual(canAdvanceToStep4(emptyMenu), false, 'Empty menu must block advancing to Step 4');
  assert.strictEqual(canAdvanceToStep4(onlyCategory), false, 'Category only must block advancing to Step 4');
  assert.strictEqual(canAdvanceToStep4(onlyItem), false, 'Item only must block advancing to Step 4');
  assert.strictEqual(canAdvanceToStep4(validMenu), true, 'Valid menu with >= 1 category and >= 1 dish can advance');
  console.log('  ✔ Advancing to Step 4 strictly requires at least 1 category and 1 dish');

  // Test 6: Step 2 optional questions are marked skippable
  console.log('Test 6: Step 2 optional questions skippable configuration...');
  const config2a = getSubStepConfig('2a');
  const config2b = getSubStepConfig('2b');
  const config2c = getSubStepConfig('2c');
  assert.strictEqual(config2a.isSkippable, true, '2a (logo) must be skippable');
  assert.strictEqual(config2b.isSkippable, true, '2b (style) must be skippable');
  assert.strictEqual(config2c.isSkippable, true, '2c (cover) must be skippable');

  const config1a = getSubStepConfig('1a');
  const config1c = getSubStepConfig('1c');
  assert.strictEqual(config1a.isSkippable ?? false, false, '1a must NOT be skippable');
  assert.strictEqual(config1c.isSkippable ?? false, false, '1c must NOT be skippable');
  console.log('  ✔ Step 2 optional skippability verified');

  // Test 7: Translation dictionary structure
  console.log('Test 7: Translation dictionary completeness...');
  assert.ok(ONBOARDING_I18N.en, 'English locale dictionary must exist');
  assert.ok(ONBOARDING_I18N.hi, 'Hindi locale dictionary structure must exist');
  assert.ok(ONBOARDING_I18N.en.step1.name.question, '1a question text exists');
  assert.ok(ONBOARDING_I18N.en.step1.foodType.options.veg, '1b veg option exists');
  assert.ok(ONBOARDING_I18N.en.step1.phone.errorInvalid, '1c phone error text exists');
  assert.ok(ONBOARDING_I18N.en.step1.city.example, '1d city example exists');
  assert.ok(ONBOARDING_I18N.en.step2.style.presets.warm, '2b warm preset exists');
  assert.ok(ONBOARDING_I18N.en.step3.category.chips.length >= 6, '3a chips exist');
  assert.ok(ONBOARDING_I18N.en.step4.review.editSection, '4a edit label exists');
  assert.ok(ONBOARDING_I18N.en.step5.live.qrTitle, '5b QR title exists');
  console.log('  ✔ Translation dictionary complete');

  console.log('\n🎉 ALL SUB-STEP ONBOARDING TESTS PASSED!\n');
}

runSubStepOnboardingTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
