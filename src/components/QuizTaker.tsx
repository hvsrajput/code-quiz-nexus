
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  getQuizWithQuestions, 
  startQuizAttempt,
  submitAnswer,
  completeQuizAttempt,
  Question,
  Quiz
} from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Loader2 } from 'lucide-react';

interface QuizTakerProps {
  quizId: string;
  userId: string;
  onQuizCompleted: (attemptId: string) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, userId, onQuizCompleted }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizAndStartAttempt = async () => {
      setIsLoading(true);
      try {
        // Fetch quiz with questions
        const quizData = await getQuizWithQuestions(quizId);
        if (!quizData) {
          throw new Error('Quiz not found');
        }
        
        setQuiz(quizData.quiz);
        setQuestions(quizData.questions);
        
        // Start a quiz attempt
        const attempt = await startQuizAttempt(quizId, userId);
        if (!attempt) {
          throw new Error('Failed to start quiz attempt');
        }
        
        setAttemptId(attempt.id);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizAndStartAttempt();
  }, [quizId, userId, toast]);

  const handleSelectAnswer = (answerId: string) => {
    setSelectedAnswerId(answerId);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswerId || !attemptId) return;
    
    setIsSubmitting(true);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Submit the answer
      await submitAnswer(attemptId, currentQuestion.id, selectedAnswerId);
      
      // Move to next question or complete quiz
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswerId(null);
      } else {
        // Last question, complete the quiz
        await completeQuizAttempt(attemptId);
        onQuizCompleted(attemptId);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center">
        <p>Quiz not found or has no questions.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        {quiz.description && <p className="text-muted-foreground mt-2">{quiz.description}</p>}
        <div className="mt-4">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-medium mb-4">{currentQuestion.question_text}</h3>
          
          <RadioGroup value={selectedAnswerId || ""} className="space-y-3">
            {currentQuestion.answers.map((answer) => (
              <div 
                key={answer.id} 
                className={`
                  flex items-center p-3 rounded-lg border border-gray-200
                  ${selectedAnswerId === answer.id ? 'bg-primary/10 border-primary/50' : 'hover:bg-accent'}
                `}
                onClick={() => handleSelectAnswer(answer.id)}
              >
                <RadioGroupItem value={answer.id} id={answer.id} className="mr-2" />
                <label htmlFor={answer.id} className="flex-grow cursor-pointer">
                  {answer.answer_text}
                </label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="mt-6">
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswerId || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaker;
