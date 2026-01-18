// Background Service Worker for VSIX Downloader Pro
// Production-Grade Manifest V3 Implementation
'use strict';

/**
 * Production features:
 * - Comprehensive error handling
 * - Security validation
 * - Download tracking
 * - Performance monitoring
 * - Graceful degradation
 */

// State management
const state = {
    downloads: new Map(),
    settings: {
        autoInject: true,
        showNotifications: true,
        downloadLocation: 'default'
    }
};

// Initialize on service worker startup
initialize();

function initialize() {
    setupListeners();
    loadSettings();
}

function setupListeners() {
    // Install/Update events
    chrome.runtime.onInstalled.addListener(handleInstall);
    
    // Message passing from content scripts and popup
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Download lifecycle events
    chrome.downloads.onChanged.addListener(handleDownloadChanged);
    chrome.downloads.onCreated.addListener(handleDownloadCreated);
}

async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            autoInject: true,
            showNotifications: true,
            downloadLocation: 'default'
        });
        
        Object.assign(state.settings, settings);
    } catch (error) {
        console.error('[VSIX Downloader Pro] Failed to load settings:', error);
    }
}

function handleInstall(details) {
    if (details.reason === 'install') {
        // First time installation
        chrome.storage.sync.set(state.settings)
            .then(() => {
                showWelcomeNotification();
            })
            .catch(error => {
                console.error('[VSIX Downloader Pro] Settings initialization failed:', error);
            });
    } else if (details.reason === 'update') {
        const manifest = chrome.runtime.getManifest();
        const previousVersion = details.previousVersion;
        const currentVersion = manifest.version;
        
        // Handle migration if needed
        handleVersionMigration(previousVersion, currentVersion);
    }
}

function handleVersionMigration(fromVersion, toVersion) {
    // Add migration logic here if needed for future versions
}

function showWelcomeNotification() {
    chrome.notifications.create('welcome', {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'VSIX Downloader Pro Installed',
        message: 'Navigate to any VS Code extension page to start downloading!',
        priority: 1
    }).catch(error => {
        console.error('[VSIX Downloader Pro] Welcome notification failed:', error);
    });
}

function handleMessage(request, sender, sendResponse) {
    // Validate message structure
    if (!request || typeof request.action !== 'string') {
        sendResponse({ success: false, error: 'Invalid message format' });
        return false;
    }
    
    // Route message to appropriate handler
    switch (request.action) {
        case 'download':
            handleDownloadRequest(request, sender, sendResponse);
            return true; // Keep channel open for async response
            
        case 'getSettings':
            sendResponse({ success: true, settings: state.settings });
            return false;
            
        case 'updateSettings':
            handleSettingsUpdate(request, sendResponse);
            return true;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
            return false;
    }
}

async function handleDownloadRequest(request, sender, sendResponse) {
    try {
        // Validate request
        const validation = validateDownloadRequest(request);
        if (!validation.valid) {
            sendResponse({ success: false, error: validation.error });
            return;
        }
        
        // Perform download
        const downloadId = await initiateDownload(request.url, request.filename);
        
        // Track download
        state.downloads.set(downloadId, {
            url: request.url,
            filename: request.filename,
            startTime: Date.now(),
            status: 'in_progress'
        });
        
        sendResponse({ success: true, downloadId });
        
    } catch (error) {
        console.error('[VSIX Downloader Pro] Download request failed:', error);
        sendResponse({ 
            success: false, 
            error: error.message || 'Download failed'
        });
    }
}

function validateDownloadRequest(request) {
    // Validate URL
    if (!request.url || typeof request.url !== 'string') {
        return { valid: false, error: 'Invalid or missing URL' };
    }
    
    // Validate filename
    if (!request.filename || typeof request.filename !== 'string') {
        return { valid: false, error: 'Invalid or missing filename' };
    }
    
    // Validate URL format
    let urlObj;
    try {
        urlObj = new URL(request.url);
    } catch (e) {
        return { valid: false, error: 'Malformed URL' };
    }
    
    // Security: Validate domain whitelist
    const allowedDomains = [
        'marketplace.visualstudio.com',
        'gallery.vsassets.io'
    ];
    
    const isAllowedDomain = allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
    
    if (!isAllowedDomain) {
        return { 
            valid: false, 
            error: `Domain not allowed: ${urlObj.hostname}` 
        };
    }
    
    // Validate protocol
    if (urlObj.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }
    
    return { valid: true };
}

