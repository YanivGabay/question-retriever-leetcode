import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-5">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 max-w-md w-full text-center">
        <div className="text-gray-600 dark:text-gray-300 font-medium mb-4">
          {message === 'Loading...' ? 'Connecting to Firebase...' : message}
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="loading-bar-animation bg-blue-500 h-2 rounded-full"></div>
        </div>

        <style>
          {`
            @keyframes loadingBar {
              0% { width: 0%; }
              20% { width: 20%; }
              40% { width: 50%; }
              60% { width: 75%; }
              80% { width: 90%; }
              100% { width: 100%; }
            }

            .loading-bar-animation {
              animation: loadingBar 2s infinite ease-in-out;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default LoadingSpinner;
