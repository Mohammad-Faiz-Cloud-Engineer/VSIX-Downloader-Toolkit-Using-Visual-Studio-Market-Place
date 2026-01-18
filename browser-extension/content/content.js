// Content script for VSIX Downloader Pro - Production Grade
'use strict';

/**
 * Production-ready VSIX Downloader with optimizations:
 * - Debounced DOM observation
 * - Cached selectors and data
 * - Comprehensive error handling
 * - Performance monitoring
 * - Retry logic with exponential backoff
 */
class VSIXDownloader {
    constructor() {
        this.extensionData = {
            version: '',
            publisher: '',
            identifier: '',
            name: ''
        };
        
        // Performance and state management
        this.observer = null;
        this.processingTimeout = null;
        this.isProcessing = false;
        this.isInjected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000;
        
        // Cache for performance
        this.cachedElements = new Map();
        
        // Debounce timers
        this.debounceTimers = new Map();
        
        this.init();
    }

    init() {
        // Validate we're on the correct page
        if (!this.isValidPage()) {
            return;
        }
        
        this.setupMessageListener();
        this.setupPageLoadHandlers();
        this.setupNavigationWatchers();
    }

    isValidPage() {
        const url = window.location.href;
        return url.includes('marketplace.visualstudio.com/items') && 
               url.includes('itemName=');
    }

