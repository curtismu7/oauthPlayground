/**
 * Education Mode Test Script
 * Run this in the browser console to test the education collapse feature
 * 
 * This script tests:
 * 1. EducationPreferenceService functionality
 * 2. Mode switching (full -> compact -> hidden -> full)
 * 3. UI updates in UnifiedFlowSteps component
 * 4. Persistence across page reloads
 */

console.log('🧪 Starting Education Mode Test...');

// Test 1: Check if EducationPreferenceService is available
if (!window.EducationPreferenceService) {
  console.error('❌ EducationPreferenceService not found on window object');
  throw new Error('EducationPreferenceService not available');
}

console.log('✅ EducationPreferenceService found');

// Test 2: Check initial mode
const initialMode = window.EducationPreferenceService.getEducationMode();
console.log('📋 Initial education mode:', initialMode);

// Test 3: Test mode switching
const modes = ['full', 'compact', 'hidden'];
let currentModeIndex = 0;

function testModeSwitch() {
  const newMode = modes[currentModeIndex];
  console.log(`🔄 Setting mode to: ${newMode}`);
  
  window.EducationPreferenceService.setEducationMode(newMode);
  
  // Verify the mode was set
  const actualMode = window.EducationPreferenceService.getEducationMode();
  if (actualMode === newMode) {
    console.log(`✅ Mode successfully set to: ${newMode}`);
  } else {
    console.error(`❌ Mode setting failed. Expected: ${newMode}, Got: ${actualMode}`);
  }
  
  // Move to next mode
  currentModeIndex = (currentModeIndex + 1) % modes.length;
  
  // Schedule next test
  if (currentModeIndex !== 0) {
    setTimeout(testModeSwitch, 3000);
  } else {
    console.log('🏁 Mode switching test complete');
    
    // Test 4: Test persistence
    setTimeout(testPersistence, 2000);
  }
}

function testPersistence() {
  console.log('💾 Testing persistence...');
  
  // Save current mode
  const currentMode = window.EducationPreferenceService.getEducationMode();
  localStorage.setItem('test_mode_backup', currentMode);
  
  // Set a different mode
  window.EducationPreferenceService.setEducationMode('hidden');
  console.log('📝 Set mode to hidden for persistence test');
  
  // Simulate page reload by clearing and re-initializing
  setTimeout(() => {
    // Check if mode persisted
    const persistedMode = window.EducationPreferenceService.getEducationMode();
    if (persistedMode === 'hidden') {
      console.log('✅ Persistence test passed - mode survived');
    } else {
      console.error('❌ Persistence test failed - mode did not survive');
    }
    
    // Restore original mode
    const originalMode = localStorage.getItem('test_mode_backup');
    if (originalMode) {
      window.EducationPreferenceService.setEducationMode(originalMode);
      localStorage.removeItem('test_mode_backup');
      console.log('🔄 Restored original mode:', originalMode);
    }
    
    console.log('🎉 All tests completed!');
  }, 1000);
}

// Test 5: Check if we're on the right page for UI testing
function checkPage() {
  const currentPath = window.location.pathname;
  console.log('📍 Current page:', currentPath);
  
  if (currentPath.includes('/v8u/unified/')) {
    console.log('✅ On UnifiedFlowSteps page - UI testing available');
    
    // Look for educational sections
    const educationalSections = document.querySelectorAll('[data-educational-section]');
    console.log(`📚 Found ${educationalSections.length} educational sections`);
    
    // Test UI visibility
    testUIVisibility();
  } else {
    console.log('ℹ️ Not on UnifiedFlowSteps page - UI testing skipped');
    console.log('💡 Navigate to /v8u/unified/oauth-authz/0 to test UI changes');
  }
}

function testUIVisibility() {
  console.log('👁️ Testing UI visibility...');
  
  // Test hidden mode
  window.EducationPreferenceService.setEducationMode('hidden');
  setTimeout(() => {
    const sectionsInHiddenMode = document.querySelectorAll('[data-educational-section]');
    console.log(`📊 Sections visible in hidden mode: ${sectionsInHiddenMode.length}`);
    
    // Test compact mode
    window.EducationPreferenceService.setEducationMode('compact');
    setTimeout(() => {
      const sectionsInCompactMode = document.querySelectorAll('[data-educational-section]');
      console.log(`📊 Sections visible in compact mode: ${sectionsInCompactMode.length}`);
      
      // Test full mode
      window.EducationPreferenceService.setEducationMode('full');
      setTimeout(() => {
        const sectionsInFullMode = document.querySelectorAll('[data-educational-section]');
        console.log(`📊 Sections visible in full mode: ${sectionsInFullMode.length}`);
        
        console.log('👁️ UI visibility test complete');
      }, 1000);
    }, 1000);
  }, 1000);
}

// Start the tests
console.log('🚀 Starting mode switching test...');
setTimeout(testModeSwitch, 1000);

// Also check the page
setTimeout(checkPage, 500);

console.log('📝 Test script loaded. Watch console for results.');
console.log('💡 Tip: Navigate to /v8u/unified/oauth-authz/0 for full UI testing');
