import React from 'react';
import { Question } from '../models/Question';

interface QuestionSelectorProps {
  selectedDifficulty: 'Easy' | 'Medium' | 'Hard';
  isRetrieving: boolean;
  questions: Array<Question & { id: string }>;
  onSelectDifficulty: (difficulty: 'Easy' | 'Medium' | 'Hard') => void;
  onGetQuestion: () => void;
  onSelectQuestion: (question: Question & { id: string }) => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedDifficulty,
  isRetrieving,
  questions,
  onSelectDifficulty,
  onGetQuestion,
  onSelectQuestion
}) => {
  const [mode, setMode] = React.useState<'random' | 'manual'>('random');
  const [search, setSearch] = React.useState('');
  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40';
      case 'Hard':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const difficultyColors = getDifficultyStyles(selectedDifficulty);
  const searchTerm = search.trim();
  const canSearch = searchTerm.length >= 2 || /^\d+$/.test(searchTerm);
  const matches = !canSearch ? [] : questions
    .filter((question) => {
      const query = searchTerm.toLowerCase();
      return question.title.toLowerCase().includes(query) ||
        question.frontendQuestionId === searchTerm;
    })
    .slice(0, 8);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-6 max-w-3xl mx-auto">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('random')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${mode === 'random' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
          Random question
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
          Choose a question
        </button>
      </div>

      {mode === 'random' ? <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative w-full sm:w-1/3">
          <select
            value={selectedDifficulty}
            onChange={(e) => onSelectDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
            className={`appearance-none border dark:border-gray-600 rounded-md px-4 py-2.5 w-full
              ${difficultyColors} font-medium text-sm cursor-pointer focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:border-transparent`}
            disabled={isRetrieving}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem"
            }}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <button
          onClick={onGetQuestion}
          disabled={isRetrieving}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 transition w-full sm:w-2/3
            flex items-center justify-center font-medium text-sm focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrieving ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Retrieving...
            </span>
          ) : "Get Random Question"}
        </button>
      </div> : <div>
        <label htmlFor="question-search" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Search by question number or title
        </label>
        <input
          id="question-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="For example: 1 or Two Sum"
          className="w-full border dark:border-gray-600 rounded-md px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {canSearch && matches.length === 0 && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No matching questions found.</p>
        )}
        {matches.length > 0 && (
          <ul className="mt-2 border dark:border-gray-600 rounded-md overflow-hidden">
            {matches.map((question) => (
              <li key={question.id}>
                <button
                  onClick={() => {
                    onSelectQuestion(question);
                    setSearch('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 border-b last:border-b-0 dark:border-gray-600"
                >
                  #{question.frontendQuestionId} — {question.title}
                  <span className="ml-2 text-gray-500">{question.difficulty}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>}
    </div>
  );
};

export default QuestionSelector;
