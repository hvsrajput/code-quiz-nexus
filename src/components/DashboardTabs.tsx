
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, BookOpen, Trophy } from 'lucide-react';
import { getUserQuizAttempts, getCreatedQuizzes, Quiz, QuizAttempt } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

interface DashboardTabsProps {
  userId: string;
  userName: string;
  onCreateQuiz: () => void;
  onJoinQuiz: () => void;
  onViewQuizResult: (attemptId: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ 
  userId, 
  userName,
  onCreateQuiz,
  onJoinQuiz,
  onViewQuizResult
}) => {
  const [createdQuizzes, setCreatedQuizzes] = React.useState<Quiz[] | null>(null);
  const [quizAttempts, setQuizAttempts] = React.useState<any[] | null>(null);
  const [isLoadingCreated, setIsLoadingCreated] = React.useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchCreatedQuizzes = async () => {
      setIsLoadingCreated(true);
      try {
        const quizzes = await getCreatedQuizzes(userId);
        setCreatedQuizzes(quizzes);
      } catch (error) {
        console.error('Error fetching created quizzes:', error);
        toast({
          title: "Error",
          description: "Failed to load created quizzes",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCreated(false);
      }
    };

    const fetchQuizAttempts = async () => {
      setIsLoadingAttempts(true);
      try {
        const attempts = await getUserQuizAttempts(userId);
        setQuizAttempts(attempts);
      } catch (error) {
        console.error('Error fetching quiz attempts:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz attempts",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAttempts(false);
      }
    };
    
    fetchCreatedQuizzes();
    fetchQuizAttempts();
  }, [userId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userName}!</h2>
        <p className="text-muted-foreground">Manage your quizzes and attempts</p>
      </div>
      
      <Tabs defaultValue="take">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="take">Take Quiz</TabsTrigger>
          <TabsTrigger value="create">Create Quiz</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="take" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Take a Quiz</CardTitle>
              <CardDescription>Enter a quiz code to start taking a quiz</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={onJoinQuiz} size="lg">
                <BookOpen className="h-4 w-4 mr-2" /> Enter Quiz Code
              </Button>
            </CardContent>
          </Card>
          
          {isLoadingAttempts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            quizAttempts && quizAttempts.some(attempt => !attempt.completed) && (
              <Card>
                <CardHeader>
                  <CardTitle>In Progress Quizzes</CardTitle>
                  <CardDescription>You have some quizzes that you haven't completed yet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quizAttempts
                    .filter(attempt => !attempt.completed)
                    .map((attempt) => (
                      <div key={attempt.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{attempt.quizzes.title}</p>
                          <p className="text-sm text-muted-foreground">Started: {formatDate(attempt.started_at)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewQuizResult(attempt.id)}
                        >
                          Continue
                        </Button>
                      </div>
                    ))
                  }
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Quiz</CardTitle>
              <CardDescription>Create a new quiz with custom questions and answers</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={onCreateQuiz} size="lg">
                <PlusCircle className="h-4 w-4 mr-2" /> Create New Quiz
              </Button>
            </CardContent>
          </Card>
          
          {isLoadingCreated ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            createdQuizzes && createdQuizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Created Quizzes</CardTitle>
                  <CardDescription>Quizzes you've created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {createdQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm">Access Code: <span className="font-mono font-bold">{quiz.access_code}</span></p>
                          <p className="text-xs text-muted-foreground">Created: {formatDate(quiz.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {isLoadingAttempts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : quizAttempts && quizAttempts.filter(attempt => attempt.completed).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>Your completed quizzes and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quizAttempts
                    .filter(attempt => attempt.completed)
                    .map((attempt) => (
                      <div key={attempt.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{attempt.quizzes.title}</p>
                          <p className="text-sm">
                            Score: {attempt.score}/{attempt.max_score} 
                            ({attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0}%)
                          </p>
                          <p className="text-xs text-muted-foreground">Completed: {formatDate(attempt.completed_at)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewQuizResult(attempt.id)}
                        >
                          <Trophy className="h-4 w-4 mr-2" /> View Result
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>You haven't completed any quizzes yet</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={onJoinQuiz} variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" /> Take a Quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
