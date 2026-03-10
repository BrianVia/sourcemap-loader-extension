// Content script to handle source map injection and DOM monitoring

const foundSourceMaps = new Map();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SOURCE_MAP_FOUND') {
    foundSourceMaps.set(message.jsUrl, message.mapUrl);
    
    // Try to inject source map reference into the JavaScript file
    injectSourceMapReference(message.jsUrl, message.mapUrl);
    
    logSourceMapFound(message.jsUrl, message.mapUrl);
  }
});

// Monitor for dynamically added script tags
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        // Check if it's a script tag
        if (node.tagName === 'SCRIPT' && node.src) {
          checkForSourceMap(node.src);
        }
        
        // Check for script tags within added elements
        const scripts = node.querySelectorAll ? node.querySelectorAll('script[src]') : [];
        scripts.forEach(script => {
          checkForSourceMap(script.src);
        });
      }
    });
  });
});

// Start observing
observer.observe(document, {
  childList: true,
  subtree: true
});

// Check existing scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    checkForSourceMap(script.src);
  });
});

// Also check immediately for scripts that might already be loaded
const existingScripts = document.querySelectorAll('script[src]');
existingScripts.forEach(script => {
  checkForSourceMap(script.src);
});

async function checkForSourceMap(jsUrl) {
  if (!jsUrl || foundSourceMaps.has(jsUrl)) {
    return;
  }
  
  const sourceMapUrl = jsUrl + '.map';
  
  try {
    const response = await fetch(sourceMapUrl, { method: 'HEAD' });
    
    if (response.ok) {
      foundSourceMaps.set(jsUrl, sourceMapUrl);
      injectSourceMapReference(jsUrl, sourceMapUrl);
      logSourceMapFound(jsUrl, sourceMapUrl);
    }
  } catch (error) {
    // Source map doesn't exist
  }
}

function injectSourceMapReference(jsUrl, mapUrl) {
  // This is a bit tricky since we can't modify already-loaded scripts
  // But we can at least log the availability and potentially expose it to dev tools
  
  // Create a hidden element to store the mapping for dev tools
  let mapContainer = document.getElementById('sourcemap-container');
  if (!mapContainer) {
    mapContainer = document.createElement('div');
    mapContainer.id = 'sourcemap-container';
    mapContainer.style.display = 'none';
    mapContainer.setAttribute('data-extension', 'auto-sourcemap-loader');
    document.head.appendChild(mapContainer);
  }
  
  // Add the mapping as a data attribute
  const mapElement = document.createElement('div');
  mapElement.setAttribute('data-js-url', jsUrl);
  mapElement.setAttribute('data-map-url', mapUrl);
  mapContainer.appendChild(mapElement);
  
}

// Batched logging — collects discoveries and flushes them as a single collapsed group
const pendingLogs = [];
let flushTimer = null;

function logSourceMapFound(jsUrl, mapUrl) {
  pendingLogs.push({ jsUrl, mapUrl });
  if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, 500);
  }
}

function flushLogs() {
  flushTimer = null;
  if (pendingLogs.length === 0) return;

  const entries = pendingLogs.splice(0);
  const tableData = entries.map(({ jsUrl, mapUrl }) => ({
    file: jsUrl.split('/').pop(),
    sourceMap: mapUrl,
  }));
  console.groupCollapsed(`🗺️ Auto Source Map Loader — ${entries.length} source map${entries.length === 1 ? '' : 's'} found`);
  console.table(tableData);
  console.groupEnd();
}

// Expose a global function to get all found source maps
window.getFoundSourceMaps = () => {
  return Array.from(foundSourceMaps.entries()).map(([jsUrl, mapUrl]) => ({
    jsUrl,
    mapUrl
  }));
};