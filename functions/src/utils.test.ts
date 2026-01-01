import { describe, it, expect } from 'vitest';
import { parseAIResponse, getWeekRange, isDateInWeekRange } from './utils';

describe('parseAIResponse', () => {
  it('should parse a valid Hebrew AI response', () => {
    const content = `פתרון: השתמש במערך דו-מימדי לשמור את המצבים האפשריים
זמן: O(n*m)
מקום: O(n)`;

    const result = parseAIResponse(content);

    expect(result.solution).toBe('השתמש במערך דו-מימדי לשמור את המצבים האפשריים');
    expect(result.timeComplexity).toBe('O(n*m)');
    expect(result.spaceComplexity).toBe('O(n)');
  });

  it('should handle missing time complexity', () => {
    const content = `פתרון: פתרון פשוט
מקום: O(1)`;

    const result = parseAIResponse(content);

    expect(result.solution).toBe('פתרון פשוט');
    expect(result.timeComplexity).toBe('O(?)');
    expect(result.spaceComplexity).toBe('O(1)');
  });

  it('should handle missing space complexity', () => {
    const content = `פתרון: פתרון פשוט
זמן: O(n)`;

    const result = parseAIResponse(content);

    expect(result.solution).toBe('פתרון פשוט');
    expect(result.timeComplexity).toBe('O(n)');
    expect(result.spaceComplexity).toBe('O(?)');
  });

  it('should return full content as solution if no match', () => {
    const content = 'Some random response without the expected format';

    const result = parseAIResponse(content);

    expect(result.solution).toBe(content);
    expect(result.timeComplexity).toBe('O(?)');
    expect(result.spaceComplexity).toBe('O(?)');
  });

  it('should handle complex time complexity like O(n log n)', () => {
    const content = `פתרון: מיון המערך ואז חיפוש בינארי
זמן: O(n log n)
מקום: O(1)`;

    const result = parseAIResponse(content);

    expect(result.timeComplexity).toBe('O(n log n)');
  });
});

describe('getWeekRange', () => {
  it('should return Sunday to Thursday range', () => {
    // Wednesday, January 1, 2026
    const wednesday = new Date('2026-01-01T12:00:00');
    const range = getWeekRange(wednesday);

    expect(range.start.getDay()).toBe(0); // Sunday
    expect(range.end.getDay()).toBe(4); // Thursday
  });

  it('should set start time to beginning of day', () => {
    const date = new Date('2026-01-01T12:00:00');
    const range = getWeekRange(date);

    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.start.getSeconds()).toBe(0);
  });

  it('should set end time to end of day', () => {
    const date = new Date('2026-01-01T12:00:00');
    const range = getWeekRange(date);

    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
    expect(range.end.getSeconds()).toBe(59);
  });
});

describe('isDateInWeekRange', () => {
  const range = {
    start: new Date('2026-01-04T00:00:00'), // Sunday
    end: new Date('2026-01-08T23:59:59'),   // Thursday
  };

  it('should return true for date within range', () => {
    const tuesday = new Date('2026-01-06T12:00:00');
    expect(isDateInWeekRange(tuesday, range)).toBe(true);
  });

  it('should return true for date at start of range', () => {
    const sunday = new Date('2026-01-04T00:00:00');
    expect(isDateInWeekRange(sunday, range)).toBe(true);
  });

  it('should return true for date at end of range', () => {
    const thursday = new Date('2026-01-08T23:59:59');
    expect(isDateInWeekRange(thursday, range)).toBe(true);
  });

  it('should return false for date before range', () => {
    const saturday = new Date('2026-01-03T12:00:00');
    expect(isDateInWeekRange(saturday, range)).toBe(false);
  });

  it('should return false for date after range', () => {
    const friday = new Date('2026-01-09T12:00:00');
    expect(isDateInWeekRange(friday, range)).toBe(false);
  });
});
