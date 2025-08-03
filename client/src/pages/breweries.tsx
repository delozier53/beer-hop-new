import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "@/hooks/use-location";
import type { Brewery } from "@shared/schema";

interface BreweryWithDistance extends Brewery {
  distance?: number;
}

export default function Breweries() {
  const [searchTerm, setSearchTerm] = useState("");
  const { latitude, longitude } = useLocation();

  const { data: breweries = [], isLoading } = useQuery<BreweryWithDistance[]>({
    queryKey: ["/api/breweries", { lat: latitude, lng: longitude }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (latitude && longitude) {
        params.append('lat', latitude.toString());
        params.append('lng', longitude.toString());
      }
      
      const response = await fetch(`/api/breweries?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch breweries');
      }
      return response.json();
    }
  });

  const filteredBreweries = breweries.filter(brewery =>
    brewery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brewery.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brewery.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex text-amber text-xs">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${
              i < fullStars ? 'fill-current' : 
              i === fullStars && hasHalfStar ? 'fill-current opacity-50' : 
              'opacity-30'
            }`} 
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Nearby Breweries</h1>
            <div className="relative">
              <Input placeholder="Search breweries..." className="pl-10" />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex">
                <div className="w-24 h-24 bg-gray-300"></div>
                <div className="flex-1 p-4 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nearby Breweries</h1>
          
          {/* Search Box */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search breweries..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Brewery List */}
      <div className="px-6 py-4 space-y-4">
        {filteredBreweries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No breweries found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          filteredBreweries.map((brewery) => (
            <Link key={brewery.id} href={`/brewery/${brewery.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex">
                  <img 
                    src={brewery.logo || `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
                    alt={brewery.name} 
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{brewery.name}</h3>
                    <p className="text-sm text-gray-600">
                      {brewery.city}, {brewery.state}
                    </p>
                    {brewery.distance && (
                      <div className="text-sm font-medium text-hops mt-1">
                        {brewery.distance} mi
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
