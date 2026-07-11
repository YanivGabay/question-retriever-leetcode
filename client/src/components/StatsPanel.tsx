import React from 'react';

interface StatsPanelProps {
  stats: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    sent: number;
    sentEasy: number;
    sentMedium: number;
    sentHard: number;
  }
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const getPercentage = (sent: number, total: number) =>
    total > 0 ? (sent / total) * 100 : 0;

  const easyPct = getPercentage(stats.sentEasy, stats.easy);
  const mediumPct = getPercentage(stats.sentMedium, stats.medium);
  const hardPct = getPercentage(stats.sentHard, stats.hard);
  const totalPct = getPercentage(stats.sent, stats.total);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Question Statistics</h2>

      <div className="space-y-3 sm:space-y-4">
        <DifficultyProgress
          label="Easy"
          sent={stats.sentEasy}
          total={stats.easy}
          percentage={easyPct}
          barColor="bg-green-500"
          bgColor="bg-green-100 dark:bg-green-900/30"
          textColor="text-green-700 dark:text-green-300"
        />
        <DifficultyProgress
          label="Medium"
          sent={stats.sentMedium}
          total={stats.medium}
          percentage={mediumPct}
          barColor="bg-yellow-500"
          bgColor="bg-yellow-100 dark:bg-yellow-900/30"
          textColor="text-yellow-700 dark:text-yellow-300"
        />
        <DifficultyProgress
          label="Hard"
          sent={stats.sentHard}
          total={stats.hard}
          percentage={hardPct}
          barColor="bg-red-500"
          bgColor="bg-red-100 dark:bg-red-900/30"
          textColor="text-red-700 dark:text-red-300"
        />
      </div>

      <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-100 dark:border-gray-600">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Total Sent:</span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{stats.sent}</span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-gray-600 dark:text-gray-400">{stats.total}</span>
            </div>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {totalPct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${totalPct}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

interface DifficultyProgressProps {
  label: string;
  sent: number;
  total: number;
  percentage: number;
  barColor: string;
  bgColor: string;
  textColor: string;
}

const DifficultyProgress: React.FC<DifficultyProgressProps> = ({
  label, sent, total, percentage, barColor, bgColor, textColor
}) => (
  <div className={`${bgColor} p-3 rounded-lg`}>
    <div className="flex justify-between items-center mb-2">
      <span className={`font-semibold ${textColor}`}>{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {sent} / {total}
        </span>
        <span className={`${textColor} px-2 py-0.5 rounded-full text-xs font-medium`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
    <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-2 overflow-hidden">
      <div
        className={`${barColor} h-2 rounded-full transition-all duration-700 ease-in-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
      {total - sent} remaining
    </div>
  </div>
);

export default StatsPanel;
