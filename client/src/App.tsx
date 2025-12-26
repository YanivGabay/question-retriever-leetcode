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

import './App.css';

function App() {
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

  // Check if database has questions on component mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'questions'));
        setIsDbEmpty(snapshot.size === 0);
        
        if (snapshot.size > 0) {
          // If we have questions, set up the real-time stats listeners
          const cleanup = await fetchStats();
          
          // Clean up function will be called when component unmounts
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
    
    // Return cleanup function
    return () => {
      if (cleanupFn) {
        cleanupFn.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, []);

  // Setup real-time listener for sent questions count (total and by difficulty)
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

  // Fetch question stats
  const fetchStats = async () => {
    try {
      // Set up a real-time listener for total questions
      const unsubscribeTotal = onSnapshot(collection(db, 'questions'), (snapshot) => {
        setStats(prevStats => ({
          ...prevStats,
          total: snapshot.size
        }));
      });
      
      // Set up listeners for questions by difficulty
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
      
      // Clean up listeners when component unmounts
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
      
      // Fetch updated stats
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
        // Auto-mark the question as sent when retrieved
        const retrievedId = await markQuestionAsSent(question);
        if (retrievedId) {
          console.log(`Question "${question.title}" auto-marked as sent`);
          setQuestionSent(true);
        } else {
          // Fallback: check if already sent
          const { isSent } = await isQuestionAlreadySent(question.id);
          setQuestionSent(isSent);
        }
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
      if (questionSent) {
        // If currently marked as sent, unsend it
        setIsRetrieving(true); // Show loading state
        const success = await unsendQuestion(randomQuestion.id);
        
        if (success) {
          console.log(`Successfully unmarked question "${randomQuestion.title}" as sent`);
          setQuestionSent(false);
        } else {
          console.error("Failed to unsend question. It may have already been unsent by another user.");
        }
      } else {
        // If not sent, mark it as sent
        setIsRetrieving(true); // Show loading state
        const retrievedId = await markQuestionAsSent(randomQuestion);
        
        if (retrievedId) {
          console.log(`Successfully marked question "${randomQuestion.title}" as sent`);
          setQuestionSent(true);
        } else {
          console.error("Failed to mark question as sent");
        }
      }
    } catch (error) {
      console.error("Error toggling question sent status:", error);
    } finally {
      setIsRetrieving(false); // Hide loading state
    }
  };

  const handleUnsend = () => {
    setStats(prevStats => ({
      ...prevStats,
      sent: Math.max(0, prevStats.sent - 1)
    }));
  };

  // Different UI states based on application status
  
  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Connecting to Firebase..." />;
  }

  // Database connection error
  if (dbError) {
    return <ErrorMessage message={dbError} title="Connection Error" fullScreen={true} />;
  }

  // Import view (shown only if database is empty)
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

  // Main application view
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="container mx-auto">
        <Header subtitle="Find and track random LeetCode questions by difficulty" />
        
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
            onToggleSentStatus={handleToggleSentStatus}
            onGetAnother={handleGetRandomQuestion}
          />
        )}

        <div className="mt-4 text-center flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowSentQuestions(!showSentQuestions)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {showSentQuestions ? 'Hide Sent Questions' : 'Show Sent Questions'}
          </button>
          <button
            onClick={() => setShowWeeklySummary(!showWeeklySummary)}
            className="text-purple-600 hover:text-purple-800 font-medium"
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

export default App;
