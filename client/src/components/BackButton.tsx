import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home page if no history
      setLocation('/');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-md hover:bg-white border border-gray-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Button>
  );
}