    setupPageLoadHandlers() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.debounce('domReady', () => this.startProcessing(), 100);
            });
        } else {
            // DOM already loaded
            this.debounce('domReady', () => this.startProcessing(), 100);
        }
        
        // Additional safety: wait for window load
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                this.debounce('windowLoad', () => this.startProcessing(), 200);
            });
        }
    }

    setupNavigationWatchers() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleNavigation();
        });

        // Watch for SPA navigation (URL changes without page reload)
        let lastUrl = location.href;
        const urlCheckInterval = setInterval(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                this.handleNavigation();
            }
        }, 500);
        
        // Clean up interval after 30 seconds (page should be stable by then)
        setTimeout(() => clearInterval(urlCheckInterval), 30000);
    }

    handleNavigation() {
        // Reset state
        this.resetState();
        
        // Check if still valid page
        if (!this.isValidPage()) {
            return;
        }
        
        // Restart processing
        this.debounce('navigation', () => this.startProcessing(), 500);
    }

    resetState() {
        // Clear existing injection
        const existing = document.getElementById('vsix-downloader-container');
        if (existing) {
            existing.remove();
        }
        
        // Reset data
        this.extensionData = {
            version: '',
            publisher: '',
            identifier: '',
            name: ''
        };
        
        this.isInjected = false;
        this.isProcessing = false;
        this.retryAttempts = 0;
        this.cachedElements.clear();
        
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    async startProcessing() {
        if (this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            await this.extractMetadata();
            
            if (this.hasValidData()) {
                await this.checkAutoInject();
                this.setupDOMObserver();
            } else if (this.retryAttempts < this.maxRetries) {
                // Retry with exponential backoff
                this.retryAttempts++;
                const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
                
                setTimeout(() => {
                    this.isProcessing = false;
                    this.startProcessing();
                }, delay);
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro] Processing error:', error);
        } finally {
            if (this.retryAttempts >= this.maxRetries || this.hasValidData()) {
                this.isProcessing = false;
            }
        }
    }

    setupDOMObserver() {
        if (this.observer || !this.hasValidData()) {
            return;
        }
        
        // Observe for dynamic content changes (e.g., version updates)
        this.observer = new MutationObserver(() => {
            this.debounce('mutation', () => {
                // Re-check if buttons are still present
                if (!document.getElementById('vsix-downloader-container')) {
                    this.checkAutoInject();
                }
            }, 1000);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    hasValidData() {
        return !!(this.extensionData.identifier && 
                  this.extensionData.version &&
                  this.extensionData.publisher);
    }

    async extractMetadata() {
        // Extract from URL (most reliable)
        this.extractFromURL();
        
        // Extract version from DOM
        await this.extractVersion();
        
        // Validate extracted data
        if (!this.hasValidData()) {
            console.warn('[VSIX Downloader Pro] Incomplete metadata:', this.extensionData);
        }
    }

    extractFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const itemName = urlParams.get('itemName');
            
            if (!itemName) {
                return;
            }
            
            this.extensionData.identifier = this.sanitizeText(itemName);
            
            const parts = itemName.split('.');
            if (parts.length >= 2) {
                this.extensionData.publisher = this.sanitizeText(parts[0]);
                this.extensionData.name = this.sanitizeText(parts.slice(1).join('.'));
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro] URL extraction error:', error);
        }
    }

    async extractVersion() {
        // Strategy 1: Check page metadata/JSON-LD
        if (await this.extractVersionFromStructuredData()) {
            return;
        }
        
        // Strategy 2: Check common version selectors
        if (this.extractVersionFromDOM()) {
            return;
        }
        
        // Strategy 3: Check API response (if available in page)
        if (await this.extractVersionFromPageData()) {
            return;
        }
    }

    async extractVersionFromStructuredData() {
        try {
            const scripts = document.querySelectorAll('script[type="application/ld+json"], script[type="application/json"]');
            
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    
                    // Check various possible fields
                    const version = data.softwareVersion || 
                                  data.version || 
                                  data.Version ||
                                  (data.offers && data.offers.version);
                    
                    if (version && this.isValidVersion(version)) {
                        this.extensionData.version = version;
                        return true;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro] Structured data extraction error:', error);
        }
        
        return false;
    }

    extractVersionFromDOM() {
        // Priority selectors for version
        const selectors = [
            // Specific version elements
            '[class*="version-text"]',
            '[class*="version-number"]',
            '[class*="extension-version"]',
            '.version',
            
            // Metadata tables
            '.ux-table-metadata td',
            '.metadata-table td',
            'table.metadata td',
            
            // General containers that might have version
            '[class*="metadata"] [class*="version"]',
            '[class*="details"] [class*="version"]'
        ];
        
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                
                for (const el of elements) {
                    const text = el.textContent.trim();
                    
                    // Check if this looks like a version
                    const versionMatch = text.match(/\b(\d+\.\d+\.\d+(?:\.\d+)?)\b/);
                    if (versionMatch) {
                        this.extensionData.version = versionMatch[1];
                        return true;
                    }
                }
            } catch (e) {
                // Skip invalid selectors
            }
        }
        
        // Fallback: Check all table cells for version pattern
        const allCells = document.querySelectorAll('td, dd, span');
        for (const cell of allCells) {
            const text = cell.textContent.trim();
            
            // Look for "Version" label followed by version number
            if (/version/i.test(text)) {
                const versionMatch = text.match(/\b(\d+\.\d+\.\d+(?:\.\d+)?)\b/);
                if (versionMatch) {
                    this.extensionData.version = versionMatch[1];
                    return true;
                }
            }
        }
        
        return false;
    }

    async extractVersionFromPageData() {
        // Check if page has embedded data (React/Vue apps often do this)
        try {
            // Look for window.__INITIAL_STATE__ or similar
            if (window.__INITIAL_STATE__) {
                const state = window.__INITIAL_STATE__;
                const version = state.extension?.version || 
                              state.item?.version ||
                              state.data?.version;
                
                if (version && this.isValidVersion(version)) {
                    this.extensionData.version = version;
                    return true;
                }
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro] Page data extraction error:', error);
        }
        
        return false;
    }

    isValidVersion(version) {
        if (typeof version !== 'string') return false;
        return /^\d+\.\d+\.\d+/.test(version);
    }

    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[<>"'&]/g, '').trim();
    }

    async checkAutoInject() {
        if (this.isInjected) {
            return;
        }
        
        try {
            const settings = await chrome.storage.sync.get({ autoInject: true });
            
            if (settings.autoInject) {
                this.injectDownloadButtons();
            }
        } catch (error) {
            console.error('[VSIX Downloader Pro] Settings check error:', error);
            // Default to injecting if settings fail
            this.injectDownloadButtons();
        }
    }

    injectDownloadButtons() {
        if (this.isInjected || document.getElementById('vsix-downloader-container')) {
            return;
        }
        
        if (!this.hasValidData()) {
            return;
        }
        
        const targetElement = this.findInjectionTarget();
        
        if (!targetElement) {
            return;
        }
        
        const container = this.createButtonContainer();
        
        // Insert after target element
        if (targetElement.nextSibling) {
            targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
        } else {
            targetElement.parentNode.appendChild(container);
        }
        
        this.isInjected = true;
    }

    findInjectionTarget() {
        // Priority list of injection points
        const targetSelectors = [
            // Near install button
            '.ux-item-action-bar',
            '.ux-item-action-group',
            '.item-header .action-buttons',
            '.vscode-install-button-container',
            '[class*="install-button"]',
            
            // Header area
            '.ux-item-header',
            '.item-header',
            '.extension-header',
            
            // Sidebar
            '.ux-section-side',
            '.referral-links',
            '.sidebar',
            
            // Main content area
            '.ux-item-details',
            '.item-details',
            'main'
        ];
        
        for (const selector of targetSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        return null;
    }

    createButtonContainer() {
        const container = document.createElement('div');
        container.id = 'vsix-downloader-container';
        container.className = 'vsix-downloader-container';
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', 'VSIX Download Options');
        
        const buttons = [
            { text: 'Download VSIX', action: 'vsix', variant: 'primary', title: 'Download as .vsix file' },
            { text: 'Download Package', action: 'vsixpackage', variant: 'secondary', title: 'Download as .vsixpackage file' },
            { text: 'Copy URL', action: 'copy', variant: 'tertiary', title: 'Copy download URLs to clipboard' }
        ];
        
        buttons.forEach(btn => {
            container.appendChild(this.createButton(btn.text, btn.action, btn.variant, btn.title));
        });
        
        return container;
    }

    createButton(text, action, variant, title) {
        const button = document.createElement('button');
        button.className = `vsix-btn vsix-btn-${variant}`;
        button.type = 'button';
        button.title = title;
        button.setAttribute('aria-label', title);
        
        const icon = this.createIcon(action);
        const span = document.createElement('span');
        span.textContent = text;
        
        button.appendChild(icon);
        button.appendChild(span);
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleButtonClick(action, button);
        });
        
        return button;
    }

    createIcon(action) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'vsix-btn-icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('aria-hidden', 'true');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', this.getIconPath(action));
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        icon.appendChild(path);
        return icon;
    }

    getIconPath(action) {
        const icons = {
            vsix: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
            vsixpackage: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
            copy: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        };
        return icons[action] || '';
    }

    handleButtonClick(action, button) {
        if (!this.hasValidData()) {
            this.showNotification('Extension data not available. Please refresh the page.', 'error');
            return;
        }
        
        // Disable button during action
        button.disabled = true;
        
        try {
            this.performAction(action);
        } finally {
            // Re-enable after short delay
            setTimeout(() => {
                button.disabled = false;
            }, 1000);
        }
    }

    performAction(action) {
        const { publisher, name, version } = this.extensionData;
        
        if (!publisher || !name || !version) {
            this.showNotification('Invalid extension data', 'error');
            return;
        }
        
        if (action === 'copy') {
            this.copyUrls(publisher, name, version);
        } else {
            this.downloadFile(publisher, name, version, action);
        }
    }

    downloadFile(publisher, extension, version, type) {
        let url, filename;
        
        if (type === 'vsix') {
            url = `https://${encodeURIComponent(publisher)}.gallery.vsassets.io/_apis/public/gallery/publisher/${encodeURIComponent(publisher)}/extension/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`;
            filename = `${publisher}.${extension}-${version}.vsix`;
        } else {
            url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(publisher)}/vsextensions/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/vspackage`;
            filename = `${publisher}.${extension}-${version}.vsixpackage`;
        }
        
        chrome.runtime.sendMessage({
            action: 'download',
            url: url,
            filename: filename
        }, (response) => {
            if (chrome.runtime.lastError) {
                this.showNotification('Download failed. Opening in new tab...', 'error');
                window.open(url, '_blank');
                return;
            }
            
            if (response && response.success) {
                this.showNotification('Download started successfully', 'success');
            } else {
                const errorMsg = response?.error || 'Unknown error';
                this.showNotification(`Download failed: ${errorMsg}`, 'error');
                window.open(url, '_blank');
            }
        });
    }

    async copyUrls(publisher, extension, version) {
        const vsixUrl = `https://${encodeURIComponent(publisher)}.gallery.vsassets.io/_apis/public/gallery/publisher/${encodeURIComponent(publisher)}/extension/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`;
        
        const packageUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(publisher)}/vsextensions/${encodeURIComponent(extension)}/${encodeURIComponent(version)}/vspackage`;
        
        const text = `VSIX Download URLs for ${publisher}.${extension} v${version}\n\nVSIX URL:\n${vsixUrl}\n\nVSIXPackage URL:\n${packageUrl}`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('URLs copied to clipboard', 'success');
        } catch (error) {
            console.error('[VSIX Downloader Pro] Copy error:', error);
            this.showNotification('Failed to copy URLs', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('vsix-notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'vsix-notification';
        notification.className = `vsix-notification vsix-notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = document.createElement('div');
        icon.className = 'vsix-notification-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'vsix-notification-message';
        messageDiv.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(messageDiv);
        document.body.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('vsix-notification-show');
        });
        
        // Auto-dismiss
        setTimeout(() => {
            notification.classList.remove('vsix-notification-show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getExtensionData') {
                sendResponse({
                    success: this.hasValidData(),
                    data: this.extensionData
                });
            }
            return true;
        });
    }

    debounce(key, callback, delay) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            this.debounceTimers.delete(key);
            callback();
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }
}

// Initialize extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new VSIXDownloader();
    });
} else {
    new VSIXDownloader();
}
