
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  name: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  access_code: string;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  order_num: number;
  answers: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct?: boolean;
  order_num: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: boolean;
}

export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  user_id: string;
  user_name: string;
  score: number;
  max_score: number;
  percentage: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  question_results: {
    question_id: string;
    question_text: string;
    user_answer: string;
    is_correct: boolean;
    correct_answer: string;
  }[];
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  questions: {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    answers: {
      answer_text: string;
      is_correct: boolean;
    }[];
  }[];
}

// User functions
export async function createOrGetUser(name: string): Promise<User | null> {
  try {
    // Check if a user with the given name exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select()
      .eq('name', name)
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    // If user exists, return it
    if (existingUsers && existingUsers.length > 0) {
      return existingUsers[0] as User;
    }
    
    // If user doesn't exist, create a new user
    const { data, error } = await supabase
      .from('users')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error creating or getting user:', error);
    return null;
  }
}

// Quiz functions
export async function createQuiz(creatorId: string, quizData: CreateQuizRequest): Promise<Quiz | null> {
  try {
    // Start a transaction by using Supabase's client
    // 1. Create the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description || null,
        creator_id: creatorId
      })
      .select()
      .single();
    
    if (quizError) throw quizError;
    
    // 2. Create questions and answers
    for (let i = 0; i < quizData.questions.length; i++) {
      const questionData = quizData.questions[i];
      
      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quiz.id,
          question_text: questionData.question_text,
          question_type: questionData.question_type,
          order_num: i + 1
        })
        .select()
        .single();
      
      if (questionError) throw questionError;
      
      // Create answers for this question
      const answersToInsert = questionData.answers.map((ans, index) => ({
        question_id: question.id,
        answer_text: ans.answer_text,
        is_correct: ans.is_correct,
        order_num: index + 1
      }));
      
      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert);
      
      if (answersError) throw answersError;
    }
    
    return quiz as Quiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    return null;
  }
}

export async function findQuizByAccessCode(accessCode: string): Promise<Quiz | null> {
  try {
    const { data, error } = await supabase
      .rpc('find_quiz_by_access_code', { code: accessCode });
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Quiz : null;
  } catch (error) {
    console.error('Error finding quiz by access code:', error);
    return null;
  }
}

export async function getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
  try {
    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select()
      .eq('id', quizId)
      .single();
    
    if (quizError) throw quizError;
    
    // Get questions with answers
    const { data: questions, error: questionsError } = await supabase
      .rpc('get_quiz_questions', { quiz_uuid: quizId });
    
    if (questionsError) throw questionsError;
    
    // Format the questions and answers
    const formattedQuestions = questions.map(q => {
      return {
        id: q.question_id,
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type as 'multiple_choice' | 'true_false',
        order_num: q.order_num,
        answers: q.answers as Answer[]
      };
    });
    
    return {
      quiz: quiz as Quiz,
      questions: formattedQuestions
    };
  } catch (error) {
    console.error('Error getting quiz with questions:', error);
    return null;
  }
}

// Quiz attempt functions
export async function startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as QuizAttempt;
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    return null;
  }
}

export async function submitAnswer(
  attemptId: string, 
  questionId: string, 
  answerId: string | null
): Promise<void> {
  try {
    // First, get the question to find out if the answer is correct
    let isCorrect = false;
    
    if (answerId) {
      const { data: answer, error: answerError } = await supabase
        .from('answers')
        .select('is_correct')
        .eq('id', answerId)
        .single();
      
      if (answerError) throw answerError;
      isCorrect = answer.is_correct;
    }
    
    // Submit the user answer
    const { error } = await supabase
      .from('user_answers')
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        answer_id: answerId,
        is_correct: isCorrect
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

export async function completeQuizAttempt(attemptId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('complete_quiz_attempt', { attempt_id: attemptId });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error completing quiz attempt:', error);
    throw error;
  }
}

export async function getQuizResult(attemptId: string): Promise<QuizResult | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_quiz_results', { attempt_uuid: attemptId });
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as QuizResult : null;
  } catch (error) {
    console.error('Error getting quiz result:', error);
    return null;
  }
}

export async function getUserQuizAttempts(userId: string): Promise<QuizAttempt[] | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        id,
        quiz_id,
        quizzes (title, access_code),
        score,
        max_score,
        completed,
        started_at,
        completed_at
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data as unknown as QuizAttempt[];
  } catch (error) {
    console.error('Error getting user quiz attempts:', error);
    return null;
  }
}

export async function getCreatedQuizzes(creatorId: string): Promise<Quiz[] | null> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select()
      .eq('creator_id', creatorId);
    
    if (error) throw error;
    return data as Quiz[];
  } catch (error) {
    console.error('Error getting created quizzes:', error);
    return null;
  }
}
