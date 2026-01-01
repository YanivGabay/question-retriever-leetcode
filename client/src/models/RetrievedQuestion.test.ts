import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRetrievedQuestion } from './RetrievedQuestion';
import { Question } from './Question';

describe('createRetrievedQuestion', () => {
  beforeEach(() => {
    // Mock Date to have consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a RetrievedQuestion from a Question', () => {
    const question: Question & { id: string } = {
      id: 'test-id-123',
      frontendQuestionId: '42',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      topicTags: [
        { name: 'Array', slug: 'array' },
        { name: 'Hash Table', slug: 'hash-table' },
      ],
    };

    const result = createRetrievedQuestion(question);

    expect(result.questionId).toBe('test-id-123');
    expect(result.frontendQuestionId).toBe('42');
    expect(result.title).toBe('Two Sum');
    expect(result.titleSlug).toBe('two-sum');
    expect(result.difficulty).toBe('Easy');
    expect(result.topicTags).toHaveLength(2);
    expect(result.isChosen).toBe(true);
    expect(result.sentDate).toBe('2026-01-01T12:00:00.000Z');
  });

  it('should preserve all topic tags', () => {
    const question: Question & { id: string } = {
      id: 'test-id',
      frontendQuestionId: '1',
      title: 'Test',
      titleSlug: 'test',
      difficulty: 'Medium',
      topicTags: [
        { name: 'Dynamic Programming', slug: 'dynamic-programming' },
        { name: 'Math', slug: 'math' },
        { name: 'String', slug: 'string' },
      ],
    };

    const result = createRetrievedQuestion(question);

    expect(result.topicTags).toEqual([
      { name: 'Dynamic Programming', slug: 'dynamic-programming' },
      { name: 'Math', slug: 'math' },
      { name: 'String', slug: 'string' },
    ]);
  });

  it('should handle empty topic tags', () => {
    const question: Question & { id: string } = {
      id: 'test-id',
      frontendQuestionId: '1',
      title: 'Test',
      titleSlug: 'test',
      difficulty: 'Hard',
      topicTags: [],
    };

    const result = createRetrievedQuestion(question);

    expect(result.topicTags).toEqual([]);
  });

  it('should not include aiSummary by default', () => {
    const question: Question & { id: string } = {
      id: 'test-id',
      frontendQuestionId: '1',
      title: 'Test',
      titleSlug: 'test',
      difficulty: 'Easy',
      topicTags: [],
    };

    const result = createRetrievedQuestion(question);

    expect(result.aiSummary).toBeUndefined();
  });
});
