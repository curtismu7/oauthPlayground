// src/utils/clipboard.ts - Clipboard utilities

/**
 * Copy text to clipboard with user feedback
 * @param text - Text to copy
 * @param label - Label for user feedback (optional)
 */
export const copyToClipboard = async (text: string, label?: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    console.log(`✅ [Clipboard] Copied ${label || 'text'} to clipboard`);
    
    // Show temporary success feedback (you could enhance this with toast notifications)
    const labelText = label || 'Text';
    console.log(`📋 ${labelText} copied to clipboard!`);
  } catch (error) {
    console.error('❌ [Clipboard] Failed to copy to clipboard:', error);
    
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      
      console.log(`✅ [Clipboard] Copied ${label || 'text'} using fallback method`);
    } catch (fallbackError) {
      console.error('❌ [Clipboard] Fallback copy failed:', fallbackError);
      throw new Error(`Failed to copy ${label || 'text'} to clipboard`);
    }
  }
};

export default { copyToClipboard };
