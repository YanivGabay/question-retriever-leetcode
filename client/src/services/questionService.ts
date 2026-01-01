import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { Question, TopicTag } from '../models/Question';
import { createRetrievedQuestion, AISummary } from '../models/RetrievedQuestion';

// Collection references
const questionsCol = collection(db, 'questions');
const retrievedQuestionsCol = collection(db, 'retrievedQuestions');

/**
 * Convert Firestore document to Question
 */
const convertDocToQuestion = (doc: QueryDocumentSnapshot<DocumentData>): Question & { id: string } => {
  const data = doc.data() as Question;
  return {
    ...data,
    id: doc.id
  };
};

/**
 * Get all questions with real-time updates
 */
export const getAllQuestions = (callback: (questions: Array<Question & { id: string }>) => void) => {
  return onSnapshot(questionsCol, (snapshot) => {
    const questions = snapshot.docs.map(convertDocToQuestion);
    callback(questions);
  });
};

/**
 * Get filtered questions by difficulty with real-time updates
 */
export const getQuestionsByDifficulty = (difficulty: string, callback: (questions: Array<Question & { id: string }>) => void) => {
  const q = query(questionsCol, where('difficulty', '==', difficulty));
  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map(convertDocToQuestion);
    callback(questions);
  });
};

/**
 * Get questions by topic tag with real-time updates
 */
export const getQuestionsByTopicTag = (tagName: string, callback: (questions: Array<Question & { id: string }>) => void) => {
  const q = query(questionsCol);
  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs
      .map(convertDocToQuestion)
      .filter((question: Question & { id: string }) => 
        question.topicTags.some((tag: TopicTag) => tag.name.toLowerCase() === tagName.toLowerCase())
      );
    callback(questions);
  });
};

/**
 * Get a question by ID with real-time updates
 */
export const getQuestionById = (id: string, callback: (question: (Question & { id: string }) | null) => void) => {
  const docRef = doc(questionsCol, id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        ...docSnap.data() as Question,
        id: docSnap.id
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Get a random question by difficulty that hasn't been sent yet
 */
export const getRandomUnsentQuestionByDifficulty = async (difficulty: string): Promise<(Question & { id: string }) | null> => {
  try {
    // Step 1: Get all questions of the specified difficulty
    const difficultyQuery = query(questionsCol, where('difficulty', '==', difficulty));
    const questionsByDifficultySnapshot = await getDocs(difficultyQuery);
    const questionsByDifficulty = questionsByDifficultySnapshot.docs.map(convertDocToQuestion);
    
    if (questionsByDifficulty.length === 0) {
      console.log(`No questions found with difficulty: ${difficulty}`);
      return null;
    }
    
    // Step 2: Get all retrieved question IDs (questions already sent)
    const retrievedSnapshot = await getDocs(retrievedQuestionsCol);
    const sentQuestionIds = retrievedSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data().questionId);
    
    // Step 3: Filter out questions that have already been sent
    const availableQuestions = questionsByDifficulty.filter(
      (question: Question & { id: string }) => !sentQuestionIds.includes(question.id)
    );
    
    // If all questions have been sent, get a random one from all questions
    if (availableQuestions.length === 0) {
      console.log(`All ${difficulty} questions have already been sent. Selecting from all of them.`);
      const randomIndex = Math.floor(Math.random() * questionsByDifficulty.length);
      return questionsByDifficulty[randomIndex];
    }
    
    // Step 4: Select a random question from the available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  } catch (error) {
    console.error("Error getting random question:", error);
    return null;
  }
};

/**
 * Check if a question has already been sent
 */
export const isQuestionAlreadySent = async (questionId: string): Promise<{isSent: boolean, retrievedDocId?: string}> => {
  try {
    const q = query(retrievedQuestionsCol, where('questionId', '==', questionId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Question was already sent, return the retrieved document ID
      return { isSent: true, retrievedDocId: snapshot.docs[0].id };
    }
    
    return { isSent: false };
  } catch (error) {
    console.error("Error checking if question was sent:", error);
    return { isSent: false };
  }
};

/**
 * Get AI summary for a question using Firebase Function
 */
const getAISummary = async (question: Question): Promise<AISummary | null> => {
  try {
    if (!functions) {
      console.warn("Firebase Functions not initialized");
      return null;
    }

    const getQuestionSummary = httpsCallable<
      { title: string; difficulty: string; titleSlug: string },
      AISummary
    >(functions, 'getQuestionSummary');

    const result = await getQuestionSummary({
      title: question.title,
      difficulty: question.difficulty,
      titleSlug: question.titleSlug
    });

    console.log("AI Summary received:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error getting AI summary:", error);
    return null;
  }
};

/**
 * Record that a question was sent to the WhatsApp group
 */
export const markQuestionAsSent = async (question: Question & { id: string }): Promise<string | null> => {
  try {
    // First check if this question has already been sent
    const { isSent, retrievedDocId } = await isQuestionAlreadySent(question.id);

    if (isSent && retrievedDocId) {
      console.log(`Question "${question.title}" was already marked as sent with ID: ${retrievedDocId}`);
      return retrievedDocId;
    }

    // Create a record in retrievedQuestions collection using the helper function
    const retrievedQuestion = createRetrievedQuestion(question);

    // Get AI summary in parallel (don't block if it fails)
    const aiSummary = await getAISummary(question);
    if (aiSummary) {
      retrievedQuestion.aiSummary = aiSummary;
    }

    const retrievedDoc = await addDoc(retrievedQuestionsCol, retrievedQuestion);

    console.log(`Question "${question.title}" marked as sent with ID: ${retrievedDoc.id}`);
    return retrievedDoc.id;
  } catch (error) {
    console.error("Error marking question as sent:", error);
    return null;
  }
};

/**
 * Unsend a question by removing it from the retrievedQuestions collection
 */
export const unsendQuestion = async (questionId: string): Promise<boolean> => {
  try {
    const { isSent, retrievedDocId } = await isQuestionAlreadySent(questionId);
    
    if (isSent && retrievedDocId) {
      await deleteDoc(doc(retrievedQuestionsCol, retrievedDocId));
      console.log(`Question with ID ${questionId} unmarked as sent`);
      return true;
    }
    
    console.log(`Question with ID ${questionId} wasn't marked as sent`);
    return false;
  } catch (error) {
    console.error("Error unsending question:", error);
    return false;
  }
}; 