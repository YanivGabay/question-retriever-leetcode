import React from 'react';
import { Question } from '../models/Question';
import CopyToClipboard from './CopyToClipboard';

interface QuestionCardProps {
  question: Question & { id: string };
  questionSent: boolean;
  isSending?: boolean;
  onToggleSentStatus: () => void;
  onGetAnother: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionSent,
  isSending = false,
  onToggleSentStatus,
  onGetAnother
}) => {
  const { difficulty, frontendQuestionId, title, titleSlug, topicTags } = question;

  const getColors = () => {
    switch (difficulty) {
      case 'Easy':
        return {
          bg: 'bg-green-500',
          badgeBg: 'bg-green-100 dark:bg-green-900/50',
          badgeText: 'text-green-700 dark:text-green-300'
        };
      case 'Medium':
        return {
          bg: 'bg-yellow-500',
          badgeBg: 'bg-yellow-100 dark:bg-yellow-900/50',
          badgeText: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'Hard':
        return {
          bg: 'bg-red-500',
          badgeBg: 'bg-red-100 dark:bg-red-900/50',
          badgeText: 'text-red-700 dark:text-red-300'
        };
      default:
        return {
          bg: 'bg-blue-500',
          badgeBg: 'bg-blue-100 dark:bg-blue-900/50',
          badgeText: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <div className={`${colors.bg} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
          {difficulty}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Question #{frontendQuestionId}</div>
        <div className="ml-auto">
          {questionSent ? (
            <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-medium px-3 py-1 rounded-full text-xs">
              ✓ Sent
            </div>
          ) : (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 font-medium px-3 py-1 rounded-full text-xs">
              Not sent
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>

      <div className="mb-5">
        <a
          href={`https://leetcode.com/problems/${titleSlug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline text-sm inline-block"
        >
          Open in LeetCode
        </a>
      </div>

      {topicTags && topicTags.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics:</p>
          <div className="flex flex-wrap gap-2">
            {topicTags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onToggleSentStatus}
          disabled={isSending}
          className={`px-4 py-2 rounded-md transition font-medium text-sm disabled:opacity-50 ${
            questionSent
              ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/70"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          data-sent-status={questionSent ? 'sent' : 'unsent'}
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {questionSent ? 'Unsending...' : 'Sending...'}
            </span>
          ) : (
            questionSent ? "Mark as Not Sent" : "Mark as Sent"
          )}
        </button>

        <button
          onClick={onGetAnother}
          className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/70 transition text-sm font-medium"
        >
          Get Another Question
        </button>
      </div>

      <CopyToClipboard question={question} />
    </div>
  );
};

export default QuestionCard;
