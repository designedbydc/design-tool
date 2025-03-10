/**
 * Utils Class
 * 
 * Collection of utility functions for the application.
 * Includes UUID generation, math helpers, color manipulation,
 * and other commonly used functions.
 */

class Utils {
    /**
     * Generate a UUID v4
     * @returns {string} - UUID string
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Generate a short unique ID
     * @param {number} length - Length of ID (default: 8)
     * @returns {string} - Short unique ID
     */
    static generateShortId(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    
    /**
     * Clamp a number between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * this.clamp(t, 0, 1);
    }
    
    /**
     * Smooth step interpolation
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    static smoothStep(start, end, t) {
        t = this.clamp(t, 0, 1);
        t = t * t * (3 - 2 * t);
        return start + (end - start) * t;
    }
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} - Angle in radians
     */
    static toRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} - Angle in degrees
     */
    static toDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * Parse a color string to RGB values
     * @param {string} color - Color string (hex, rgb, or named color)
     * @returns {Object} - RGB values
     */
    static parseColor(color) {
        // Create a temporary element to parse the color
        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const style = window.getComputedStyle(temp);
        const rgb = style.color;
        document.body.removeChild(temp);
        
        // Extract RGB values
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return null;
        
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
        };
    }
    
    /**
     * Convert RGB to hex color
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {string} - Hex color string
     */
    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} - RGB values
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Interpolate between two colors
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @param {number} t - Interpolation factor (0-1)
     * @returns {string} - Interpolated color
     */
    static interpolateColor(color1, color2, t) {
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        if (!rgb1 || !rgb2) return color1;
        
        const r = Math.round(this.lerp(rgb1.r, rgb2.r, t));
        const g = Math.round(this.lerp(rgb1.g, rgb2.g, t));
        const b = Math.round(this.lerp(rgb1.b, rgb2.b, t));
        
        return this.rgbToHex(r, g, b);
    }
    
    /**
     * Format a number with specified precision
     * @param {number} value - Number to format
     * @param {number} precision - Decimal places
     * @returns {string} - Formatted number
     */
    static formatNumber(value, precision = 2) {
        return Number(value).toFixed(precision);
    }
    
    /**
     * Format bytes to human readable string
     * @param {number} bytes - Bytes to format
     * @returns {string} - Formatted string
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${this.formatNumber(bytes / Math.pow(k, i))} ${sizes[i]}`;
    }
    
    /**
     * Format milliseconds to human readable duration
     * @param {number} ms - Milliseconds to format
     * @returns {string} - Formatted duration
     */
    static formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        const seconds = ms / 1000;
        if (seconds < 60) return `${this.formatNumber(seconds)}s`;
        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.floor(minutes)}m ${Math.floor(seconds % 60)}s`;
        const hours = minutes / 60;
        return `${Math.floor(hours)}h ${Math.floor(minutes % 60)}m`;
    }
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} - Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof RegExp) return new RegExp(obj);
        if (obj instanceof Map) return new Map(this.deepClone(Array.from(obj)));
        if (obj instanceof Set) return new Set(this.deepClone(Array.from(obj)));
        
        const clone = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = this.deepClone(obj[key]);
            }
        }
        
        return clone;
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} - Merged object
     */
    static deepMerge(target, source) {
        if (source === null || typeof source !== 'object') return source;
        if (target === null || typeof target !== 'object') target = {};
        
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] instanceof Date) {
                    target[key] = new Date(source[key]);
                } else if (source[key] instanceof RegExp) {
                    target[key] = new RegExp(source[key]);
                } else if (typeof source[key] === 'object') {
                    target[key] = this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        return target;
    }
    
    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Check if a point is inside a polygon
     * @param {Array} point - Point [x, y]
     * @param {Array} polygon - Array of points [[x, y], ...]
     * @returns {boolean} - Whether point is inside polygon
     */
    static pointInPolygon(point, polygon) {
        const x = point[0];
        const y = point[1];
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0];
            const yi = polygon[i][1];
            const xj = polygon[j][0];
            const yj = polygon[j][1];
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    /**
     * Calculate distance between two points
     * @param {Array} point1 - First point [x, y]
     * @param {Array} point2 - Second point [x, y]
     * @returns {number} - Distance between points
     */
    static distance(point1, point2) {
        const dx = point2[0] - point1[0];
        const dy = point2[1] - point1[1];
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export utility functions globally
window.generateUUID = Utils.generateUUID;
window.generateShortId = Utils.generateShortId;
window.Utils = Utils; 