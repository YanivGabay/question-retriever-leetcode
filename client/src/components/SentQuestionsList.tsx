import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { unsendQuestion } from '../services/questionService';

interface SentQuestion {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  sentDate: string;
}

interface SentQuestionsListProps {
  isVisible: boolean;
  onUnsend?: () => void;
}

const SentQuestionsList = ({ isVisible, onUnsend }: SentQuestionsListProps) => {
  const [sentQuestions, setSentQuestions] = useState<SentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsendingId, setUnsendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const q = query(collection(db, 'retrievedQuestions'), orderBy('sentDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          questionId: data.questionId,
          title: data.title,
          difficulty: data.difficulty,
          sentDate: data.sentDate
        };
      });

      setSentQuestions(questions);
      setIsLoading(false);
    }, (error) => {
      console.error('Error in snapshot listener:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isVisible]);

  const handleUnsend = async (sentQuestionId: string, questionId: string) => {
    try {
      setUnsendingId(sentQuestionId);
      const success = await unsendQuestion(questionId);
      if (success && onUnsend) {
        onUnsend();
      }
    } catch (error) {
      console.error('Error unsending question:', error);
    } finally {
      setUnsendingId(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Recently Sent Questions</h3>
      {isLoading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading sent questions...</p>
      ) : sentQuestions.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No questions have been sent yet.</p>
      ) : (
        <div className="space-y-2">
          {sentQuestions.map((question) => (
            <div
              key={question.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{question.title}</span>
                <span className={`shrink-0 px-2 py-0.5 text-xs rounded ${
                  question.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                  question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {question.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(question.sentDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleUnsend(question.id, question.questionId)}
                  disabled={unsendingId === question.id}
                  className={`px-3 py-1 text-sm rounded ${
                    unsendingId === question.id
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70'
                  }`}
                >
                  {unsendingId === question.id ? 'Unsending...' : 'Unsend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentQuestionsList;
