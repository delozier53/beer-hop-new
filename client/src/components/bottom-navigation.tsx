import { Link, useLocation } from "wouter";
import { User, Beer, Headphones, Calendar } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 px-6 py-3 z-50">
      <div className="flex justify-around">
        <Link href="/">
          <button className={`flex flex-col items-center space-y-1 p-2 ${
            isActive('/') ? 'text-hops' : 'text-gray-600'
          }`}>
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </Link>
        
        <Link href="/breweries">
          <button className={`flex flex-col items-center space-y-1 p-2 ${
            isActive('/breweries') ? 'text-hops' : 'text-gray-600'
          }`}>
            <Beer className="w-5 h-5" />
            <span className="text-xs">Breweries</span>
          </button>
        </Link>
        
        <Link href="/podcast">
          <button className={`flex flex-col items-center space-y-1 p-2 ${
            isActive('/podcast') ? 'text-hops' : 'text-gray-600'
          }`}>
            <Headphones className="w-5 h-5" />
            <span className="text-xs">Podcast</span>
          </button>
        </Link>
        
        <Link href="/events">
          <button className={`flex flex-col items-center space-y-1 p-2 ${
            isActive('/events') ? 'text-hops' : 'text-gray-600'
          }`}>
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Events</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
