# VSIX Downloader

Professional toolkit for downloading Visual Studio Code extensions as VSIX files from the marketplace. Designed for enterprise environments, offline installations, and version control.

**Author:** Mohammad Faiz  
**Version:** 2.0.0  
**License:** MIT

---

## Overview

This toolkit provides multiple methods to download VS Code extensions as VSIX files, enabling:

- Offline installation of extensions
- Version control and archiving
- Enterprise deployment scenarios
- Air-gapped environment support
- Extension backup and distribution

---

## Quick Start

### Recommended Method: Bookmarklet

1. Create a new bookmark in your browser
2. Copy the entire content from `downloadVSIX-bookmarklet.js`
3. Paste it as the bookmark URL
4. Navigate to any VS Code extension page
5. Click the bookmark to activate the downloader

### Alternative Methods

**Browser Console:**
- Open Developer Console (F12)
- Copy and paste code from `downloadVSIX-enhanced.js`
- Press Enter to execute

**Web Interface:**
- Open `index.html` in your browser
- Enter the extension URL
- Follow the guided workflow

---

## File Structure

```
├── downloadVSIX-enhanced.js              # Primary script (recommended)
├── downloadVSIX-bookmarklet.js           # Bookmarklet version
├── downloadVSIX-legacy-with-progress.js  # Legacy with progress tracking
├── index.html                            # Standalone web interface
└── README.md                             # Documentation
```

---

## Files Explained

### `downloadVSIX-enhanced.js`

**Primary script with modern features**

**Version:** 2.0.0  
**Architecture:** ES6+ Classes (ExtensionManager, UIManager)

**Features:**
- Three download options: VSIX, VSIXPackage, Copy URL
- Toast notification system
- Clipboard integration
- Multiple selector fallbacks for reliability
- Advanced error handling and validation
- Modern UI with gradient buttons
- Duplicate load prevention

**Use When:**
- You need multiple download formats
- You want clipboard functionality
- You prefer modern UI/UX
- You need maximum reliability

**Browser Support:** Modern browsers (Chrome 60+, Firefox 55+, Edge 79+, Safari 12+)

---

### `downloadVSIX-bookmarklet.js`

**Minified bookmarklet version**

**Version:** 2.0.0  
**Type:** Compressed single-line JavaScript

**Features:**
- All features of enhanced version
- Optimized for bookmark storage
- One-click activation
- Instant deployment

**Use When:**
- You want the fastest workflow
- You frequently download extensions
- You prefer browser integration

**Installation:**
1. Create new bookmark
2. Name it "VSIX Downloader"
3. Paste entire file content as URL
4. Save and use on any extension page

---

### `downloadVSIX-legacy-with-progress.js`

**Legacy version with download progress tracking**

**Version:** 1.5.0  
**Architecture:** Procedural JavaScript

**Features:**
- Real-time download progress (0-100%)
- XHR-based file download
- Visual progress indicator on button
- Single VSIX download option
- Automatic retry on error

**Use When:**
- You need to see download progress percentage
- You have slow internet connection
- You download large extensions (>50MB)
- You need maximum browser compatibility

**Browser Support:** All browsers including older versions

**Progress Display:**
```
⏳ Downloading... 0%
⏳ Downloading... 34%
⏳ Downloading... 67%
⏳ Downloading... 100%
✓ Download Complete
```

---

### `index.html`

**Standalone web application**

**Type:** Single-page application (no dependencies)

**Features:**
- Corporate professional UI design
- Step-by-step guided workflow
- URL validation and error handling
- Responsive design for all devices
- Keyboard shortcuts (Enter to submit)
- Toast notifications
- Copy URLs functionality

**Use When:**
- You prefer graphical interface
- You're not comfortable with console
- You want guided instructions
- You need to share with non-technical users

**Access:** Open directly in any modern browser

---

## Technical Details

### Download Methods

**Enhanced & Bookmarklet (Direct Download):**
```javascript
// Creates download link, browser handles download
const link = document.createElement('a');
link.href = downloadUrl;
link.download = filename;
link.click();
```

**Advantages:**
- Fast and simple
- Integrates with browser download manager
- Appears in download history
- No memory overhead

**Legacy (XHR Download):**
```javascript
// Downloads via XMLHttpRequest with progress tracking
const xhr = new XMLHttpRequest();
xhr.responseType = 'blob';
xhr.onprogress = (e) => {
    const progress = (e.loaded / e.total) * 100;
    // Update UI with progress
};
```

**Advantages:**
- Real-time progress feedback
- Better for slow connections
- Visual confirmation of download status

---

### URL Formats

**VSIX Format:**
```
https://{publisher}.gallery.vsassets.io/_apis/public/gallery/
publisher/{publisher}/extension/{extension}/{version}/
assetbyname/Microsoft.VisualStudio.Services.VSIXPackage
```

**VSIXPackage Format:**
```
https://marketplace.visualstudio.com/_apis/public/gallery/
publishers/{publisher}/vsextensions/{extension}/{version}/vspackage
```

Both formats are valid and produce installable extension files.

---

## Usage Examples

### Example 1: Download Python Extension

**Using Bookmarklet:**
1. Visit: `https://marketplace.visualstudio.com/items?itemName=ms-python.python`
2. Click bookmarklet
3. Click "Download VSIX"
4. File downloads: `ms-python.python_2024.0.0.vsix`

**Using Console:**
1. Open extension page
2. Press F12
3. Paste `downloadVSIX-enhanced.js` content
4. Press Enter
5. Click generated download button

**Using Web Interface:**
1. Open `index.html`
2. Paste: `https://marketplace.visualstudio.com/items?itemName=ms-python.python`
3. Click "Generate Download Guide"
4. Enter version: `2024.0.0`
5. Click "Download VSIX"

