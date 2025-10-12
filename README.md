# Auto Source Map Loader

A Chrome extension that automatically discovers and attempts to load source maps for JavaScript files on web pages, even when they're not explicitly referenced in the original files.

## What It Does

When browsing websites, this extension:
- Monitors all JavaScript file requests
- Automatically checks if source maps exist (by appending `.map` to JS file URLs)
- Logs discovered source maps to the browser console
- Provides a popup UI to view all discovered source maps
- Makes debugging easier by helping you find source maps that developers may have deployed but not linked

## Features

- **Automatic Discovery**: Scans both initial page load and dynamically loaded scripts
- **Cross-Origin Support**: Works with JavaScript files from any domain
- **Real-time Monitoring**: Uses MutationObserver to catch dynamically added scripts
- **Developer-Friendly Output**: Logs source maps to console with helpful instructions
- **Easy Access**: Popup UI shows all discovered maps with copy-to-clipboard functionality
- **Lightweight**: Minimal performance impact using HEAD requests

## Installation

### For Development

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory

### From Chrome Web Store

*(Coming soon)*

## Usage

1. **Install the extension** (see above)
2. **Navigate to any website** with JavaScript files
3. **Check the console** for source map discoveries (look for 🗺️ emoji)
4. **Click the extension icon** to see all discovered source maps
5. **Copy map URLs** to manually add them to your local development setup

### Programmatic Access

In the browser console, you can call:
```javascript
getFoundSourceMaps()
```
This returns an array of all discovered JavaScript → source map mappings.

## How It Works

The extension uses a three-part architecture:

1. **Background Service Worker**: Intercepts JavaScript requests using `chrome.webRequest` API and checks for corresponding `.map` files
2. **Content Script**: Monitors the DOM for dynamically added scripts and logs discoveries to console
3. **Popup UI**: Displays all found source maps with a clean interface

When a JavaScript file is detected at `https://example.com/app.js`, the extension automatically checks if `https://example.com/app.js.map` exists.

## Limitations

- Only detects source maps following the `.map` suffix convention
- Cannot automatically inject source maps into already-executed JavaScript
- Requires source maps to be publicly accessible at the expected URL pattern
- Does not parse existing `sourceMappingURL` comments in files

## Use Cases

- **Reverse Engineering**: Find source maps that developers accidentally left public
- **Security Research**: Discover unminified source code for security analysis
- **Debugging**: Access source maps when working with third-party libraries
- **Development**: Verify that your source maps are properly deployed

## Privacy

This extension:
- Does not collect or transmit any data
- Does not modify web pages or JavaScript execution
- Only makes HEAD requests to check for source map existence
- Stores discovered mappings temporarily in memory (cleared on page navigation)

## Development

### File Structure

```
.
├── manifest.json      # Extension configuration
├── background.js      # Service worker for request interception
├── content.js         # Content script for DOM monitoring
└── popup.html         # Extension popup UI
```

### Debugging

- **Background script logs**: Check the service worker console at `chrome://extensions/` (click "service worker" link)
- **Content script logs**: Open DevTools on any web page
- **Look for messages** prefixed with 🗺️ emoji

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - feel free to use and modify as needed.

## Disclaimer

This tool is intended for legitimate development and security research purposes only. Always respect website terms of service and intellectual property rights.
