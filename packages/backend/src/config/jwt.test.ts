import { it, expect } from 'vitest';
import { jwtExpirySeconds } from './jwt.js';
it.each([['1h',3600],['7d',604800],['30m',1800],['120',120],['1s',1],['',3600]])('parses expiry %s', (raw, seconds) => expect(jwtExpirySeconds(raw)).toBe(seconds));
it.each(['0','-1','1.5h','0s','invalid','Infinity','999999999999999999999d'])('rejects invalid expiry %s', raw => expect(() => jwtExpirySeconds(raw)).toThrow('JWT_EXPIRES_IN'));
