
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getQuizResult, QuizResult as QuizResultType } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';

interface QuizResultProps {
  attemptId: string;
  onBackToHome: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ attemptId, onBackToHome }) => {
  const [result, setResult] = useState<QuizResultType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);
      try {
        const quizResult = await getQuizResult(attemptId);
        if (!quizResult) {
          throw new Error('Result not found');
        }
        
        setResult(quizResult);
      } catch (error) {
        console.error('Error fetching quiz result:', error);
        toast({
          title: "Error",
          description: "Failed to load results. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResult();
  }, [attemptId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center">
        <p>Result not found.</p>
        <Button onClick={onBackToHome} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results: {result.quiz_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{result.score} / {result.max_score} points</h3>
            <div className="mt-3">
              <Progress value={result.percentage} className="h-2" />
              <p className="mt-2 text-lg">{Math.round(result.percentage)}%</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium">Question Review</h3>
            
            {result.question_results.map((question, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  {question.is_correct ? (
                    <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{question.question_text}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex items-center">
                        <span className="font-medium mr-2">Your answer:</span>
                        <span className={question.is_correct ? 'text-green-600' : 'text-red-600'}>
                          {question.user_answer || 'Unanswered'}
                        </span>
                      </p>
                      
                      {!question.is_correct && (
                        <p className="flex items-center">
                          <span className="font-medium mr-2">Correct answer:</span>
                          <span className="text-green-600">{question.correct_answer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <Button onClick={onBackToHome} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResult;
