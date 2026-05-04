/**
 * Device Tracker for Kintone Apps
 *
 * Purpose: Track unique devices accessing Kintone apps
 * Usage: Upload this file to any app you want to track
 *
 * Configuration:
 * - CONTROL_APP_ID: App ID where device data is stored (default: 402)
 * - CONTROL_FIELD: Field name to store device data (default: 'control_device')
 * - API_TOKEN: API token with write permission to control app
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // CONFIGURATION - Update these values
  // ═══════════════════════════════════════════════════════
  const CONFIG = {
    CONTROL_APP_ID: 402,
    CONTROL_FIELD: 'control_device',
    API_TOKEN: 'RpRpN8iynoyrrKtjO1oPG6wF8MF3iqIHGv726QzQ',
    CACHE_KEY_PREFIX: 'device_tracking_',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // ms
  };

  // ═══════════════════════════════════════════════════════
  // Device Fingerprint Generation
  // ═══════════════════════════════════════════════════════

  /**
   * Generate unique device fingerprint
   * Format: userId_browser_resolution_timezone
   */
  const generateDeviceId = (userId) => {
    const ua = navigator.userAgent;
    const browser = getBrowserName(ua);
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return `${userId}_${browser}_${screen}_${timezone}`;
  };

  /**
   * Extract browser name from user agent
   */
  const getBrowserName = (ua) => {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
    return 'Unknown';
  };

  // ═══════════════════════════════════════════════════════
  // Cache Management (localStorage)
  // ═══════════════════════════════════════════════════════

  /**
   * Check if device info was already sent today for this specific app
   * @param {string} deviceId - Device fingerprint
   * @param {string} appId - Current app ID
   */
  const shouldSendToday = (deviceId, appId) => {
    try {
      const cacheKey = `${CONFIG.CACHE_KEY_PREFIX}${appId}_${deviceId}`;
      const lastSent = localStorage.getItem(cacheKey);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // If last sent date is today for this app + device combo, skip
      if (lastSent === today) {
        console.log(`[Device Tracker] Already sent today for app ${appId}, skipping...`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Device Tracker] Error checking cache:', error);
      return true; // Send if cache check fails
    }
  };

  /**
   * Update cache after successful send
   * @param {string} deviceId - Device fingerprint
   * @param {string} appId - Current app ID
   */
  const updateCache = (deviceId, appId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `${CONFIG.CACHE_KEY_PREFIX}${appId}_${deviceId}`;
      localStorage.setItem(cacheKey, today);
      console.log(`[Device Tracker] Cache updated for app ${appId}`);
    } catch (error) {
      console.error('[Device Tracker] Error updating cache:', error);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Data Management
  // ═══════════════════════════════════════════════════════

  /**
   * Get current device data structure
   */
  const getCurrentDeviceData = async () => {
    try {
      // Fetch the control record (assuming record ID 1)
      const resp = await kintone.api(
        kintone.api.url('/k/v1/record', true),
        'GET',
        {
          app: CONFIG.CONTROL_APP_ID,
          id: 1
        }
      );

      const fieldValue = resp.record[CONFIG.CONTROL_FIELD]?.value || '{}';
      return {
        data: JSON.parse(fieldValue),
        revision: resp.record.$revision.value
      };
    } catch (error) {
      console.error('[Device Tracker] Error fetching current data:', error);
      return { data: {}, revision: null };
    }
  };

  /**
   * Update device data with retry logic
   */
  const updateDeviceData = async (newData, revision, retryCount = 0) => {
    try {
      const payload = {
        app: CONFIG.CONTROL_APP_ID,
        id: 1,
        record: {
          [CONFIG.CONTROL_FIELD]: {
            value: JSON.stringify(newData)
          }
        }
      };

      // Add revision for optimistic locking
      if (revision) {
        payload.revision = revision;
      }

      await kintone.api(
        kintone.api.url('/k/v1/record', true),
        'PUT',
        payload
      );

      console.log('[Device Tracker] Data updated successfully');
      return true;
    } catch (error) {
      console.error('[Device Tracker] Error updating data:', error);

      // Retry on conflict (revision mismatch)
      if (error.code === 'GAIA_CO02' && retryCount < CONFIG.MAX_RETRIES) {
        console.log(`[Device Tracker] Conflict detected, retrying... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));

        // Fetch latest data and retry
        const { data: latestData, revision: latestRevision } = await getCurrentDeviceData();
        const mergedData = mergeDeviceInfo(latestData, newData);
        return updateDeviceData(mergedData, latestRevision, retryCount + 1);
      }

      return false;
    }
  };

  /**
   * Merge new device info into existing data
   */
  const mergeDeviceInfo = (existingData, newData) => {
    const today = new Date().toISOString().split('T')[0];

    // Ensure today's array exists
    if (!existingData[today]) {
      existingData[today] = [];
    }

    // Get new device info for today
    const newDevices = newData[today] || [];

    // Merge: update existing device or add new one
    newDevices.forEach(newDevice => {
      const existingIndex = existingData[today].findIndex(
        d => d.deviceId === newDevice.deviceId
      );

      if (existingIndex >= 0) {
        // Update existing device
        const existing = existingData[today][existingIndex];
        existing.lastSeen = newDevice.lastSeen;
        existing.accessCount = (existing.accessCount || 1) + 1;

        // Merge apps list
        const apps = new Set([...(existing.apps || []), ...(newDevice.apps || [])]);
        existing.apps = Array.from(apps);
      } else {
        // Add new device
        existingData[today].push(newDevice);
      }
    });

    // Clean old dates (keep only today and yesterday for safety)
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    Object.keys(existingData).forEach(date => {
      if (date !== today && date !== yesterday) {
        delete existingData[date];
      }
    });

    return existingData;
  };

  // ═══════════════════════════════════════════════════════
  // Main Tracking Function
  // ═══════════════════════════════════════════════════════

  /**
   * Send device info to control app
   */
  const sendDeviceInfo = async () => {
    try {
      console.log('[Device Tracker] Starting device tracking...');

      // Get current user info
      const loginUser = kintone.getLoginUser();
      const userId = loginUser.code;
      const userName = loginUser.name;

      // Get current app ID
      const currentAppId = kintone.app.getId();

      // Generate device fingerprint
      const deviceId = generateDeviceId(userId);
      console.log('[Device Tracker] Device ID:', deviceId);
      console.log('[Device Tracker] App ID:', currentAppId);

      // Check if already sent today for this app
      if (!shouldSendToday(deviceId, currentAppId.toString())) {
        return;
      }

      // Prepare device info
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const deviceInfo = {
        deviceId: deviceId,
        userId: userId,
        userName: userName,
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        firstSeen: now,
        lastSeen: now,
        accessCount: 1,
        apps: [currentAppId.toString()]
      };

      // Fetch current data
      const { data: currentData, revision } = await getCurrentDeviceData();

      // Merge new device info
      const newData = { ...currentData };
      if (!newData[today]) {
        newData[today] = [];
      }
      newData[today].push(deviceInfo);

      // Update with retry logic
      const success = await updateDeviceData(newData, revision);

      if (success) {
        // Update cache to prevent duplicate sends for this app
        updateCache(deviceId, currentAppId.toString());
        console.log('[Device Tracker] Device info sent successfully');
      } else {
        console.error('[Device Tracker] Failed to send device info after retries');
      }

    } catch (error) {
      console.error('[Device Tracker] Error in sendDeviceInfo:', error);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════

  /**
   * Initialize device tracker
   */
  const init = () => {
    // Validate configuration
    if (CONFIG.API_TOKEN === 'YOUR_API_TOKEN_HERE') {
      console.warn('[Device Tracker] API token not configured. Please update CONFIG.API_TOKEN');
      return;
    }

    console.log('[Device Tracker] Initialized');

    // Send device info on page load
    sendDeviceInfo();
  };

  // Auto-run on app.record.index.show event
  kintone.events.on('app.record.index.show', (event) => {
    init();
    return event;
  });

})();
