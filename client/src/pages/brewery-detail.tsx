import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Facebook, Globe, Instagram } from "lucide-react";

import { openSmartLink } from "@/lib/linkHandler";

import type { Brewery } from "@shared/schema";

export default function BreweryDetail() {
  const params = useParams();
  const id = params.id;

  const { data: brewery, isLoading } = useQuery<Brewery>({
    queryKey: ["/api/breweries", id],
    queryFn: async () => {
      const response = await fetch(`/api/breweries/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch brewery');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-xl">
        Loading Brewery Info…
      </div>
    );
  }

  if (!brewery) {
    return (
      <div className="flex h-screen items-center justify-center text-xl">
        Brewery not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        {brewery.logo && (
          <img
            src={brewery.logo}
            alt={`${brewery.name} logo`}
            className="h-16 w-16 rounded-lg object-cover"
          />
        )}
        <h1 className="text-3xl font-semibold">{brewery.name}</h1>
      </header>

      {/* Address */}
      <section>
        <p className="leading-relaxed">
          {brewery.address}, {brewery.city}, {brewery.state} {brewery.zipCode}
        </p>
      </section>

      {/* Hours */}
      {brewery.hours && (
        <section>
          <h2 className="mb-1 text-lg font-medium">Hours</h2>
          <pre className="whitespace-pre-wrap rounded bg-gray-100 p-3">
            {brewery.hours}
          </pre>
        </section>
      )}

      {/* Social + Website */}
      <section className="flex flex-wrap items-center gap-4">
        {brewery.socialLinks.website && (
          <button
            onClick={() => openSmartLink(brewery.socialLinks.website!)}
            className="flex h-12 w-12 items-center justify-center
                       rounded-full bg-gray-800 text-white transition-colors
                       hover:bg-gray-900"
            aria-label="Visit website"
          >
            <Globe className="h-6 w-6" />
          </button>
        )}

        {brewery.socialLinks.facebook && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openSmartLink(brewery.socialLinks.facebook!);
            }}
            className="flex h-12 w-12 items-center justify-center
                       rounded-full bg-blue-600 text-white transition-colors
                       hover:bg-blue-700"
            aria-label="Open Facebook"
          >
            <Facebook className="h-6 w-6" />
          </button>
        )}

        {brewery.socialLinks.instagram && (
          <button
            onClick={() => openSmartLink(brewery.socialLinks.instagram!)}
            className="flex h-12 w-12 items-center justify-center
                       rounded-full bg-gradient-to-tr from-pink-600
                       via-red-500 to-yellow-500 text-white transition
                       hover:opacity-90"
            aria-label="Open Instagram"
          >
            <Instagram className="h-6 w-6" />
          </button>
        )}
      </section>

      {/* Podcast Episode */}
      {brewery.podcastUrl && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Latest Podcast Episode</h2>
          <button
            onClick={() => openSmartLink(brewery.podcastUrl!)}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white
                       transition-colors hover:bg-green-700"
          >
            Listen on Spotify
          </button>
        </section>
      )}

      {/* Back link */}
      <footer className="pt-8">
        <Link
          to="/breweries"
          className="text-sm font-medium text-blue-600 underline-offset-2
                     hover:underline"
        >
          ← Back to Breweries
        </Link>
      </footer>
    </div>
  );
}
