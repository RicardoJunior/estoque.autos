import rateLimit from 'express-rate-limit';
import { config } from '../config';

// Disable rate limiting in test environment
const isTest = process.env.NODE_ENV === 'test';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isTest ? 10000 : config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 5, // 5 requests per IP in production
  message: 'Too many lead submissions, please try again later.',
  skipSuccessfulRequests: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});
