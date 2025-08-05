/**
 * Simple link handler for debugging
 */
export function openSimpleLink(url: string): void {
  console.log('openSimpleLink called with:', url);
  if (!url) {
    console.log('No URL provided');
    return;
  }
  
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
    console.log('Successfully opened URL in new tab');
  } catch (error) {
    console.error('Error opening URL:', error);
  }
}