import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import VideoGridCard from '../components/VideoGridCard';
import { searchVideos, getPopularMovies } from '../services/cinematicApi';
import { useLanguage } from '../context/LanguageContext';

const FILTER_PILLS = [
  { label: 'Travel & Vlogs', to: '/category/TV Series' },
  { label: 'Movies', to: '/category/Movies' },
  { label: 'Anime', to: '/category/Anime' },
];

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const decoded = categoryName ? decodeURIComponent(categoryName) : '';

  const fetchCategoryVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      let results = [];
      const key = decoded || '';
      const langName = selectedLanguage?.name || 'English';
      const languagePrefix = `${langName} `;

      if (key === 'All' || !key) {
        // Fetch actual general popular videos across all categories from YouTube API
        if (langName === 'English') {
          results = await getPopularMovies();
        } else {
          results = await searchVideos(`${languagePrefix}popular videos`);
        }
      } else if (key === 'Top Rated') {
        results = await searchVideos(`${languagePrefix}top rated movies`);
      } else if (key === 'New Releases') {
        results = await searchVideos(`${languagePrefix}new movie trailers`);
      } else if (key === 'TV Series') {
        results = await searchVideos(`${languagePrefix}travel vlog`);
      } else {
        results = await searchVideos(`${languagePrefix}${key}`);
      }
      setVideos(results || []);
    } catch (error) {
      console.error(`Failed to fetch ${decoded} videos`, error);
    } finally {
      setIsLoading(false);
    }
  }, [decoded, selectedLanguage]);

  useEffect(() => {
    fetchCategoryVideos();
    window.scrollTo(0, 0);
  }, [fetchCategoryVideos]);

  const handleVideoSelect = (video) => {
    navigate(`/watch/${video.videoId || video.id}`);
  };

  const title = decoded === 'All' || !decoded
    ? 'All Videos'
    : decoded === 'TV Series'
      ? 'Travel & Vlogs'
      : decoded;

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar
        onSearch={(q) => navigate(`/search/${q}`)}
        searchResults={videos.slice(0, 5)}
        onVideoSelect={handleVideoSelect}
      />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">{title}</h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTER_PILLS.map((pill) => (
              <NavLink
                key={pill.to}
                to={pill.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#f97316] text-white'
                      : 'bg-[#1a1a1a] text-[#8e8e93] hover:text-white border border-white/[0.06]'
                  }`
                }
              >
                {pill.label}
              </NavLink>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="aspect-video bg-[#1a1a1a] rounded-xl" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-4/5" />
                  <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {videos.map((video, idx) => (
                <VideoGridCard key={video.videoId || video.id || idx} video={video} onClick={handleVideoSelect} />
              ))}
            </div>
          )}

          {!isLoading && videos.length === 0 && (
            <p className="text-center py-20 text-[#8e8e93]">No videos found for this category.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
