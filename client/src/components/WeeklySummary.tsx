import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { RetrievedQuestion } from '../models/RetrievedQuestion';

interface WeeklySummaryProps {
  isVisible: boolean;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ isVisible }) => {
  const [weekQuestions, setWeekQuestions] = useState<RetrievedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Get Sunday-Thursday date range for current week
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Find the most recent Sunday (start of week)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    // Thursday is Sunday + 4 days
    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);
    thursday.setHours(23, 59, 59, 999);

    return { start: sunday, end: thursday };
  };

  // Format date for display (e.g., "22-26 דצמבר")
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
    } else {
      const startMonth = months[start.getMonth()];
      return `${startDay} ${startMonth} - ${endDay} ${month}`;
    }
  };

  // Fetch questions for the week
  const fetchWeekQuestions = async () => {
    setIsLoading(true);
    try {
      const range = getWeekRange();
      setDateRange(range);

      const retrievedCol = collection(db, 'retrievedQuestions');
      const snapshot = await getDocs(retrievedCol);

      // Filter questions within the date range
      const questions = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as RetrievedQuestion))
        .filter(q => {
          const sentDate = new Date(q.sentDate);
          return sentDate >= range.start && sentDate <= range.end;
        })
        .sort((a, b) => new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime());

      setWeekQuestions(questions);
      generateMessage(questions, range);
    } catch (error) {
      console.error('Error fetching week questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the formatted message
  const generateMessage = (questions: RetrievedQuestion[], range: { start: Date; end: Date }) => {
    if (questions.length === 0) {
      setMessage('אין שאלות לשבוע זה');
      return;
    }

    const easy = questions.filter(q => q.difficulty === 'Easy');
    const medium = questions.filter(q => q.difficulty === 'Medium');
    const hard = questions.filter(q => q.difficulty === 'Hard');

    const formatQuestion = (q: RetrievedQuestion) => {
      const topics = q.topicTags?.map(t => t.name).join(', ') || '';
      const topicsPart = topics ? ` (${topics})` : '';
      return `• #${q.frontendQuestionId} ${q.title}${topicsPart}`;
    };

    const formatSection = (label: string, emoji: string, qs: RetrievedQuestion[]) => {
      if (qs.length === 0) return '';
      return `${emoji} ${label}:\n${qs.map(formatQuestion).join('\n')}\n`;
    };

    const dateRangeStr = formatDateRange(range.start, range.end);

    const msg = `📊 סיכום שבועי - שאלות LeetCode

🗓️ שבוע ${dateRangeStr}

${formatSection('Easy', '📗', easy)}${formatSection('Medium', '📙', medium)}${formatSection('Hard', '📕', hard)}
סה"כ: ${questions.length} שאלות השבוע

🚀 שבוע מעולה! 💪
`;

    setMessage(msg);
  };

  useEffect(() => {
    if (isVisible) {
      fetchWeekQuestions();
    }
  }, [isVisible]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span>📊</span> Weekly Summary
        </h2>
        <button
          onClick={fetchWeekQuestions}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {dateRange && (
        <p className="text-sm text-gray-500 mb-4">
          Showing questions from Sunday to Thursday ({formatDateRange(dateRange.start, dateRange.end)})
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading week summary...</div>
      ) : weekQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No questions sent this week (Sunday-Thursday)
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">
                {weekQuestions.filter(q => q.difficulty === 'Easy').length}
              </div>
              <div className="text-xs text-gray-600">Easy</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">
                {weekQuestions.filter(q => q.difficulty === 'Medium').length}
              </div>
              <div className="text-xs text-gray-600">Medium</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-red-600">
                {weekQuestions.filter(q => q.difficulty === 'Hard').length}
              </div>
              <div className="text-xs text-gray-600">Hard</div>
            </div>
          </div>

          {/* Questions list */}
          <div className="mb-4 max-h-48 overflow-y-auto">
            {weekQuestions.map((q, idx) => (
              <div key={q.id || idx} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {q.difficulty}
                </span>
                <span className="text-sm text-gray-700">
                  #{q.frontendQuestionId} {q.title}
                </span>
              </div>
            ))}
          </div>

          {/* Copy message section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-4 border border-purple-200">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📋</span> Shareable Summary
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-40 p-3 border-2 border-gray-200 rounded-lg text-sm font-mono bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
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
              {isCopied ? '✅ Copied!' : '📋 Copy Weekly Summary'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklySummary;
