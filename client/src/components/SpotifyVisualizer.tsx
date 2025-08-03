import { useState, useEffect } from "react";
import { Headphones, Music, Radio } from "lucide-react";

interface SpotifyVisualizerProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "circle" | "bar" | "wave";
}

export function SpotifyVisualizer({ 
  isPlaying = false, 
  size = "md", 
  variant = "circle" 
}: SpotifyVisualizerProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  if (variant === "circle") {
    return (
      <div className={`${sizeClasses[size]} relative`}>
        {/* Animated rings */}
        {isPlaying && (
          <>
            <div 
              className="absolute inset-0 rounded-full border-2 border-[#ff55e1] animate-ping"
              style={{ 
                animationDuration: '1.5s',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-2 border-[#ff55e1] animate-ping opacity-75"
              style={{ 
                animationDuration: '1.5s',
                animationDelay: '0.3s'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border border-[#ff55e1] animate-ping opacity-50"
              style={{ 
                animationDuration: '1.5s',
                animationDelay: '0.6s'
              }}
            />
          </>
        )}
        
        {/* Main button */}
        <div 
          className={`${sizeClasses[size]} rounded-full bg-[#ff55e1] flex items-center justify-center transition-all duration-200 relative z-10 ${
            isPlaying ? 'animate-pulse' : 'hover:bg-[#ff55e1]/90'
          }`}
        >
          <Headphones className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <div className="flex space-x-1 items-end">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-1 bg-[#ff55e1] rounded-full transition-all duration-150 ${
                isPlaying ? 'animate-bounce' : ''
              }`}
              style={{
                height: isPlaying 
                  ? `${12 + Math.sin((animationPhase + index) * Math.PI / 2) * 8}px`
                  : '8px',
                animationDelay: `${index * 100}ms`,
                animationDuration: '600ms'
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className={`${iconSizes[size]} text-[#ff55e1] opacity-70`} />
        </div>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Wave animation */}
        <div className="flex space-x-0.5 items-center">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="w-0.5 bg-[#ff55e1] rounded-full transition-all duration-200"
              style={{
                height: isPlaying 
                  ? `${6 + Math.sin((animationPhase + index) * Math.PI / 3) * 4}px`
                  : '3px',
                transform: isPlaying 
                  ? `scaleY(${1 + Math.sin((animationPhase + index) * Math.PI / 2) * 0.5})`
                  : 'scaleY(1)'
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Radio className={`${iconSizes[size]} text-[#ff55e1] opacity-60`} />
        </div>
      </div>
    );
  }

  return null;
}

// Hook for managing play state
export function useSpotifyPlayState() {
  const [playingEpisodes, setPlayingEpisodes] = useState<Set<string>>(new Set());

  const togglePlay = (episodeId: string) => {
    setPlayingEpisodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(episodeId)) {
        newSet.delete(episodeId);
      } else {
        // Only one episode can play at a time
        newSet.clear();
        newSet.add(episodeId);
      }
      return newSet;
    });
  };

  const stopAll = () => setPlayingEpisodes(new Set());

  const isPlaying = (episodeId: string) => playingEpisodes.has(episodeId);

  return { togglePlay, stopAll, isPlaying };
}