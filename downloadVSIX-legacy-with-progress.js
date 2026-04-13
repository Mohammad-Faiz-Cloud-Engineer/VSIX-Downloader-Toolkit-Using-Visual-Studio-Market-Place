/***
#          Author: Mohammad Faiz
#          Version: 3.1.0
#          Last Updated: April 2026
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
                .replace(/\$\{publisher\}/g, encodeURIComponent(publisher))
                .replace(/\$\{extension\}/g, encodeURIComponent(extension))
                .replace(/\$\{version\}/g, encodeURIComponent(this.version));
        },

        getFileName(type = 'vsix') {
            return `${encodeURIComponent(this.identifier)}_${encodeURIComponent(this.version)}.${type}`;
        },

        createDownloadButton() {
            const button = document.createElement('a');
            button.textContent = 'Download VSIX';
            button.href = '#';
            button.setAttribute('role', 'button');
            
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

            // Store click handler so it can be reassigned after download
            const originalText = 'Download VSIX';
            const defaultBg = 'linear-gradient(135deg, #2ecc71, #27ae60)';

            function handleClick(event) {
                event.preventDefault();
                const target = event.currentTarget;
                
                // Prevent double-clicks during download
                target.removeEventListener('click', handleClick);
                target.textContent = 'Downloading...';
                target.style.background = '#95a5a6';

                const xhr = new XMLHttpRequest();
                const url = target.getAttribute('data-url');
                const filename = target.getAttribute('data-filename');

                xhr.open('GET', url, true);
                xhr.responseType = 'blob';

                xhr.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        target.textContent = `Downloading... ${progress}%`;
                    }
                };

                xhr.onload = function() {
                    if (this.status === 200) {
                        const blob = this.response;
                        const link = document.createElement('a');
                        const objectUrl = window.URL.createObjectURL(blob);
                        link.href = objectUrl;
                        link.download = filename;
                        link.click();
                        
                        // Revoke blob URL to prevent memory leak
                        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                        
                        target.textContent = 'Download Complete';
                        target.style.background = defaultBg;
                        
                        setTimeout(() => {
                            target.textContent = originalText;
                            target.addEventListener('click', handleClick);
                        }, 2000);
                    } else {
                        target.textContent = 'Error - Retry';
                        target.style.background = '#e74c3c';
                        
                        setTimeout(() => {
                            target.textContent = originalText;
                            target.style.background = defaultBg;
                            target.addEventListener('click', handleClick);
                        }, 3000);
                    }
                };

                xhr.onerror = function() {
                    target.textContent = 'Network Error';
                    target.style.background = '#e74c3c';
                    
                    setTimeout(() => {
                        target.textContent = originalText;
                        target.style.background = defaultBg;
                        target.addEventListener('click', handleClick);
                    }, 3000);
                };

                xhr.send();
            }

            button.addEventListener('click', handleClick);

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
    if (!extensionData.version || !extensionData.identifier || !extensionData.identifier.includes('.')) {
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
    } else {
        // Container element not found
    }

})();

// Alternative quick download script
(function() {
    'use strict';

    try {
        const URL_PATTERN = 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage';
        const itemName = new URL(window.location.href).searchParams.get('itemName');
        
        if (!itemName || !itemName.includes('.')) {
            return;
        }

        const [publisher, extension] = itemName.split('.');
        const versionElement = document.querySelector('#versionHistoryTab tbody tr .version-history-container-column');
        
        if (!versionElement) {
            return;
        }

        const version = versionElement.textContent.trim();
        const url = URL_PATTERN
            .replace('${publisher}', encodeURIComponent(publisher))
            .replace('${extension}', encodeURIComponent(extension))
            .replace('${version}', encodeURIComponent(version));

        window.open(url, '_blank');

    } catch (error) {
        // Quick download unavailable
    }
})();
