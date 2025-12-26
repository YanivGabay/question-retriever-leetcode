import React, { useState, useEffect } from 'react';
import { Question } from '../models/Question';

interface CopyToClipboardProps {
  question: (Question & { id: string });
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ question }) => {
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Create the message directly with actual values
  useEffect(() => {
    const topics = question.topicTags?.map(tag => tag.name).join(', ') || '';
    const topicsLine = topics ? `\n🏷️ נושאים: ${topics}\n` : '';

    const populatedMessage = `🧠 שאלת היום #${question.frontendQuestionId}:
${question.title}

⚡ קושי: ${question.difficulty}
${topicsLine}
🔗 קישור:
https://leetcode.com/problems/${question.titleSlug}

🚀 הרבה בהצלחה! 💪
`;
    setMessage(populatedMessage);
    setIsCopied(false);
  }, [question]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xl">📋</div>
          <h3 className="text-lg font-bold text-gray-800">
            Copy Shareable Message
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Edit the message below as needed, then copy it to share with your WhatsApp group! 🎯
        </p>
        
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-52 p-4 border-2 border-gray-200 rounded-lg text-sm font-mono bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-inner resize-none"
            rows={10}
            dir="auto"
            placeholder="Your message will appear here..."
          />
        </div>
        
        <button
          onClick={handleCopy}
          className={`w-full mt-4 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]
            ${isCopied
              ? 'bg-green-500 text-white focus:ring-green-300 shadow-lg'
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 focus:ring-blue-300 shadow-lg'
            }`}
        >
          {isCopied ? '✅ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
};

export default CopyToClipboard; 