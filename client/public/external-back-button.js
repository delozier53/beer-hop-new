// External Back Button Script for Beer Hop
// This creates a Facebook-style back button that appears on external websites

(function() {
  'use strict';
  
  function injectExternalBackButton() {
    // Only inject if we have the navigation flag
    const returnUrl = sessionStorage.getItem('return-url');
    if (!returnUrl) return;
    
    // Don't inject if already exists
    if (document.getElementById('beer-hop-back-button')) return;
    
    // Create the back button
    const backButton = document.createElement('div');
    backButton.id = 'beer-hop-back-button';
    backButton.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      transition: background-color 0.2s;
    `;
    
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
      </svg>
      Beer Hop OK
    `;
    
    button.addEventListener('mouseover', function() {
      button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    });
    
    button.addEventListener('mouseout', function() {
      button.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    });
    
    button.addEventListener('click', function() {
      const returnUrl = sessionStorage.getItem('return-url');
      sessionStorage.removeItem('return-url');
      sessionStorage.removeItem('external-nav');
      
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        window.history.back();
      }
    });
    
    backButton.appendChild(button);
    document.body.appendChild(backButton);
  }
  
  // Auto-inject when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExternalBackButton);
  } else {
    injectExternalBackButton();
  }
})();