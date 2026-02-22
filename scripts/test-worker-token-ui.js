/**
 * Worker Token UI Test Script
 * Run this in browser console to verify button colors work correctly
 */

console.log('🧪 Worker Token UI Test Started');

// Test 1: Check if button exists and has correct classes
const workerTokenButton = document.querySelector('button:has(.mdi-key)');

if (!workerTokenButton) {
  console.error('❌ Worker token button not found');
} else {
  console.log('✅ Worker token button found');
  console.log('Current classes:', workerTokenButton.className);
  
  // Test 2: Check if end-user-nano wrapper exists
  const endUserNano = document.querySelector('.end-user-nano');
  if (!endUserNano) {
    console.error('❌ .end-user-nano wrapper not found - CSS classes won\'t work');
  } else {
    console.log('✅ .end-user-nano wrapper found');
  }
  
  // Test 3: Check computed styles
  const computedStyles = window.getComputedStyle(workerTokenButton);
  console.log('🎨 Computed Styles:');
  console.log('  Background:', computedStyles.backgroundColor);
  console.log('  Border:', computedStyles.borderColor);
  console.log('  Text:', computedStyles.color);
  
  // Test 4: Check if CSS classes are defined
  const testElement = document.createElement('div');
  testElement.className = 'end-user-nano btn-light-green';
  document.body.appendChild(testElement);
  const greenStyles = window.getComputedStyle(testElement);
  document.body.removeChild(testElement);
  
  const testElement2 = document.createElement('div');
  testElement2.className = 'end-user-nano btn-light-red';
  document.body.appendChild(testElement2);
  const redStyles = window.getComputedStyle(testElement2);
  document.body.removeChild(testElement2);
  
  console.log('🎯 CSS Class Definitions:');
  console.log('  Green background:', greenStyles.backgroundColor);
  console.log('  Red background:', redStyles.backgroundColor);
  
  // Test 5: Try to access React component state (if available)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔍 React DevTools available - checking component state...');
    // This would need manual inspection in DevTools
  }
  
  // Test 6: Monitor for class changes
  let lastClass = workerTokenButton.className;
  const observer = new MutationObserver(() => {
    if (workerTokenButton.className !== lastClass) {
      console.log('🔄 Button class changed:', {
        from: lastClass,
        to: workerTokenButton.className
      });
      lastClass = workerTokenButton.className;
    }
  });
  
  observer.observe(workerTokenButton, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  console.log('👀 Monitoring button class changes for 10 seconds...');
  
  // Test 7: Simulate token status changes (if we can access the component)
  console.log('💡 To manually test token status changes:');
  console.log('1. Configure a worker token');
  console.log('2. Watch for button color change');
  console.log('3. Delete/expired token');
  console.log('4. Watch for button color change back');
  
  // Cleanup after 10 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('✅ Worker Token UI Test Completed');
    console.log('📋 Summary:');
    console.log('  Button found:', !!workerTokenButton);
    console.log('  Has end-user-nano wrapper:', !!endUserNano);
    console.log('  Current classes:', workerTokenButton.className);
    console.log('  Is green:', workerTokenButton.className.includes('btn-light-green'));
    console.log('  Is red:', workerTokenButton.className.includes('btn-light-red'));
  }, 10000);
}

// Helper function to manually check token status service
async function checkTokenStatusService() {
  try {
    // This will only work if the service is exposed globally
    if (window.WorkerTokenStatusServiceV8) {
      const status = await window.WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
      console.log('🔐 Token Status Service Response:', status);
    } else {
      console.log('ℹ️ Token status service not globally available');
    }
  } catch (error) {
    console.error('❌ Error checking token status service:', error);
  }
}

// Export for manual testing
window.testWorkerTokenUI = {
  checkTokenStatusService,
  button: workerTokenButton
};

console.log('🔧 Test functions available in window.testWorkerTokenUI');
