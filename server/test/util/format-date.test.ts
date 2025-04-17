import {test,expect } from '@jest/globals';
import { formatDate } from '../../src/common/util/format-date';

test('should format date to yyyy-mm-dd', () => {
    const date = new Date("2010-01-11T12:00:00Z");
    expect(formatDate(date)).toBe('2010-01-11')
})