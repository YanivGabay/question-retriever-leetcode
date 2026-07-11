import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { RetrievedQuestion } from '../models/RetrievedQuestion';
import { useToast } from './Toast';

interface WeeklySummaryProps {
  isVisible: boolean;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ isVisible }) => {
  const [weekQuestions, setWeekQuestions] = useState<RetrievedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const { showToast } = useToast();

  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);
    thursday.setHours(23, 59, 59, 999);
    return { start: sunday, end: thursday };
  };

  const formatDateRange = (start: Date, end: Date) => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = months[end.getMonth()];
    if (start.getMonth() === end.getMonth()) {
      return `${startDay}-${endDay} ${month}`;
    }
    const startMonth = months[start.getMonth()];
    return `${startDay} ${startMonth} - ${endDay} ${month}`;
  };

  const getHebrewDayName = (date: Date) => {
    const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
    return days[date.getDay()];
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '🟢';
      case 'Medium': return '🟡';
      case 'Hard': return '🔴';
      default: return '⚡️';
    }
  };

  const generateMessage = (questions: RetrievedQuestion[], range: { start: Date; end: Date }) => {
    if (questions.length === 0) {
      setMessage('אין שאלות לשבוע זה');
      return;
    }
    const dateRangeStr = formatDateRange(range.start, range.end);
    const questionLines = questions.map(q => {
      const sentDate = new Date(q.sentDate);
      const dayName = getHebrewDayName(sentDate);
      const diffEmoji = getDifficultyEmoji(q.difficulty);
      const solution = q.aiSummary?.solution || '[הוסיפי כאן]';
      const timeComplexity = q.aiSummary?.timeComplexity || 'O(?)';
      const spaceComplexity = q.aiSummary?.spaceComplexity || 'O(?)';
      return `✅ ${dayName}: ${q.title}
${diffEmoji} קושי: ${q.difficulty}
🔗 https://leetcode.com/problems/${q.titleSlug}

*פתרון אופטימלי*: ${solution}
סיבוכיות זמן: ${timeComplexity}, סיבוכיות מקום: ${spaceComplexity}
`;
    }).join('\n');

    const msg = `📅 סיכום שבועי LeetCode 📅
(${dateRangeStr})

${questionLines}
🔥 כל הכבוד על ההתמדה! 🔥

🔗 קישורים חשובים:

אתר LeetCode:
https://leetcode.com/

מדריך איך להשתמש בפלטפורמה של ליטקוד:
https://yanivgabay.github.io/leetcode-web-guide/
`;
    setMessage(msg);
  };

  // Real-time listener — auto-updates when questions are added or AI summaries land
  useEffect(() => {
    if (!isVisible) return;

    const range = getWeekRange();
    setDateRange(range);

    const q = query(
      collection(db, 'retrievedQuestions'),
      where('sentDate', '>=', range.start.toISOString()),
      where('sentDate', '<=', range.end.toISOString()),
      orderBy('sentDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as RetrievedQuestion));
      setWeekQuestions(questions);
      generateMessage(questions, range);
      setIsLoading(false);
    }, (error) => {
      console.error('Error in weekly summary listener:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isVisible]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      showToast('Summary copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleBackfill = async () => {
    if (!functions) {
      showToast('Firebase Functions not available', 'error');
      return;
    }
    setIsBackfilling(true);
    try {
      const backfillWeekSummaries = httpsCallable<void, { updated: number; errors: number }>(
        functions,
        'backfillWeekSummaries'
      );
      const result = await backfillWeekSummaries();
      showToast(`Generated ${result.data.updated} summaries`, 'success');
    } catch (error) {
      console.error('Backfill error:', error);
      showToast('Failed to generate AI summaries', 'error');
    } finally {
      setIsBackfilling(false);
    }
  };

  const missingAISummaries = weekQuestions.filter(q => !q.aiSummary).length;

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <span>📊</span> Weekly Summary
        </h2>
      </div>

      {dateRange && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Showing questions from Sunday to Thursday ({formatDateRange(dateRange.start, dateRange.end)})
        </p>
      )}

      {missingAISummaries > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            {missingAISummaries} question(s) missing AI summaries
          </p>
          <button
            onClick={handleBackfill}
            disabled={isBackfilling}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {isBackfilling ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : 'Generate AI Summaries'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading week summary...</div>
      ) : weekQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No questions sent this week (Sunday-Thursday)
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="bg-green-50 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {weekQuestions.filter(q => q.difficulty === 'Easy').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Easy</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {weekQuestions.filter(q => q.difficulty === 'Medium').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Medium</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                {weekQuestions.filter(q => q.difficulty === 'Hard').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Hard</div>
            </div>
          </div>

          <div className="mb-4 max-h-48 overflow-y-auto">
            {weekQuestions.map((q, idx) => (
              <div key={q.id || idx} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  q.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                  q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {q.difficulty}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  #{q.frontendQuestionId} {q.title}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <span>📋</span> Shareable Summary
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-40 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
              dir="auto"
            />
            <button
              onClick={handleCopy}
              className={`w-full mt-3 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                isCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
              }`}
            >
              {isCopied ? '✓ Copied!' : '📋 Copy Weekly Summary'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklySummary;
