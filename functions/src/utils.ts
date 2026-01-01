export interface AISummary {
  solution: string;
  timeComplexity: string;
  spaceComplexity: string;
}

/**
 * Parse AI response content into structured summary
 */
export function parseAIResponse(content: string): AISummary {
  // Match solution - stop at זמן: or מקום: or end of string
  const solutionMatch = content.match(/פתרון:\s*(.+?)(?=\n(?:זמן|מקום):|$)/s);
  const timeMatch = content.match(/זמן:\s*(O\([^)]+\))/);
  const spaceMatch = content.match(/מקום:\s*(O\([^)]+\))/);

  return {
    solution: solutionMatch?.[1]?.trim() || content.trim(),
    timeComplexity: timeMatch?.[1] || "O(?)",
    spaceComplexity: spaceMatch?.[1] || "O(?)",
  };
}

/**
 * Get Sunday-Thursday date range for current week
 */
export function getWeekRange(now: Date = new Date()): { start: Date; end: Date } {
  const dayOfWeek = now.getDay();

  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const thursday = new Date(sunday);
  thursday.setDate(sunday.getDate() + 4);
  thursday.setHours(23, 59, 59, 999);

  return { start: sunday, end: thursday };
}

/**
 * Check if a date is within the week range
 */
export function isDateInWeekRange(
  date: Date,
  range: { start: Date; end: Date }
): boolean {
  return date >= range.start && date <= range.end;
}
