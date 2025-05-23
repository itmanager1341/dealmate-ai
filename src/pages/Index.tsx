
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "@/lib/supabase";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      
      if (session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
}
