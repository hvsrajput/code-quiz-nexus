
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrGetUser } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

interface UserNameFormProps {
  onUserCreated: (userId: string, userName: string) => void;
}

const UserNameForm: React.FC<UserNameFormProps> = ({ onUserCreated }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await createOrGetUser(name.trim());
      if (user) {
        toast({
          title: "Success",
          description: "Welcome to Code Quiz Nexus!"
        });
        onUserCreated(user.id, user.name);
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
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
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : "Continue"}
        </Button>
      </form>
    </div>
  );
};

export default UserNameForm;