async function initiateDownload(url, filename) {
    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename);
    
    try {
        const downloadId = await chrome.downloads.download({
            url: url,
            filename: sanitizedFilename,
            saveAs: false,
            conflictAction: 'uniquify'
        });
        
        return downloadId;
        
    } catch (error) {
        console.error('[VSIX Downloader Pro] Download API error:', error);
        throw new Error(`Download failed: ${error.message}`);
    }
}

function sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
        return 'download.vsix';
    }
    
    // Remove or replace dangerous characters
    let sanitized = filename
        .replace(/[<>:"|?*]/g, '_')  // Windows forbidden chars
        .replace(/\.\./g, '_')        // Path traversal
        .replace(/^\./, '_')          // Hidden files
        .replace(/\s+/g, '_')         // Spaces
        .trim();
    
    // Ensure it has a valid extension
    if (!sanitized.endsWith('.vsix') && !sanitized.endsWith('.vsixpackage')) {
        sanitized += '.vsix';
    }
    
    // Limit length
    if (sanitized.length > 200) {
        const ext = sanitized.substring(sanitized.lastIndexOf('.'));
        sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }
    
    return sanitized;
}

function handleDownloadCreated(downloadItem) {
    // Download created - tracking only
}

function handleDownloadChanged(delta) {
    const downloadId = delta.id;
    
    // Update state
    if (state.downloads.has(downloadId)) {
        const download = state.downloads.get(downloadId);
        
        if (delta.state) {
            download.status = delta.state.current;
            
            if (delta.state.current === 'complete') {
                handleDownloadComplete(downloadId, download);
            } else if (delta.state.current === 'interrupted') {
                handleDownloadInterrupted(downloadId, download, delta);
            }
        }
        
        if (delta.error) {
            download.error = delta.error.current;
        }
    }
}

function handleDownloadComplete(downloadId, download) {
    // Show notification
    if (state.settings.showNotifications) {
        showNotification(
            'Download Complete',
            `${download.filename} downloaded successfully`,
            'success'
        );
    }
    
    // Clean up after delay
    setTimeout(() => {
        state.downloads.delete(downloadId);
    }, 60000); // Keep for 1 minute
}

function handleDownloadInterrupted(downloadId, download, delta) {
    console.error('[VSIX Downloader Pro] Download interrupted:', {
        downloadId,
        error: delta.error?.current
    });
    
    // Show notification
    if (state.settings.showNotifications) {
        const errorMsg = delta.error?.current || 'Unknown error';
        showNotification(
            'Download Failed',
            `Failed to download ${download.filename}: ${errorMsg}`,
            'error'
        );
    }
    
    // Clean up
    setTimeout(() => {
        state.downloads.delete(downloadId);
    }, 5000);
}

async function showNotification(title, message, type = 'info') {
    if (!state.settings.showNotifications) {
        return;
    }
    
    try {
        const iconUrl = type === 'error' ? 'icons/icon-48.png' : 'icons/icon-128.png';
        
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: iconUrl,
            title: title || 'VSIX Downloader Pro',
            message: message || '',
            priority: type === 'error' ? 2 : 1
        });
    } catch (error) {
        console.error('[VSIX Downloader Pro] Notification error:', error);
    }
}

async function handleSettingsUpdate(request, sendResponse) {
    try {
        if (!request.settings || typeof request.settings !== 'object') {
            sendResponse({ success: false, error: 'Invalid settings' });
            return;
        }
        
        // Update state
        Object.assign(state.settings, request.settings);
        
        // Persist to storage
        await chrome.storage.sync.set(request.settings);
        
        sendResponse({ success: true, settings: state.settings });
        
    } catch (error) {
        console.error('[VSIX Downloader Pro] Settings update failed:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Keep service worker alive during downloads
chrome.runtime.onSuspend.addListener(() => {
    // Service worker suspending - cleanup if needed
});

// Error boundary
self.addEventListener('error', (event) => {
    console.error('[VSIX Downloader Pro] Uncaught error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[VSIX Downloader Pro] Unhandled rejection:', event.reason);
});
