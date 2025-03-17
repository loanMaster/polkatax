import {test } from '@jest/globals';
import { fail } from 'assert';
import {validateDates} from "../../src/util/validate-dates";

test('should throw if start date after end date', () => {
    try {
        validateDates(new Date(), new Date(new Date().getTime() - 10));
        fail("Exception was expected")
    } catch  {
        //
    }
});

test('should throw if end date older than 10 years', () => {
    try {
        const startDate = new Date("2010-01-11T12:00:00Z");
        const endDate = new Date("2010-03-11T12:00:00Z");
        validateDates(startDate, endDate);
        fail("Exception was expected")
    } catch  {
        //
    }
});

test('should not throw if dates are ok', () => {
    const startDate = new Date(Date.now() - 10000)
    const endDate = new Date(Date.now())
    validateDates(startDate, endDate);
});