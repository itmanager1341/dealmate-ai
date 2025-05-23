
import { SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, Sidebar as ShadcnSidebar } from "@/components/ui/sidebar";
import { Archive, BarChart2, Briefcase, FileText, Home, PlusCircle, UploadCloud } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-bold text-xl">DealMate</span>
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }
    if (path === '/deal' && location.pathname.startsWith('/deal/')) {
      return true;
    }
    return location.pathname === path;
  };
  
  return (
    <ShadcnSidebar>
      <SidebarHeader className="flex items-center justify-between px-4 py-6">
        <span className="font-bold text-xl">DealMate</span>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={cn(isActive('/dashboard') && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Link to="/dashboard">
                <Home className="h-5 w-5 mr-2" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={cn(isActive('/upload') && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Link to="/upload">
                <UploadCloud className="h-5 w-5 mr-2" />
                <span>Upload</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={cn(isActive('/deal') && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Link to="/deal/recent">
                <FileText className="h-5 w-5 mr-2" />
                <span>Deal Workspace</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={cn(isActive('/compare') && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Link to="/compare">
                <BarChart2 className="h-5 w-5 mr-2" />
                <span>Compare</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={cn(isActive('/archive') && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Link to="/archive">
                <Archive className="h-5 w-5 mr-2" />
                <span>Archive</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-4 py-4">
        <Button asChild className="w-full">
          <Link to="/upload">
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>New Deal</span>
          </Link>
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
