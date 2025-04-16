
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findQuizByAccessCode } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

interface CodeEntryFormProps {
  onQuizFound: (quizId: string) => void;
}

const CodeEntryForm: React.FC<CodeEntryFormProps> = ({ onQuizFound }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a quiz access code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const quiz = await findQuizByAccessCode(accessCode.trim());
      if (quiz) {
        toast({
          title: "Quiz Found",
          description: `Found quiz: ${quiz.title}`
        });
        onQuizFound(quiz.id);
      } else {
        toast({
          title: "Error",
          description: "Quiz not found. Please check the access code.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error finding quiz:', error);
      toast({
        title: "Error",
        description: "Failed to find quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter quiz code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full text-center text-lg uppercase"
            maxLength={6}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : "Join Quiz"}
        </Button>
      </form>
    </div>
  );
};

export default CodeEntryForm;
