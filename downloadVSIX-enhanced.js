/***
#          Author: Mohammad Faiz
#          Version: 2.0.0
#          Last Updated: January 2026
***/

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        selectors: {
            metadata: ['.ux-table-metadata tr', '.metadata-table tr'],
            container: ['.ms-Fabric.root-38', '.vscode-moreinformation', '.extension-details', 'main'],
            versionHistory: ['#versionHistoryTab tbody tr .version-history-container-column', '.version-column']
        },
        urls: {
            vsix: 'https://${publisher}.gallery.vsassets.io/_apis/public/gallery/publisher/${publisher}/extension/${extension}/${version}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage',
            vsixPackage: 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage'
        },
        styles: {
            button: {
                fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '15px',
                margin: '8px 5px',
                textDecoration: 'none',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            },
            buttonHover: {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(46, 204, 113, 0.4)'
            },
            buttonActive: {
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(46, 204, 113, 0.3)'
            },
            buttonDisabled: {
                background: '#95a5a6',
                cursor: 'not-allowed',
                boxShadow: 'none'
            }
        }
    };

    // Utility functions
    const Utils = {
        // Find element using multiple selectors
        findElement(selectors) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }
            return null;
        },

        // Show notification
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const colors = {
                success: '#2ecc71',
                error: '#e74c3c',
                info: '#3498db',
                warning: '#f39c12'
            };

            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '16px 24px',
                background: colors[type] || colors.info,
                color: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: '10000',
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'slideIn 0.3s ease',
                maxWidth: '400px'
            });

            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },

        // Copy to clipboard
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.showNotification('✓ Copied to clipboard!', 'success');
                return true;
            } catch (err) {
                console.error('Failed to copy:', err);
                return false;
            }
        },

        // Validate extension data
        validateExtensionData(data) {
            const required = ['version', 'publisher', 'identifier'];
            const missing = required.filter(field => !data[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }
            
            return true;
        }
    };

    // Extension data manager
    class ExtensionManager {
        constructor() {
            this.data = {
                version: '',
                publisher: '',
                identifier: '',
                name: '',
                displayName: ''
            };
        }

        extractMetadata() {
            const metadataMap = {
                'Version': 'version',
                'Publisher': 'publisher',
                'Unique Identifier': 'identifier',
                'Extension Name': 'name',
                'Display Name': 'displayName'
            };

            const metadataRows = Utils.findElement(CONFIG.selectors.metadata.map(s => s.replace(' tr', '')));
            if (!metadataRows) {
                throw new Error('Metadata table not found');
            }

            const rows = metadataRows.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const key = cells[0].innerText.trim();
                    const value = cells[1].innerText.trim();
                    if (metadataMap[key]) {
                        this.data[metadataMap[key]] = value;
                    }
                }
            });

            // Extract from URL if metadata incomplete
            if (!this.data.identifier) {
                const urlParams = new URLSearchParams(window.location.search);
                this.data.identifier = urlParams.get('itemName') || '';
            }

            Utils.validateExtensionData(this.data);
            return this.data;
        }

        getDownloadUrl(type = 'vsix') {
            const [publisher, extension] = this.data.identifier.split('.');
            const template = CONFIG.urls[type] || CONFIG.urls.vsix;
            
            return template
                .replace(/\$\{publisher\}/g, publisher)
                .replace(/\$\{extension\}/g, extension)
                .replace(/\$\{version\}/g, this.data.version);
        }

        getFileName(type = 'vsix') {
            return `${this.data.identifier}_${this.data.version}.${type}`;
        }

        async downloadFile(type = 'vsix') {
            const url = this.getDownloadUrl(type);
            const filename = this.getFileName(type);

            try {
                Utils.showNotification(`⬇ Downloading ${filename}...`, 'info');
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => {
                    Utils.showNotification(`✓ Download started: ${filename}`, 'success');
                }, 500);

                return true;
            } catch (error) {
                Utils.showNotification(`✗ Download failed: ${error.message}`, 'error');
                console.error('Download error:', error);
                return false;
            }
        }
    }

    // UI Manager
    class UIManager {
        constructor(extensionManager) {
            this.extensionManager = extensionManager;
            this.buttons = [];
        }

        createButton(text, icon, onClick, variant = 'primary') {
            const button = document.createElement('button');
            button.innerHTML = `${icon} <span>${text}</span>`;
            
            Object.assign(button.style, CONFIG.styles.button);
            
            if (variant === 'secondary') {
                button.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
                button.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
            }

            // Hover effects
            button.addEventListener('mouseenter', () => {
                Object.assign(button.style, CONFIG.styles.buttonHover);
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = CONFIG.styles.button.boxShadow;
            });

            button.addEventListener('mousedown', () => {
                Object.assign(button.style, CONFIG.styles.buttonActive);
            });

            button.addEventListener('mouseup', () => {
                Object.assign(button.style, CONFIG.styles.buttonHover);
            });

            button.addEventListener('click', onClick);

            this.buttons.push(button);
            return button;
        }

        createButtonContainer() {
            const container = document.createElement('div');
            Object.assign(container.style, {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                margin: '16px 0',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            });

            container.id = 'vsix-downloader-container';
            return container;
        }

        render() {
            // Check if already rendered
            if (document.getElementById('vsix-downloader-container')) {
                console.log('VSIX Downloader already rendered');
                return;
            }

            const targetElement = Utils.findElement(CONFIG.selectors.container);
            if (!targetElement) {
                throw new Error('Target container not found');
            }

            const container = this.createButtonContainer();

            // Download VSIX button
            const downloadBtn = this.createButton(
                'Download VSIX',
                '📦',
                () => this.extensionManager.downloadFile('vsix'),
                'primary'
            );

            // Copy URL button
            const copyBtn = this.createButton(
                'Copy URL',
                '📋',
                () => {
                    const url = this.extensionManager.getDownloadUrl('vsix');
                    Utils.copyToClipboard(url);
                },
                'secondary'
            );

            // Download VSIXPackage button
            const downloadPkgBtn = this.createButton(
                'Download Package',
                '📥',
                () => this.extensionManager.downloadFile('vsixPackage'),
                'secondary'
            );

            container.appendChild(downloadBtn);
            container.appendChild(copyBtn);
            container.appendChild(downloadPkgBtn);

            // Insert after target element
            targetElement.parentNode.insertBefore(container, targetElement.nextSibling);

            Utils.showNotification('✓ VSIX Downloader loaded successfully!', 'success');
        }
    }

    // Main initialization
    function init() {
        try {
            // Add CSS animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            const extensionManager = new ExtensionManager();
            extensionManager.extractMetadata();

            const uiManager = new UIManager(extensionManager);
            uiManager.render();

            console.log('✓ VSIX Downloader Enhanced v2.0.0 initialized');
            console.log('Extension Data:', extensionManager.data);

        } catch (error) {
            console.error('VSIX Downloader Error:', error);
            Utils.showNotification(`✗ Error: ${error.message}`, 'error');
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
