# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Manifest V3 extension called "Auto Source Map Loader" that automatically discovers and attempts to load source maps for JavaScript files on web pages. The extension helps developers access source maps even when they're not explicitly referenced in the original JavaScript files.

## Architecture

The extension uses a three-component architecture typical of Chrome extensions:

### 1. Background Service Worker (background.js)
- Intercepts JavaScript file requests using `chrome.webRequest` API
- Proactively checks for source maps by appending `.map` to JavaScript URLs
- Maintains two in-memory data structures:
  - `sourceMapCache`: Map of JavaScript URLs to their source map URLs
  - `processedUrls`: Set of URLs already checked to avoid duplicate processing
- Uses two request listeners:
  - `onBeforeRequest`: Catches requests early with no-cors mode for cross-origin checks
  - `onCompleted`: Catches dynamically loaded scripts after they complete loading
- Communicates discovered source maps to content scripts via `chrome.tabs.sendMessage`
- Clears the processed URLs cache on page navigation to handle new page loads

### 2. Content Script (content.js)
- Runs at `document_start` to catch early script loads
- Maintains local `foundSourceMaps` Map independent of background script
- Uses MutationObserver to detect dynamically added script tags
- Three discovery mechanisms:
  1. Listens for messages from background script
  2. Checks existing scripts on DOMContentLoaded
  3. Checks scripts immediately on injection
- Cannot directly modify already-loaded scripts, so instead:
  - Logs source map information to console in grouped format
  - Creates hidden DOM container with data attributes storing JS→map URL mappings
  - Exposes global `getFoundSourceMaps()` function for programmatic access
- Each discovered source map triggers a console.log with instructions for manual sourceMappingURL addition

### 3. Popup UI (popup.html)
- Single-file HTML with inline CSS and JavaScript
- Queries both background script and content script for complete source map data
- Auto-refreshes every 2 seconds while open to show newly discovered maps
- Provides "Copy Map URL" buttons to copy source map URLs to clipboard
- Shows status indicator (blue for monitoring, green for active with found maps)

## Key Implementation Details

### Source Map Detection Strategy
The extension uses a simple heuristic: for any JavaScript file at `https://example.com/app.js`, it checks if `https://example.com/app.js.map` exists by making HEAD requests.

### JavaScript File Detection
The `isJavaScriptFile()` function identifies JS files by checking for:
- `.js` in URL
- `javascript` in URL
- File extensions matching `.js`, `.mjs`, `.jsx` with regex pattern

### Cross-Origin Handling
Background script uses `no-cors` mode in fetch for initial checks to handle cross-origin resources, since the extension has `host_permissions` for `<all_urls>`.

### Communication Flow
1. Background script intercepts request → checks for source map
2. If found → sends message to content script
3. Content script stores mapping and logs to console
4. Popup queries both scripts to display complete data

## Permissions

The extension requires:
- `webRequest`: Intercept JavaScript file requests
- `storage`: Future use (currently unused)
- `activeTab`: Interact with current tab's content script
- `host_permissions: <all_urls>`: Check for source maps on any domain

## Development Notes

### Testing the Extension
1. Load unpacked extension in Chrome via `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Navigate to any website with JavaScript files
5. Click extension icon to view discovered source maps
6. Check browser console for detailed source map logs

### Debugging
- Background script logs: Check extension service worker console (chrome://extensions → "service worker" link)
- Content script logs: Check page's regular DevTools console
- Look for console messages prefixed with 🗺️ emoji

### Known Limitations
- Cannot modify already-executed JavaScript to inject sourceMappingURL comments
- Only checks for source maps using `.map` suffix convention
- Does not parse `sourceMappingURL` comments already in files
- Source maps must be accessible via same URL pattern (script.js → script.js.map)
- MutationObserver and webRequest may have race conditions for very fast script loads

### Extension Structure
All files are in the root directory:
- `manifest.json`: Extension configuration
- `background.js`: Service worker for request interception
- `content.js`: Content script for DOM monitoring
- `popup.html`: Extension popup UI (self-contained with inline CSS/JS)
