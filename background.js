// Background script to intercept JavaScript requests and attempt to load source maps

const sourceMapCache = new Map();
const processedUrls = new Set();

function isLocalhostUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname === '[::1]' ||
           hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

// Listen for JavaScript file requests
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = details.url;

    // Skip localhost URLs
    if (isLocalhostUrl(url)) {
      return;
    }

    // Skip if already processed or not a JS file
    if (processedUrls.has(url) || !isJavaScriptFile(url)) {
      return;
    }
    
    processedUrls.add(url);
    
    // Attempt to load source map
    const sourceMapUrl = url + '.map';
    
    try {
      const response = await fetch(sourceMapUrl, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      if (response.ok || response.type === 'opaque') {
        // Source map exists, store the mapping
        sourceMapCache.set(url, sourceMapUrl);
        
        // Notify content script
        chrome.tabs.sendMessage(details.tabId, {
          type: 'SOURCE_MAP_FOUND',
          jsUrl: url,
          mapUrl: sourceMapUrl
        }).catch(() => {
          // Tab might not be ready yet, ignore
        });
        
        console.log(`🗺️ Source map found: ${url}`);
      }
    } catch (error) {
      // Source map doesn't exist or network error
    }
  },
  {
    urls: ["<all_urls>"],
    types: ["script", "main_frame", "sub_frame"]
  }
);

// Also listen for completed requests to catch dynamically loaded scripts
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    const url = details.url;

    // Skip localhost URLs
    if (isLocalhostUrl(url)) {
      return;
    }

    if (processedUrls.has(url) || !isJavaScriptFile(url)) {
      return;
    }
    
    processedUrls.add(url);
    
    const sourceMapUrl = url + '.map';
    
    try {
      const response = await fetch(sourceMapUrl, { method: 'HEAD' });
      
      if (response.ok) {
        sourceMapCache.set(url, sourceMapUrl);
        
        chrome.tabs.sendMessage(details.tabId, {
          type: 'SOURCE_MAP_FOUND',
          jsUrl: url,
          mapUrl: sourceMapUrl
        }).catch(() => {});
        
        console.log(`🗺️ Source map found: ${url}`);
      }
    } catch (error) {
      // Source map doesn't exist or network error
    }
  },
  {
    urls: ["<all_urls>"],
    types: ["script"]
  }
);

function isJavaScriptFile(url) {
  // Check if URL is a JavaScript file
  return url.includes('.js') || 
         url.includes('javascript') || 
         url.match(/\.(js|mjs|jsx)(\?|$)/i);
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SOURCE_MAPS') {
    sendResponse({
      sourceMaps: Array.from(sourceMapCache.entries())
    });
  }
});

// Clear cache when navigating to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Clear processed URLs for this navigation
    processedUrls.clear();
  }
});