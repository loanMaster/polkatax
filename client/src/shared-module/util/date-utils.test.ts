import { expect, beforeAll, test, jest, describe } from '@jest/globals';
import {
  formatDate,
  formatDateUTC,
  formatTimeFrame,
  getEndDate,
  getFirstDayOfYear,
  getStartDate,
  getStartOfCurrentDay,
} from './date-utils';

jest.mock('../model/time-frames', () => ({
  TimeFrames: {
    'This Month': 'This Month',
    'This Year': 'This Year',
    'Last 7 days': 'Last 7 days',
    'Last 30 days': 'Last 30 days',
    'Last Month': 'Last Month',
    lastYear: 2022,
    twoYearsAgo: 2021,
    threeYearsAgo: 2020,
    yourYearsAgo: 2019,
    fiveYearsAgo: 2018,
  },
}));

const mockDate = new Date(2023, 4, 15); // May 15, 2023

describe('Timeframe Functions', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(mockDate);
  });

  describe('getStartOfCurrentDay', () => {
    test('should return the start of the current day', () => {
      const startOfDay = getStartOfCurrentDay();
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });
  });

  describe('getFirstDayOfYear', () => {
    test('should return the first day of the current year', () => {
      const firstDayOfYear = getFirstDayOfYear();
      expect(firstDayOfYear.getFullYear()).toBe(2023);
      expect(firstDayOfYear.getMonth()).toBe(0);
      expect(firstDayOfYear.getDate()).toBe(1);
    });
  });

  describe('getStartDate', () => {
    test('should return the correct start date for "This Month"', () => {
      const startDate = getStartDate('This Month');
      expect(startDate).toBe(new Date(2023, 4, 1).getTime());
    });

    test('should return the correct start date for "This Year"', () => {
      const startDate = getStartDate('This Year');
      expect(startDate).toBe(new Date(2023, 0, 1).getTime());
    });

    test('should return the correct start date for "Last 7 days"', () => {
      const startDate = getStartDate('Last 7 days');
      const expectedStartDate = new Date(mockDate.getTime());
      expectedStartDate.setDate(mockDate.getDate() - 6); // 7 days ago from May 15, 2023
      expect(startDate).toBe(expectedStartDate.getTime());
    });

    test('should return the correct start date for "Last 30 days"', () => {
      const startDate = getStartDate('Last 30 days');
      const expectedStartDate = new Date(mockDate.getTime());
      expectedStartDate.setDate(mockDate.getDate() - 29); // 30 days ago from May 15, 2023
      expect(startDate).toBe(expectedStartDate.getTime());
    });

    test('should return the correct start date for "Last Month"', () => {
      const startDate = getStartDate('Last Month');
      expect(startDate).toBe(new Date(2023, 3, 1).getTime()); // April 1, 2023
    });

    test('should return the correct start date for a last year', () => {
      const startDate = getStartDate('lastYear');
      expect(startDate).toBe(new Date(2022, 0, 1).getTime()); // January 1, 2022
    });
  });

  describe('getEndDate', () => {
    test('should return the correct end date for "This Month"', () => {
      const endDate = getEndDate('This Month');
      const expectedEndDate = new Date(2023, 4, 16);
      expect(endDate).toBe(expectedEndDate.getTime());
    });

    test('should return the correct end date for "This Year"', () => {
      const endDate = getEndDate('This Year');
      const expectedEndDate = new Date(2023, 4, 16);
      expect(endDate).toBe(expectedEndDate.getTime());
    });

    test('should return the correct end date for "Last 7 days"', () => {
      const endDate = getEndDate('Last 7 days');
      const expectedEndDate = new Date(mockDate.getTime());
      expectedEndDate.setDate(mockDate.getDate() + 1); // Adding 1 day
      expect(endDate).toBe(expectedEndDate.getTime());
    });

    test('should return the correct end date for "Last Month"', () => {
      const endDate = getEndDate('Last Month');
      const expectedEndDate = new Date(2023, 3, 31);
      expect(endDate).toBe(expectedEndDate.getTime());
    });
  });

  describe.skip('formatDateUTC', () => {
    test('should correctly format a date in UTC format', () => {
      const utcDate = formatDateUTC(new Date(2023, 4, 15).getTime());
      expect(utcDate).toBe('2023-05-14T22:00:00Z');
    });
  });

  describe('formatDate', () => {
    test('should format a date correctly', () => {
      const formattedDate = formatDate(new Date(2023, 4, 15).getTime());
      expect(formattedDate).toBe('2023-05-15');
    });
  });

  describe('formatTimeFrame', () => {
    test('should correctly format a timeframe for "This Month"', () => {
      const formattedTimeFrame = formatTimeFrame('This Month');
      expect(formattedTimeFrame).toBe('2023-05-01 until 2023-05-15');
    });

    test('should correctly format a timeframe for "Last 7 days"', () => {
      const formattedTimeFrame = formatTimeFrame('Last 7 days');
      expect(formattedTimeFrame).toBe('2023-05-09 until 2023-05-15');
    });
  });
});
