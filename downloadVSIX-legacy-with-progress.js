/***
#          Author: Mohammad Faiz
#          Version: 1.5.0
#          Last Updated: January 2026
***/

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        selectors: {
            metadata: '.ux-table-metadata tr',
            container: '.vscode-moreinformation',
            fallbackContainer: 'main'
        },
        urls: {
            vsix: 'https://${publisher}.gallery.vsassets.io/_apis/public/gallery/publisher/${publisher}/extension/${extension}/${version}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage',
            vsixPackage: 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage'
        }
    };

    // Extension data manager
    const extensionData = {
        version: '',
        publisher: '',
        identifier: '',

        getDownloadUrl(type = 'vsix') {
            const [publisher, extension] = this.identifier.split('.');
            const template = CONFIG.urls[type];
            return template
                .replace(/\$\{publisher\}/g, publisher)
                .replace(/\$\{extension\}/g, extension)
                .replace(/\$\{version\}/g, this.version);
        },

        getFileName(type = 'vsix') {
            return `${this.identifier}_${this.version}.${type}`;
        },

        createDownloadButton() {
            const button = document.createElement('a');
            button.innerHTML = '📦 Download VSIX';
            button.href = 'javascript:void(0);';
            
            Object.assign(button.style, {
                fontFamily: 'Segoe UI, system-ui, sans-serif',
                display: 'inline-block',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '15px',
                margin: '5px',
                textDecoration: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(46, 204, 113, 0.3)'
            });

            button.setAttribute('data-url', this.getDownloadUrl('vsix'));
            button.setAttribute('data-filename', this.getFileName('vsix'));

            // Hover effect
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 5px 15px rgba(46, 204, 113, 0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 3px 10px rgba(46, 204, 113, 0.3)';
            });

            button.onclick = (event) => {
                event.preventDefault();
                const target = event.currentTarget;
                const originalText = target.innerHTML;
                
                target.onclick = null;
                target.innerHTML = '⏳ Downloading...';
                target.style.background = '#95a5a6';

                const xhr = new XMLHttpRequest();
                const url = target.getAttribute('data-url');
                const filename = target.getAttribute('data-filename');

                xhr.open('GET', url, true);
                xhr.responseType = 'blob';

                xhr.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        target.innerHTML = `⏳ Downloading... ${progress}%`;
                    }
                };

                xhr.onload = function() {
                    if (this.status === 200) {
                        const blob = this.response;
                        const link = document.createElement('a');
                        link.href = window.URL.createObjectURL(blob);
                        link.download = filename;
                        link.click();
                        
                        target.href = link.href;
                        target.download = link.download;
                        target.innerHTML = '✓ Download Complete';
                        target.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                        
                        setTimeout(() => {
                            target.innerHTML = originalText;
                            target.onclick = button.onclick;
                        }, 2000);
                    } else {
                        target.innerHTML = '✗ Error - Retry';
                        target.style.background = '#e74c3c';
                        console.error(`Error ${this.status}: Failed to download`);
                        
                        setTimeout(() => {
                            target.innerHTML = originalText;
                            target.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                            target.onclick = button.onclick;
                        }, 3000);
                    }
                };

                xhr.onerror = function() {
                    target.innerHTML = '✗ Network Error';
                    target.style.background = '#e74c3c';
                    console.error('Network error occurred');
                    
                    setTimeout(() => {
                        target.innerHTML = originalText;
                        target.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                        target.onclick = button.onclick;
                    }, 3000);
                };

                xhr.send();
            };

            return button;
        }
    };

    // Extract metadata
    const metadataMap = {
        'Version': 'version',
        'Publisher': 'publisher',
        'Unique Identifier': 'identifier'
    };

    const metadataRows = document.querySelectorAll(CONFIG.selectors.metadata);

    for (let i = 0; i < metadataRows.length; i++) {
        const cells = metadataRows[i].querySelectorAll('td');
        if (cells.length === 2) {
            const key = cells[0].innerText.trim();
            const value = cells[1].innerText.trim();
            if (metadataMap[key]) {
                extensionData[metadataMap[key]] = value;
            }
        }
    }

    // Validate data
    if (!extensionData.version || !extensionData.identifier) {
        console.error('Failed to extract extension metadata');
        return;
    }

    // Find container and append button
    let container = document.querySelector(CONFIG.selectors.container);
    if (!container) {
        container = document.querySelector(CONFIG.selectors.fallbackContainer);
    }

    if (container) {
        const button = extensionData.createDownloadButton();
        container.parentElement.appendChild(button);
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log('✓ VSIX Downloader loaded successfully');
    } else {
        console.error('Container element not found');
    }

})();

// Alternative quick download script
(function() {
    'use strict';

    try {
        const URL_PATTERN = 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage';
        const itemName = new URL(window.location.href).searchParams.get('itemName');
        
        if (!itemName) {
            console.error('Extension itemName not found in URL');
            return;
        }

        const [publisher, extension] = itemName.split('.');
        const versionElement = document.querySelector('#versionHistoryTab tbody tr .version-history-container-column');
        
        if (!versionElement) {
            console.error('Version element not found');
            return;
        }

        const version = versionElement.textContent.trim();
        const url = URL_PATTERN
            .replace('${publisher}', publisher)
            .replace('${extension}', extension)
            .replace('${version}', version);

        // Open in new tab
        window.open(url, '_blank');
        console.log('✓ Opening VSIX package in new tab');

    } catch (error) {
        console.error('Quick download error:', error);
    }
})();
