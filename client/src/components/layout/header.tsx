import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChartLine, LogOut } from "lucide-react";
import type { User } from "@shared/schema";

export default function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getDisplayName = () => {
    const typedUser = user as User | undefined;
    if (typedUser?.firstName && typedUser?.lastName) {
      return `${typedUser.firstName} ${typedUser.lastName}`;
    }
    if (typedUser?.firstName) return typedUser.firstName;
    if (typedUser?.email) return typedUser.email;
    return "User";
  };

  const getInitials = () => {
    const typedUser = user as User | undefined;
    if (typedUser?.firstName && typedUser?.lastName) {
      return `${typedUser.firstName[0]}${typedUser.lastName[0]}`;
    }
    if (typedUser?.firstName) return typedUser.firstName[0];
    if (typedUser?.email) return typedUser.email[0];
    return "U";
  };

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img 
                src="/lakshmi-logo.png" 
                alt="Lakshmi" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-foreground">LakshmiApp</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={(user as User | undefined)?.profileImageUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{getDisplayName()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
