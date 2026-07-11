import React from 'react';

interface HeaderProps {
  subtitle?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ subtitle, darkMode, onToggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 text-center flex-1">
          LeetCode Question Retriever
        </h1>
        <div className="flex-1 flex justify-end">
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </div>
      {subtitle && (
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-2">
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default Header;
