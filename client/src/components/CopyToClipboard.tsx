import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../models/Question';
import { useToast } from './Toast';
import { getQuestionDescriptionSummary } from '../services/questionService';

interface CopyToClipboardProps {
  question: (Question & { id: string });
}

const buildMessage = (question: Question & { id: string }, summarySection: string): string => {
  const topics = question.topicTags?.map(tag => tag.name).join(', ') || '';
  const topicsLine = topics ? `\n🏷️ נושאים: ${topics}\n` : '';

  return `🧠 שאלת היום #${question.frontendQuestionId}:
${question.title}

⚡ קושי: ${question.difficulty}
${topicsLine}
${summarySection}🔗 קישור:
https://leetcode.com/problems/${question.titleSlug}

🚀 הרבה בהצלחה! 💪
`;
};

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ question }) => {
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const { showToast } = useToast();
  const userEditedRef = useRef(false);

  useEffect(() => {
    userEditedRef.current = false;
    setIsCopied(false);
    setIsSummaryLoading(true);
    setMessage(buildMessage(question, '📝 מה מבקשים? ✨ מייצר תקציר...\n\n'));

    let cancelled = false;
    getQuestionDescriptionSummary(question)
      .then((summary) => {
        if (cancelled || userEditedRef.current) return;
        const summarySection = summary ? `📝 מה מבקשים?\n${summary}\n\n` : '';
        setMessage(buildMessage(question, summarySection));
      })
      .finally(() => {
        if (!cancelled) setIsSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [question]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      showToast('Message copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xl">📋</div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Copy Shareable Message
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Edit the message below as needed, then copy it to share with your WhatsApp group!
        </p>

        {isSummaryLoading && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ✨ מייצר תקציר לשאלה...
          </p>
        )}

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              userEditedRef.current = true;
              setMessage(e.target.value);
            }}
            className="w-full h-44 sm:h-52 p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-inner resize-none"
            rows={10}
            dir="auto"
            placeholder="Your message will appear here..."
          />
        </div>

        <button
          onClick={handleCopy}
          className={`w-full mt-4 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2
            ${isCopied
              ? 'bg-green-500 text-white focus:ring-green-300 shadow-lg'
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 focus:ring-blue-300 shadow-lg'
            }`}
        >
          {isCopied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
};

export default CopyToClipboard;
