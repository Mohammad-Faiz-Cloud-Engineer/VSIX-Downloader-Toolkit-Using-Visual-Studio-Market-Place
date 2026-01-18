# VSIX Downloader Pro - Browser Extension

Professional browser extension for downloading VS Code extensions as VSIX files. Enterprise-grade tool for offline installations and version control.

## ⚠️ Browser Support

This extension is designed for **Chromium-based browsers only**.

### ✅ Supported Browsers
- Google Chrome
- Microsoft Edge (Chromium-based)
- Brave Browser
- Opera
- Vivaldi
- Arc Browser
- Any other Chromium-based browser

### ❌ Not Supported
- **Firefox** - Not supported
- **DuckDuckGo Browser** - Not supported
- Safari - Not supported

## Features

- **One-Click Downloads** - Download any VS Code extension as VSIX file
- **Multiple Formats** - Support for both .vsix and .vsixpackage formats
- **Auto-Detection** - Automatically detects extension details on marketplace pages
- **Copy URLs** - Quickly copy download URLs to clipboard
- **Smart Retry Logic** - Robust error handling with automatic retries
- **Performance Optimized** - Minimal resource usage with intelligent caching
- **Security Hardened** - Domain whitelist and HTTPS-only downloads

## Installation

### For Chromium-based Browsers (Chrome, Edge, Brave, Opera, etc.)

1. Download or clone this repository
2. Open your browser's extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Opera: `opera://extensions/`
3. Enable "Developer mode" (usually a toggle in the top right)
4. Click "Load unpacked" or "Load extension"
5. Select the `browser-extension` directory from this repository

The extension will now be installed and ready to use!

## Usage

1. Navigate to any VS Code extension page on marketplace.visualstudio.com
2. Download buttons will appear automatically within 2-3 seconds
3. Click "Download VSIX" to download the extension
4. Or use the extension popup for more options

## Permissions

- **activeTab** - Access current tab to inject download buttons
- **storage** - Save user preferences
- **downloads** - Download VSIX files
- **notifications** - Show download status notifications

## Privacy

- No data collection
- No external API calls
- No analytics or tracking
- All processing happens locally

## Technical Details

- **Manifest Version**: 3
- **Browser Support**: Chrome, Edge, Firefox (with manifest adjustment)
- **Performance**: <100ms initial load, <500ms button injection
- **Memory Usage**: <5MB
- **Security**: Domain whitelist, HTTPS-only, input sanitization

## Development

### Project Structure

```
├── manifest.json          # Extension manifest
├── background/
│   └── background.js      # Service worker
├── content/
│   └── content.js         # Content script
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── styles/
│   └── content.css        # Injected styles
└── icons/                 # Extension icons
```

### Building for Production

1. Ensure all files are present
2. Test in developer mode
3. Create ZIP package:
   ```bash
   zip -r vsix-downloader-pro.zip . -x "*.git*" "manifest-firefox.json"
   ```
4. Submit to Chrome Web Store

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Fully Supported | Manifest V3 |
| Edge | ✅ Fully Supported | Chromium-based |
| Brave | ✅ Fully Supported | Chromium-based |
| Opera | ✅ Fully Supported | Chromium-based |
| Vivaldi | ✅ Fully Supported | Chromium-based |
| Arc | ✅ Fully Supported | Chromium-based |
| **Firefox** | ❌ Not Supported | Incompatible |
| **DuckDuckGo** | ❌ Not Supported | Incompatible |

## Troubleshooting

### Buttons not appearing?

- Wait 3-5 seconds (extension retries automatically)
- Ensure URL contains `itemName=` parameter
- Refresh page with Ctrl+Shift+R
- Check browser console for errors

### Download failing?

- Check network tab in DevTools (F12)
- Verify extension version exists
- Try downloading from popup instead
- Check download permissions

### Popup shows error?

- Refresh the extension page
- Reload extension from chrome://extensions/
- Check content script is loaded

## License

MIT License - see LICENSE file for details

## Author

Mohammad Faiz

## Links

- **GitHub**: https://github.com/mohammadFaiz/vsix-downloader
- **Issues**: https://github.com/mohammadFaiz/vsix-downloader/issues

## Version History

### 2.0.1 (Current)
- Production-ready release
- Performance optimizations
- Enhanced error handling
- Security hardening
- Removed debug logging

### 2.0.0
- Manifest V3 migration
- Complete rewrite
- Added retry logic
- Improved version detection

### 1.0.0
- Initial release

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for the VS Code community**
