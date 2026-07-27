import { csrfMiddleware } from './csrf';

describe('CSRF Middleware Edge Cases', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
        mockReq = { headers: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        process.env.ALLOWED_ORIGIN = 'https://grainlify.com';
    });

    it('should allow requests with valid csrf token and origin', () => {
        mockReq.headers['x-csrf-token'] = 'valid-token';
        mockReq.headers.origin = 'https://grainlify.com';
        
        csrfMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should block browser requests with missing csrf token', () => {
        mockReq.headers.origin = 'https://grainlify.com';
        
        csrfMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'CSRF token missing' });
    });

    it('should block requests with invalid origin', () => {
        mockReq.headers['x-csrf-token'] = 'valid-token';
        mockReq.headers.origin = 'https://malicious.com';
        
        csrfMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid origin' });
    });

    it('should block requests with invalid referer if no origin', () => {
        mockReq.headers['x-csrf-token'] = 'valid-token';
        mockReq.headers.referer = 'https://malicious.com/page';
        
        csrfMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid referer' });
    });

    it('should allow API requests without origin or referer (non-browser)', () => {
        csrfMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
});
