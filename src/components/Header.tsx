
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search";
import { ChevronDown, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User as UserType } from "@supabase/supabase-js";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email
      .split("@")[0]
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 flex">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl">DealMate</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button 
            variant={isActive("/dashboard") ? "default" : "ghost"} 
            size="sm" 
            asChild
            className="text-sm"
          >
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button 
            variant={isActive("/upload") ? "default" : "ghost"} 
            size="sm" 
            asChild
            className="text-sm"
          >
            <Link to="/upload">Upload</Link>
          </Button>
          <Button 
            variant={isActive("/compare") ? "default" : "ghost"} 
            size="sm" 
            asChild
            className="text-sm"
          >
            <Link to="/compare">Compare</Link>
          </Button>
          <Button 
            variant={isActive("/archive") ? "default" : "ghost"} 
            size="sm" 
            asChild
            className="text-sm"
          >
            <Link to="/archive">Archive</Link>
          </Button>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <form onSubmit={handleSearch} className="hidden md:block">
            <SearchInput
              placeholder="Search deals..."
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 overflow-hidden rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || "User"} />
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
