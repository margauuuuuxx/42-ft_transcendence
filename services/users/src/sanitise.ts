import validator from 'validator';
     
export function sanitizeInput (input: any): any {
    if (typeof input === 'string') {
        // Remove HTML tags and escape dangerous characters
        return validator.escape(input.trim());
    }

    if (typeof input === 'object' && input !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }

    return input; // Numbers, booleans, etc. pass through
};
