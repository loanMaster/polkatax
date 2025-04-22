import { expect, test, describe } from '@jest/globals';

global.navigator = {
  language: 'en-US',
} as Navigator;

import {
  formatCurrency,
  formatTokenAmount,
  formatValue,
  tokenAmountFormatter,
} from './number-formatters';

describe('Formatter Functions', () => {
  describe('tokenAmountFormatter', () => {
    test('should format number with specified digits', () => {
      const formatter = tokenAmountFormatter(2);
      const formatted = formatter.format(1234.5678);
      expect(formatted).toBe('1,234.57');
    });

    test('should format number with integer part without decimals if 0 digits specified', () => {
      const formatter = tokenAmountFormatter(0);
      const formatted = formatter.format(1234.5678);
      expect(formatted).toBe('1,235');
    });
  });

  describe('formatTokenAmount', () => {
    test('should format token amount with specified digits', () => {
      const result = formatTokenAmount(1234.5678, 3);
      expect(result).toBe('1,234.568');
    });
  });

  describe('formatValue', () => {
    test('should format value with 2 decimal places', () => {
      const result = formatValue(1234.5678);
      expect(result).toBe('1,234.57');
    });

    test('should return "-" if value is undefined', () => {
      const result = formatValue(undefined as unknown as number);
      expect(result).toBe('-');
    });

    test('should return "-" if value is NaN', () => {
      const result = formatValue(NaN);
      expect(result).toBe('-');
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly with USD', () => {
      const result = formatCurrency(1234.5678, 'usd');
      expect(result).toBe('$1,234.57');
    });

    test('should format currency correctly with EUR', () => {
      const result = formatCurrency(1234.5678, 'eur');
      expect(result).toBe('€1,234.57');
    });

    test('should return "-" if value is undefined', () => {
      const result = formatCurrency(undefined as unknown as number, 'usd');
      expect(result).toBe('-');
    });

    test('should return "-" if value is NaN', () => {
      const result = formatCurrency(NaN, 'usd');
      expect(result).toBe('-');
    });
  });
});
