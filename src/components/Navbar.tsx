
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface NavbarProps {
  userName: string | null;
  onLogout: () => void;
}

const Navbar = ({ userName, onLogout }: NavbarProps) => {
  return (
    <nav className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between mb-6">
      <h1 className="text-xl font-bold">Smart Quiz</h1>
      {userName && (
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {userName}</span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
