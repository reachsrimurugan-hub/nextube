import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import { searchVideos } from '../services/cinematicApi';
import VideoListItem from '../components/VideoListItem';
import VideoGridCard from '../components/VideoGridCard';
import { ChevronLeft, X, SlidersHorizontal, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const SearchResults = () => {
  const { searchTerm = '' } = useParams();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchTerm);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    setQuery(searchTerm);
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const langName = selectedLanguage?.name || 'English';
        const languagePrefix = `${langName} `;
        const results = await searchVideos(`${languagePrefix}${searchTerm}`);
        setVideos(results || []);
      } catch (error) {
        console.error('Failed to fetch videos', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (searchTerm) fetchResults();
  }, [searchTerm, selectedLanguage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search/${query.trim()}`);
  };

  const handleVideoSelect = (video) => {
    navigate(`/watch/${video.videoId || video.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar
        onSearch={(q) => navigate(`/search/${q}`)}
        searchResults={videos.slice(0, 5)}
        onVideoSelect={handleVideoSelect}
      />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-4 lg:py-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-white hover:bg-white/[0.06]"
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-xl">
              <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full px-4 py-2.5 border border-white/[0.06] focus-within:border-[#f97316]/50">
                <Search size={18} className="text-[#8e8e93] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for movies, shows and more..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#8e8e93]"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="text-[#8e8e93] p-1">
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            <button type="button" className="p-2 rounded-xl text-[#8e8e93] hover:text-white" aria-label="Filters">
              <SlidersHorizontal size={20} />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar border-b border-white/[0.08] mb-6">
            {['All', 'Videos', 'Channels', 'Playlists'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 relative shrink-0 transition-colors ${
                  activeTab === tab ? 'text-[#f97316]' : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="searchTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"
                  />
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-[#8e8e93]">Searching…</p>
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {videos.map((video) => (
                  <VideoGridCard key={video.videoId || video.id} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {videos.map((video) => (
                  <VideoListItem key={video.videoId || video.id} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
            </>
          )}

          {!isLoading && videos.length === 0 && (
            <p className="text-center py-20 text-[#8e8e93] text-sm">
              {searchTerm ? `No results for "${searchTerm}"` : 'Enter a search term from the bar above.'}
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;
