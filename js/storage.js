/**
 * Storage Module
 * 
 * Handles saving and loading application state to/from localStorage.
 */

// Storage keys
const STORAGE_KEYS = {
    APP_STATE: 'figmaClone_appState',
    SCENE_DATA: 'figmaClone_sceneData',
    USER_PREFERENCES: 'figmaClone_userPreferences'
};

/**
 * Save state to localStorage
 * @param {Object} state - Application state to save
 */
function saveToLocalStorage(state) {
    try {
        localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save state to localStorage:', err);
    }
}

/**
 * Load state from localStorage
 * @returns {Object|null} Loaded state or null if not found
 */
function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Failed to load state from localStorage:', err);
        return null;
    }
}

/**
 * Save scene data to localStorage
 * @param {Object} sceneData - Scene data to save
 */
function saveSceneData(sceneData) {
    try {
        localStorage.setItem(STORAGE_KEYS.SCENE_DATA, JSON.stringify(sceneData));
    } catch (err) {
        console.error('Failed to save scene data:', err);
    }
}

/**
 * Load scene data from localStorage
 * @returns {Object|null} Loaded scene data or null if not found
 */
function loadSceneData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SCENE_DATA);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Failed to load scene data:', err);
        return null;
    }
}

/**
 * Save user preferences
 * @param {Object} preferences - User preferences to save
 */
function saveUserPreferences(preferences) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (err) {
        console.error('Failed to save user preferences:', err);
    }
}

/**
 * Load user preferences
 * @returns {Object|null} Loaded preferences or null if not found
 */
function loadUserPreferences() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Failed to load user preferences:', err);
        return null;
    }
}

/**
 * Clear all stored data
 */
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEYS.APP_STATE);
        localStorage.removeItem(STORAGE_KEYS.SCENE_DATA);
        localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    } catch (err) {
        console.error('Failed to clear storage:', err);
    }
}

// Export storage functions
window.storage = {
    save: saveToLocalStorage,
    load: loadFromLocalStorage,
    saveScene: saveSceneData,
    loadScene: loadSceneData,
    savePreferences: saveUserPreferences,
    loadPreferences: loadUserPreferences,
    clear: clearStorage
}; 