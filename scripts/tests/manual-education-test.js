/**
 * Manual Education Collapse Test
 * Run this in the browser console on any OAuth Playground page
 */

console.log('🧪 Testing Education Collapse Feature...');

// Test 1: Check if EducationPreferenceService is available
if (!window.EducationPreferenceService) {
  console.error('❌ EducationPreferenceService not found');
  console.log('💡 Make sure you\'re on a page that loads the main.tsx properly');
} else {
  console.log('✅ EducationPreferenceService found');
}

// Test 2: Get current mode
const currentMode = window.EducationPreferenceService?.getEducationMode();
console.log('📋 Current education mode:', currentMode);

// Test 3: Test mode switching
console.log('🔄 Testing mode switching...');

// Test hidden mode
console.log('Setting to HIDDEN mode...');
window.EducationPreferenceService?.setEducationMode('hidden');
setTimeout(() => {
  const hiddenMode = window.EducationPreferenceService?.getEducationMode();
  console.log('✅ Hidden mode set:', hiddenMode);
  
  // Test compact mode
  console.log('Setting to COMPACT mode...');
  window.EducationPreferenceService?.setEducationMode('compact');
  setTimeout(() => {
    const compactMode = window.EducationPreferenceService?.getEducationMode();
    console.log('✅ Compact mode set:', compactMode);
    
    // Test full mode
    console.log('Setting to FULL mode...');
    window.EducationPreferenceService?.setEducationMode('full');
    setTimeout(() => {
      const fullMode = window.EducationPreferenceService?.getEducationMode();
      console.log('✅ Full mode set:', fullMode);
      
      console.log('🎉 Mode switching test complete!');
      console.log('');
      console.log('📝 Manual verification:');
      console.log('1. Look for EducationModeToggle buttons on the page');
      console.log('2. Click the buttons to switch modes');
      console.log('3. Verify educational content appears/disappears');
      console.log('4. Check these pages:');
      console.log('   - /v8u/unified/oauth-authz/0 (Unified OAuth Steps)');
      console.log('   - /v8u/unified (Unified OAuth Main)');
      console.log('   - /v8/mfa-authentication (MFA Authentication)');
    }, 1000);
  }, 1000);
}, 1000);

// Test 4: Check for educational sections
setTimeout(() => {
  console.log('');
  console.log('🔍 Checking for educational sections...');
  
  // Look for educational content
  const educationalSections = document.querySelectorAll('[class*="education"], [class*="Education"]');
  const collapsibleSections = document.querySelectorAll('[class*="Collapsible"], [class*="collapsible"]');
  const masterSections = document.querySelectorAll('[class*="Master"], [class*="master"]');
  
  console.log(`📚 Educational sections found: ${educationalSections.length}`);
  console.log(`📦 Collapsible sections found: ${collapsibleSections.length}`);
  console.log(`👑 Master sections found: ${masterSections.length}`);
  
  if (educationalSections.length === 0 && collapsibleSections.length === 0 && masterSections.length === 0) {
    console.log('ℹ️ No educational sections found - this page might not have educational content');
  } else {
    console.log('✅ Educational content detected on this page');
  }
}, 2000);

console.log('📝 Test script loaded. Watch console for results.');
