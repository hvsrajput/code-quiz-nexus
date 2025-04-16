import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createQuiz, CreateQuizRequest } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, Check, X, Key } from 'lucide-react';

interface QuizCreatorProps {
  userId: string;
  onQuizCreated: (quizId: string, accessCode: string) => void;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ userId, onQuizCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [questions, setQuestions] = useState<Array<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    answers: Array<{
      answer_text: string;
      is_correct: boolean;
    }>;
  }>>([
    {
      question_text: '',
      question_type: 'multiple_choice',
      answers: [
        { answer_text: '', is_correct: true },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false }
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomCode, setUseCustomCode] = useState(false);
  const { toast } = useToast();

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        answers: [
          { answer_text: '', is_correct: true },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Error",
        description: "You need at least one question",
        variant: "destructive"
      });
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    
    if (field === 'question_type' && value === 'true_false') {
      newQuestions[index].answers = [
        { answer_text: 'True', is_correct: true },
        { answer_text: 'False', is_correct: false }
      ];
    } else if (field === 'question_type' && value === 'multiple_choice' && newQuestions[index].answers.length === 2) {
      newQuestions[index].answers = [
        { answer_text: '', is_correct: true },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false }
      ];
    }
    
    setQuestions(newQuestions);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[questionIndex].answers[answerIndex] as any)[field] = value;
    
    if (field === 'is_correct' && value === true) {
      newQuestions[questionIndex].answers.forEach((answer, i) => {
        if (i !== answerIndex) {
          answer.is_correct = false;
        }
      });
    }
    
    setQuestions(newQuestions);
  };

  const handleAddAnswer = (questionIndex: number) => {
    if (questions[questionIndex].question_type === 'true_false') {
      toast({
        title: "Error",
        description: "True/False questions can only have two answers",
        variant: "destructive"
      });
      return;
    }
    
    if (questions[questionIndex].answers.length < 6) {
      const newQuestions = [...questions];
      newQuestions[questionIndex].answers.push({ answer_text: '', is_correct: false });
      setQuestions(newQuestions);
    } else {
      toast({
        title: "Error",
        description: "Maximum 6 answers per question",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    if (questions[questionIndex].question_type === 'true_false') {
      toast({
        title: "Error",
        description: "Cannot remove answers from True/False questions",
        variant: "destructive"
      });
      return;
    }
    
    if (questions[questionIndex].answers.length > 2) {
      const newQuestions = [...questions];
      const isRemovingCorrectAnswer = newQuestions[questionIndex].answers[answerIndex].is_correct;
      
      newQuestions[questionIndex].answers = newQuestions[questionIndex].answers.filter(
        (_, i) => i !== answerIndex
      );
      
      if (isRemovingCorrectAnswer) {
        newQuestions[questionIndex].answers[0].is_correct = true;
      }
      
      setQuestions(newQuestions);
    } else {
      toast({
        title: "Error",
        description: "Questions need at least 2 answers",
        variant: "destructive"
      });
    }
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (useCustomCode) {
      if (!accessCode.trim()) {
        toast({
          title: "Error",
          description: "Access code is required when custom code is enabled",
          variant: "destructive"
        });
        return false;
      }
      
      if (accessCode.trim().length < 4 || accessCode.trim().length > 10) {
        toast({
          title: "Error",
          description: "Access code must be between 4 and 10 characters",
          variant: "destructive"
        });
        return false;
      }
    }
    
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        toast({
          title: "Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive"
        });
        return false;
      }
      
      for (let j = 0; j < questions[i].answers.length; j++) {
        if (!questions[i].answers[j].answer_text.trim()) {
          toast({
            title: "Error",
            description: `Answer text is required for question ${i + 1}, answer ${j + 1}`,
            variant: "destructive"
          });
          return false;
        }
      }
      
      if (!questions[i].answers.some(answer => answer.is_correct)) {
        toast({
          title: "Error",
          description: `Question ${i + 1} needs at least one correct answer`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuiz()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const quizData: CreateQuizRequest = {
        title,
        description: description.trim() || undefined,
        access_code: useCustomCode ? accessCode.trim().toUpperCase() : undefined,
        questions
      };
      
      console.log("Submitting quiz data:", quizData);
      
      const quiz = await createQuiz(userId, quizData);
      if (quiz) {
        toast({
          title: "Success",
          description: "Quiz created successfully!"
        });
        onQuizCreated(quiz.id, quiz.access_code);
      } else {
        throw new Error('Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quiz Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              disabled={isLoading}
            />
          </div>
          
          <div className="border p-4 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={useCustomCode} 
                onCheckedChange={(checked) => setUseCustomCode(checked === true)}
                id="custom-code"
                disabled={isLoading}
              />
              <label 
                htmlFor="custom-code"
                className="flex items-center text-sm font-medium cursor-pointer"
              >
                <Key className="h-4 w-4 mr-1" /> Use custom access code
              </label>
            </div>
            
            {useCustomCode && (
              <div>
                <Input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter custom access code (4-10 characters)"
                  maxLength={10}
                  disabled={isLoading}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom access codes make it easier to share your quiz. If not provided, a random code will be generated.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-8">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Question {qIndex + 1}</h3>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Question Text</label>
                <Textarea
                  value={question.question_text}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  placeholder="Enter question"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <Select
                  value={question.question_type}
                  onValueChange={(value) => handleQuestionChange(qIndex, 'question_type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium">Answers</label>
                
                {question.answers.map((answer, aIndex) => (
                  <div key={aIndex} className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={answer.is_correct}
                        onCheckedChange={(checked) => 
                          handleAnswerChange(qIndex, aIndex, 'is_correct', checked)
                        }
                        disabled={isLoading}
                      />
                    </div>
                    
                    <Input
                      value={answer.answer_text}
                      onChange={(e) => 
                        handleAnswerChange(qIndex, aIndex, 'answer_text', e.target.value)
                      }
                      placeholder={`Answer ${aIndex + 1}`}
                      className="flex-grow"
                      disabled={isLoading || question.question_type === 'true_false'}
                    />
                    
                    {question.question_type !== 'true_false' && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAnswer(qIndex, aIndex)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {question.question_type !== 'true_false' && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAnswer(qIndex)}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Answer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        </div>
        
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Quiz..." : "Create Quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator;
