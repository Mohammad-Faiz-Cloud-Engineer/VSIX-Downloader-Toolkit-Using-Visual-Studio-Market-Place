// Popup script for VSIX Downloader Pro - Production Grade
'use strict';

/**
 * Production-ready popup with:
 * - Robust error handling
 * - Retry logic
 * - Loading states
 * - Accessibility
 * - Performance optimization
 */
class PopupManager {
    constructor() {
        this.extensionData = null;
        this.currentTab = null;
        this.isLoading = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        try {
            // Setup UI event listeners
            this.attachEventListeners();
            
            // Load settings
            await this.loadSettings();
            
            // Check current tab
            await this.checkCurrentTab();
            
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Initialization error:', error);
            this.showStatus('error', 'Initialization Failed', error.message);
        }
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get({
                autoInject: true,
                showNotifications: true
            });
            
            const autoInjectCheckbox = document.getElementById('autoInject');
            if (autoInjectCheckbox) {
                autoInjectCheckbox.checked = settings.autoInject;
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Failed to load settings:', error);
        }
    }

    async checkCurrentTab() {
        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            if (!tab) {
                this.showStatus('error', 'No Active Tab', 'Could not detect active tab');
                return;
            }
            
            this.currentTab = tab;
            
            // Validate tab URL
            if (!tab.url) {
                this.showStatus('inactive', 'Not Available', 'Cannot access this page');
                return;
            }
            
            // Check if on VS Marketplace
            if (!this.isMarketplacePage(tab.url)) {
                this.showStatus(
                    'inactive', 
                    'Not on Marketplace', 
                    'Navigate to a VS Code extension page on marketplace.visualstudio.com'
                );
                return;
            }
            
            // Check if on extension item page
            if (!this.isExtensionPage(tab.url)) {
                this.showStatus(
                    'inactive',
                    'Not on Extension Page',
                    'Navigate to a specific extension page (with itemName parameter)'
                );
                return;
            }
            
            // Fetch extension data from content script
            await this.fetchExtensionData(tab.id);
            
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Tab check error:', error);
            this.showStatus('error', 'Error', 'Failed to check current tab');
        }
    }

    isMarketplacePage(url) {
        return url.includes('marketplace.visualstudio.com');
    }

    isExtensionPage(url) {
        return url.includes('marketplace.visualstudio.com/items') && 
               url.includes('itemName=');
    }

    async fetchExtensionData(tabId) {
        if (this.isLoading) {
            return;
        }
        
        this.isLoading = true;
        this.showStatus('active', 'Loading...', 'Detecting extension details');
        
        try {
            const response = await this.sendMessageWithRetry(tabId, {
                action: 'getExtensionData'
            });
            
            if (response && response.success && response.data) {
                this.extensionData = response.data;
                this.showExtensionInfo();
            } else {
                this.showStatus(
                    'warning',
                    'Extension Not Detected',
                    'The extension details could not be detected. Try refreshing the page.'
                );
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Data fetch error:', error);
            this.showStatus(
                'error',
                'Content Script Error',
                'Please refresh the extension page and try again.'
            );
        } finally {
            this.isLoading = false;
        }
    }

    async sendMessageWithRetry(tabId, message, attempt = 1) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    if (attempt < this.maxRetries) {
                        // Retry with exponential backoff
                        const delay = 300 * Math.pow(2, attempt - 1);
                        setTimeout(() => {
                            this.sendMessageWithRetry(tabId, message, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }, delay);
                    } else {
                        reject(new Error('Content script not responding'));
                    }
                } else {
                    resolve(response);
                }
            });
        });
    }

    showStatus(type, title, message) {
        const statusCard = document.getElementById('statusCard');
        const statusTitle = document.getElementById('statusTitle');
        const statusMessage = document.getElementById('statusMessage');
        
        if (statusCard) {
            statusCard.className = `status-card ${type}`;
        }
        
        if (statusTitle) {
            statusTitle.textContent = title;
        }
        
        if (statusMessage) {
            statusMessage.textContent = message;
        }
        
        // Hide extension info and actions for non-active states
        const extensionInfo = document.getElementById('extensionInfo');
        const actions = document.getElementById('actions');
        
        if (type !== 'active' && type !== 'success') {
            if (extensionInfo) extensionInfo.style.display = 'none';
            if (actions) actions.style.display = 'none';
        }
    }

    showExtensionInfo() {
        if (!this.extensionData) {
            return;
        }
        
        const { identifier, version, publisher, name } = this.extensionData;
        
        // Update UI elements
        const nameElement = document.getElementById('extensionName');
        const publisherElement = document.getElementById('extensionPublisher');
        const versionElement = document.getElementById('extensionVersion');
        
        if (nameElement) {
            nameElement.textContent = identifier || name || 'Unknown';
            nameElement.title = identifier || name || '';
        }
        
        if (publisherElement) {
            publisherElement.textContent = publisher || 'Unknown';
            publisherElement.title = publisher || '';
        }
        
        if (versionElement) {
            versionElement.textContent = version || 'Unknown';
            versionElement.title = version || '';
        }
        
        // Show extension info and actions
        const extensionInfo = document.getElementById('extensionInfo');
        const actions = document.getElementById('actions');
        
        if (extensionInfo) extensionInfo.style.display = 'block';
        if (actions) actions.style.display = 'flex';
        
        // Update status
        this.showStatus('success', 'Extension Detected', 'Ready to download');
    }

    attachEventListeners() {
        // Download buttons
        const downloadVsixBtn = document.getElementById('downloadVsix');
        const downloadPackageBtn = document.getElementById('downloadPackage');
        const copyUrlBtn = document.getElementById('copyUrl');
        
        if (downloadVsixBtn) {
            downloadVsixBtn.addEventListener('click', () => this.handleDownload('vsix', downloadVsixBtn));
        }
        
        if (downloadPackageBtn) {
            downloadPackageBtn.addEventListener('click', () => this.handleDownload('vsixpackage', downloadPackageBtn));
        }
        
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => this.handleCopyUrl(copyUrlBtn));
        }
        
        // Settings
        const autoInjectCheckbox = document.getElementById('autoInject');
        if (autoInjectCheckbox) {
            autoInjectCheckbox.addEventListener('change', (e) => {
                this.handleSettingChange('autoInject', e.target.checked);
            });
        }
        
        // Footer links
        const openSettingsBtn = document.getElementById('openSettings');
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSettings();
            });
        }
        
        const openHelpBtn = document.getElementById('openHelp');
        if (openHelpBtn) {
            openHelpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openHelp();
            });
        }
        
        const openAboutBtn = document.getElementById('openAbout');
        if (openAboutBtn) {
            openAboutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAbout();
            });
        }
    }

    async handleDownload(type, button) {
        if (!this.extensionData || !this.extensionData.identifier || !this.extensionData.version) {
            this.showStatus('error', 'Missing Data', 'Extension data not available');
            return;
        }
        
        // Disable button
        button.disabled = true;
        const originalText = button.querySelector('span').textContent;
        button.querySelector('span').textContent = 'Downloading...';
        
        try {
            const { identifier, version } = this.extensionData;
            const parts = identifier.split('.');
            
            if (parts.length < 2) {
                throw new Error('Invalid extension identifier format');
            }
            
            const publisher = parts[0];
            const extension = parts.slice(1).join('.');
            
            let url, filename;
            
            if (type === 'vsix') {
                url = `https://${encodeURIComponent(publisher)}.gallery.vsassets.io/_apis/public/gallery/publisher/${encodeURIComponent(publisher)}/extension/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`;
                filename = `${identifier}-${version}.vsix`;
            } else {
                url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(publisher)}/vsextensions/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/vspackage`;
                filename = `${identifier}-${version}.vsixpackage`;
            }
            
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: false,
                conflictAction: 'uniquify'
            });
            
            this.showStatus('success', 'Download Started', `Downloading ${filename}`);
            
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Download error:', error);
            this.showStatus('error', 'Download Failed', error.message);
        } finally {
            // Re-enable button
            setTimeout(() => {
                button.disabled = false;
                button.querySelector('span').textContent = originalText;
            }, 1000);
        }
    }

    async handleCopyUrl(button) {
        if (!this.extensionData || !this.extensionData.identifier || !this.extensionData.version) {
            this.showStatus('error', 'Missing Data', 'Extension data not available');
            return;
        }
        
        // Disable button
        button.disabled = true;
        const originalText = button.querySelector('span').textContent;
        button.querySelector('span').textContent = 'Copying...';
        
        try {
            const { identifier, version } = this.extensionData;
            const parts = identifier.split('.');
            
            if (parts.length < 2) {
                throw new Error('Invalid extension identifier format');
            }
            
            const publisher = parts[0];
            const extension = parts.slice(1).join('.');
            
            const vsixUrl = `https://${encodeURIComponent(publisher)}.gallery.vsassets.io/_apis/public/gallery/publisher/${encodeURIComponent(publisher)}/extension/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`;
            
            const packageUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(publisher)}/vsextensions/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/vspackage`;
            
            const text = `VSIX Download URLs for ${identifier} v${version}\n\nVSIX URL:\n${vsixUrl}\n\nVSIXPackage URL:\n${packageUrl}`;
            
            await navigator.clipboard.writeText(text);
            
            this.showStatus('success', 'URLs Copied', 'Download URLs copied to clipboard');
            
            // Reset status after delay
            setTimeout(() => {
                if (this.extensionData) {
                    this.showStatus('success', 'Extension Detected', 'Ready to download');
                }
            }, 2000);
            
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Copy error:', error);
            this.showStatus('error', 'Copy Failed', 'Could not copy to clipboard');
        } finally {
            // Re-enable button
            setTimeout(() => {
                button.disabled = false;
                button.querySelector('span').textContent = originalText;
            }, 1000);
        }
    }

    async handleSettingChange(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
        } catch (error) {
            console.error('[VSIX Downloader Pro Popup] Setting update failed:', error);
        }
    }

    openSettings() {
        // For now, just show a message
        // In future, could open options page
        this.showStatus('info', 'Settings', 'Settings are managed via the toggle below');
        setTimeout(() => {
            if (this.extensionData) {
                this.showStatus('success', 'Extension Detected', 'Ready to download');
            }
        }, 2000);
    }

    openHelp() {
        const helpUrl = 'https://github.com/mohammadFaiz/vsix-downloader#readme';
        chrome.tabs.create({ url: helpUrl });
    }

    showAbout() {
        const manifest = chrome.runtime.getManifest();
        this.showStatus(
            'info',
            `VSIX Downloader Pro v${manifest.version}`,
            `Created by ${manifest.author}. Professional extension manager for VS Code.`
        );
        
        setTimeout(() => {
            if (this.extensionData) {
                this.showStatus('success', 'Extension Detected', 'Ready to download');
            }
        }, 3000);
    }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PopupManager();
    });
} else {
    new PopupManager();
}