---

### Example 2: Enterprise Deployment

**Scenario:** Deploy specific extension version to 100 machines

1. Use bookmarklet to download exact version
2. Verify VSIX file integrity
3. Distribute via internal network
4. Install using: `code --install-extension extension.vsix`

---

### Example 3: Offline Environment

**Scenario:** Air-gapped development environment

1. On internet-connected machine:
   - Use web interface to generate URLs
   - Download all required extensions
   - Archive VSIX files

2. On offline machine:
   - Transfer VSIX files
   - Install: `code --install-extension *.vsix`

---

## Feature Comparison

| Feature | Enhanced | Bookmarklet | Legacy | Web Interface |
|---------|----------|-------------|--------|---------------|
| Download VSIX | ✅ | ✅ | ✅ | ✅ |
| Download Package | ✅ | ✅ | ❌ | ✅ |
| Copy URL | ✅ | ✅ | ❌ | ✅ |
| Progress Tracking | ❌ | ❌ | ✅ | ❌ |
| Toast Notifications | ✅ | ✅ | ❌ | ✅ |
| Multiple Selectors | ✅ | ✅ | ❌ | N/A |
| One-Click Use | ❌ | ✅ | ❌ | ❌ |
| Guided Workflow | ❌ | ❌ | ❌ | ✅ |
| ES6+ Required | ✅ | ✅ | ❌ | ✅ |

---

## Browser Compatibility

### Enhanced & Bookmarklet
- Chrome 60+ ✅
- Firefox 55+ ✅
- Edge 79+ ✅
- Safari 12+ ✅
- Opera 47+ ✅

### Legacy
- All browsers ✅
- Internet Explorer 11+ ✅
- Older browser versions ✅

### Web Interface
- Modern browsers ✅
- Mobile browsers ✅
- Tablet browsers ✅

---

## Installation Methods

### Method 1: Bookmarklet (Fastest)

```
1. Right-click bookmark bar → Add page
2. Name: "VSIX Downloader"
3. URL: [Paste entire content of downloadVSIX-bookmarklet.js]
4. Save
```

### Method 2: Browser Extension (Future)

Coming soon: Browser extension for Chrome and Firefox

### Method 3: Command Line (Future)

Coming soon: Node.js CLI tool

---

## Troubleshooting

### Issue: "Metadata not found"

**Cause:** Marketplace page structure changed  
**Solution:** Try legacy version or refresh page

### Issue: Download doesn't start

**Cause:** Browser popup blocker  
**Solution:** Allow popups for marketplace.visualstudio.com

### Issue: Bookmarklet doesn't work

**Cause:** Browser stripped `javascript:` prefix  
**Solution:** Manually add `javascript:` at the beginning

### Issue: Wrong version downloaded

**Cause:** Copied version from wrong section  
**Solution:** Use version from "Version History" tab

### Issue: Progress tracking not showing

**Cause:** Using enhanced version  
**Solution:** Use `downloadVSIX-legacy-with-progress.js` instead

---

## Security & Privacy

**Data Collection:** None  
**External Requests:** Only to official VS Code Marketplace APIs  
**Tracking:** No analytics or telemetry  
**Open Source:** All code is visible and auditable

**API Endpoints Used:**
- `*.gallery.vsassets.io` (Microsoft CDN)
- `marketplace.visualstudio.com` (Official marketplace)

---

## Advanced Usage

### Batch Download Script

```bash
#!/bin/bash
# Download multiple extensions

extensions=(
    "ms-python.python"
    "esbenp.prettier-vscode"
    "dbaeumer.vscode-eslint"
)

for ext in "${extensions[@]}"; do
    # Use web interface or API to download
    echo "Downloading $ext..."
done
```

### Automated Deployment

```powershell
# PowerShell script for enterprise deployment
$extensions = @(
    "extension1.vsix",
    "extension2.vsix"
)

foreach ($ext in $extensions) {
    code --install-extension $ext
}
```

---

## Development

### Project Structure

```
VSIX-Downloader/
├── src/
│   ├── enhanced/          # Enhanced version source
│   ├── legacy/            # Legacy version source
│   └── bookmarklet/       # Bookmarklet builder
├── dist/                  # Compiled files
├── docs/                  # Documentation
└── tests/                 # Test files
```

### Building Bookmarklet

```bash
# Minify enhanced version to bookmarklet
npm run build:bookmarklet
```

### Running Tests

```bash
npm test
```

---

## Changelog

### Version 2.0.0 (January 2026)
- Complete rewrite with ES6+ classes
- Added three download options
- Implemented toast notifications
- Added clipboard functionality
- Multiple selector fallbacks
- Corporate professional UI
- Improved error handling

### Version 1.5.0
- Added progress tracking
- XHR-based downloads
- Visual feedback improvements
- Error recovery system

### Version 1.0.0
- Initial release
- Basic VSIX download functionality

---

## Roadmap

- [ ] Browser extension (Chrome/Firefox)
- [ ] Command-line interface (Node.js)
- [ ] Batch download support
- [ ] Extension dependency resolver
- [ ] Version comparison tool
- [ ] Automated update checker

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

**Guidelines:**
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test on multiple browsers

---

## Support

**Issues:** Report bugs and request features  
**Discussions:** Ask questions and share ideas  
**Email:** Contact Mohammad Faiz for support

---

## License

MIT License

Copyright (c) 2026 Mohammad Faiz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

- Microsoft Visual Studio Code team for the marketplace
- Open source community for inspiration
- All contributors and users

---

**Made with ❤️ by Mohammad Faiz**  
**Version 2.0.0 | January 2026**
