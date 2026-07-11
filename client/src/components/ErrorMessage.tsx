import React from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  fullScreen?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  fullScreen = false
}) => {
  const content = (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-5 py-4 rounded-md mb-6 max-w-3xl mx-auto">
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-sm">
        {message === 'Connection Error' ?
          'Failed to connect to Firebase. Please check your configuration in firebase/config.ts' :
          message
        }
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-5">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default ErrorMessage;
