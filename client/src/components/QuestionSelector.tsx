import React from 'react';

interface QuestionSelectorProps {
  selectedDifficulty: 'Easy' | 'Medium' | 'Hard';
  isRetrieving: boolean;
  onSelectDifficulty: (difficulty: 'Easy' | 'Medium' | 'Hard') => void;
  onGetQuestion: () => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedDifficulty,
  isRetrieving,
  onSelectDifficulty,
  onGetQuestion
}) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Get Random Question</h2>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
      </div>
    </div>
  );
};

export default QuestionSelector;
