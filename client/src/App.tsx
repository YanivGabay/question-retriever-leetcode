import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';
import { importQuestionsFromJSON } from './utils/importQuestions';
import {
  getRandomUnsentQuestionByDifficulty,

  markQuestionAsSent,
  unsendQuestion,
  isQuestionAlreadySent
} from './services/questionService';
import { Question } from './models/Question';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import StatsPanel from './components/StatsPanel';
import QuestionSelector from './components/QuestionSelector';
import QuestionCard from './components/QuestionCard';
import ImportPanel from './components/ImportPanel';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SentQuestionsList from './components/SentQuestionsList';
import WeeklySummary from './components/WeeklySummary';
import { ToastProvider, useToast } from './components/Toast';

import './App.css';

function AppContent() {
  const { showToast } = useToast();

  // Database status
  const [isDbEmpty, setIsDbEmpty] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Import functionality
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);

  // Question retrieval
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [randomQuestion, setRandomQuestion] = useState<(Question & { id: string }) | null>(null);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [questionSent, setQuestionSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
    sent: number;
    sentEasy: number;
    sentMedium: number;
    sentHard: number;
  }>({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    sent: 0,
    sentEasy: 0,
    sentMedium: 0,
    sentHard: 0
  });

  const [showSentQuestions, setShowSentQuestions] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'questions'));
        setIsDbEmpty(snapshot.size === 0);

        if (snapshot.size > 0) {
          const cleanup = await fetchStats();
          return cleanup;
        }
      } catch (err) {
        console.error('Error checking database:', err);
        setDbError('Could not connect to Firebase. Check your configuration.');
      } finally {
        setIsLoading(false);
      }
    };

    const cleanupFn = checkDatabase();

    return () => {
      if (cleanupFn) {
        cleanupFn.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'retrievedQuestions'), (snapshot) => {
      let sentEasy = 0;
      let sentMedium = 0;
      let sentHard = 0;

      snapshot.docs.forEach(doc => {
        const difficulty = doc.data().difficulty;
        if (difficulty === 'Easy') sentEasy++;
        else if (difficulty === 'Medium') sentMedium++;
        else if (difficulty === 'Hard') sentHard++;
      });

      setStats(prevStats => ({
        ...prevStats,
        sent: snapshot.size,
        sentEasy,
        sentMedium,
        sentHard
      }));
    }, (error) => {
      console.error('Error in sent questions count listener:', error);
    });

    return () => unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      const unsubscribeTotal = onSnapshot(collection(db, 'questions'), (snapshot) => {
        setStats(prevStats => ({
          ...prevStats,
          total: snapshot.size
        }));
      });

      const unsubscribeEasy = onSnapshot(
        query(collection(db, 'questions'), where('difficulty', '==', 'Easy')),
        (snapshot) => {
          setStats(prevStats => ({
            ...prevStats,
            easy: snapshot.size
          }));
        }
      );

      const unsubscribeMedium = onSnapshot(
        query(collection(db, 'questions'), where('difficulty', '==', 'Medium')),
        (snapshot) => {
          setStats(prevStats => ({
            ...prevStats,
            medium: snapshot.size
          }));
        }
      );

      const unsubscribeHard = onSnapshot(
        query(collection(db, 'questions'), where('difficulty', '==', 'Hard')),
        (snapshot) => {
          setStats(prevStats => ({
            ...prevStats,
            hard: snapshot.size
          }));
        }
      );

      return () => {
        unsubscribeTotal();
        unsubscribeEasy();
        unsubscribeMedium();
        unsubscribeHard();
      };
    } catch (err) {
      console.error('Error setting up stat listeners:', err);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);

    try {
      const count = await importQuestionsFromJSON('/free_leetcode_questions.json');
      setImportCount(count);
      setImportDone(true);
      setIsDbEmpty(false);
      fetchStats();
    } catch (err) {
      console.error('Import error:', err);
      setImportError('Error importing questions. Check the console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleGetRandomQuestion = async () => {
    setIsRetrieving(true);
    setRetrievalError(null);
    setRandomQuestion(null);

    try {
      const question = await getRandomUnsentQuestionByDifficulty(selectedDifficulty);
      setRandomQuestion(question);

      if (!question) {
        setRetrievalError(`No more unsent ${selectedDifficulty} questions available!`);
      } else {
        setIsSending(true);
        const retrievedId = await markQuestionAsSent(question);
        if (retrievedId) {
          setQuestionSent(true);
          showToast(`"${question.title}" marked as sent`, 'success');
        } else {
          const { isSent } = await isQuestionAlreadySent(question.id);
          setQuestionSent(isSent);
        }
        setIsSending(false);
      }
    } catch (err) {
      console.error('Error retrieving question:', err);
      setRetrievalError('Error retrieving random question. Check the console for details.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleToggleSentStatus = async () => {
    if (!randomQuestion) return;

    try {
      setIsSending(true);
      if (questionSent) {
        const success = await unsendQuestion(randomQuestion.id);
        if (success) {
          setQuestionSent(false);
          showToast(`"${randomQuestion.title}" unmarked`, 'info');
        } else {
          showToast('Failed to unsend question', 'error');
        }
      } else {
        const retrievedId = await markQuestionAsSent(randomQuestion);
        if (retrievedId) {
          setQuestionSent(true);
          showToast(`"${randomQuestion.title}" marked as sent`, 'success');
        } else {
          showToast('Failed to mark question as sent', 'error');
        }
      }
    } catch (error) {
      console.error("Error toggling question sent status:", error);
      showToast('Something went wrong', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleUnsend = () => {
    setStats(prevStats => ({
      ...prevStats,
      sent: Math.max(0, prevStats.sent - 1)
    }));
  };

  if (isLoading) {
    return <LoadingSpinner message="Connecting to Firebase..." />;
  }

  if (dbError) {
    return <ErrorMessage message={dbError} title="Connection Error" fullScreen={true} />;
  }

  if (isDbEmpty === true) {
    return (
      <ImportPanel
        isImporting={isImporting}
        importCount={importCount}
        importError={importError}
        importDone={importDone}
        onImport={handleImport}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 py-6 sm:py-8 px-3 sm:px-4 transition-colors">
      <div className="container mx-auto">
        <Header subtitle="Find and track random LeetCode questions by difficulty" darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

        <StatsPanel stats={stats} />

        <QuestionSelector
          selectedDifficulty={selectedDifficulty}
          isRetrieving={isRetrieving}
          onSelectDifficulty={setSelectedDifficulty}
          onGetQuestion={handleGetRandomQuestion}
        />

        {retrievalError && (
          <ErrorMessage message={retrievalError} />
        )}

        {randomQuestion && (
          <QuestionCard
            question={randomQuestion}
            questionSent={questionSent}
            isSending={isSending}
            onToggleSentStatus={handleToggleSentStatus}
            onGetAnother={handleGetRandomQuestion}
          />
        )}

        <div className="mt-4 text-center flex justify-center gap-3 sm:gap-4 flex-wrap">
          <button
            onClick={() => setShowSentQuestions(!showSentQuestions)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm sm:text-base"
          >
            {showSentQuestions ? 'Hide Sent Questions' : 'Show Sent Questions'}
          </button>
          <button
            onClick={() => setShowWeeklySummary(!showWeeklySummary)}
            className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium shadow-md text-sm sm:text-base"
          >
            {showWeeklySummary ? 'Hide Weekly Summary' : '📊 Weekly Summary'}
          </button>
        </div>

        <WeeklySummary isVisible={showWeeklySummary} />

        <SentQuestionsList
          isVisible={showSentQuestions}
          onUnsend={handleUnsend}
        />

        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
