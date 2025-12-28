import validator from 'validator';
export function sanitizeInput(input) {
    if (typeof input === 'string') {
        // Remove HTML tags and escape dangerous characters
        return validator.escape(input.trim());
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    return input; // Numbers, booleans, etc. pass through
}
;
