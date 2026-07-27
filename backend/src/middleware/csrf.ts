export function csrfMiddleware(req: any, res: any, next: any) {
    // Basic CSRF validation
    const token = req.headers['x-csrf-token'];
    
    // Allow non-browser requests (e.g. API clients) if they lack origin/referer
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    const isBrowserRequest = origin || referer;

    // Edge case: missing CSRF token in browser-facing requests
    if (isBrowserRequest && !token) {
        return res.status(403).json({ error: 'CSRF token missing' });
    }
    
    // Edge case: Validate origin and referer for browser-facing requests
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://grainlify.com';
    
    if (origin && origin !== allowedOrigin) {
        return res.status(403).json({ error: 'Invalid origin' });
    }
    
    if (isBrowserRequest && !origin && referer && !referer.startsWith(allowedOrigin)) {
        return res.status(403).json({ error: 'Invalid referer' });
    }

    next();
}
