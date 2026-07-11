import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 max-w-3xl mx-auto mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between text-gray-600 dark:text-gray-400 text-sm gap-2">
        <div>
          © {new Date().getFullYear()} LeetCode Question Retriever
        </div>
        <div>
          Made with care by <a href="https://github.com/YanivGabay" className="text-blue-500 dark:text-blue-400 hover:underline">Yaniv Gabay</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
