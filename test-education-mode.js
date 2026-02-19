/**
 * Test script to verify education mode functionality
 */

// Test EducationPreferenceService
console.log('Testing EducationPreferenceService...');

// Import the service (we'll need to run this in the browser console)
const testCode = `
// Test 1: Check default mode
console.log('Default mode:', localStorage.getItem('oauth_education_preference'));
console.log('Current mode from service:', window.EducationPreferenceService?.getEducationMode());

// Test 2: Set to hidden mode
if (window.EducationPreferenceService) {
  window.EducationPreferenceService.setEducationMode('hidden');
  console.log('Set to hidden mode');
  console.log('New mode:', window.EducationPreferenceService.getEducationMode());
  
  // Test 3: Set to compact mode
  setTimeout(() => {
    window.EducationPreferenceService.setEducationMode('compact');
    console.log('Set to compact mode');
    console.log('New mode:', window.EducationPreferenceService.getEducationMode());
  }, 2000);
  
  // Test 4: Set to full mode
  setTimeout(() => {
    window.EducationPreferenceService.setEducationMode('full');
    console.log('Set to full mode');
    console.log('New mode:', window.EducationPreferenceService.getEducationMode());
  }, 4000);
} else {
  console.error('EducationPreferenceService not found on window object');
}
`;

console.log('Copy and paste this code into the browser console:');
console.log(testCode);
