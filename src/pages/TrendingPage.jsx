import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import VideoGridCard from '../components/VideoGridCard';
import VideoListItem from '../components/VideoListItem';
import { getTrendingTrailers, searchVideos } from '../services/cinematicApi';
import { Flame } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TrendingPage = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const langName = selectedLanguage?.name || 'English';
        const results = await searchVideos(`${langName} Trending Music`);
        setTrendingVideos(results || []);
      } catch (error) {
        console.error('Failed to fetch trending videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
    window.scrollTo(0, 0);
  }, [selectedLanguage]);

  const handleVideoSelect = (video) => {
    navigate(`/watch/${video.videoId || video.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar
        onSearch={(q) => navigate(`/search/${q}`)}
        searchResults={trendingVideos.slice(0, 5)}
        onVideoSelect={handleVideoSelect}
      />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="text-[#f97316]" size={28} />
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Trending Now</h1>
          </div>
          <p className="text-sm text-[#8e8e93] mb-8 max-w-2xl">
            Popular videos gaining traction on PlayVerse right now.
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="aspect-video bg-[#1a1a1a] rounded-xl" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {trendingVideos.map((video, idx) => (
                  <VideoGridCard key={video.videoId || video.id || idx} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {trendingVideos.map((video, idx) => (
                  <VideoListItem key={video.videoId || video.id || idx} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
            </>
          )}

          {!loading && trendingVideos.length === 0 && (
            <p className="text-center py-20 text-[#8e8e93]">No trending videos available.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default TrendingPage;
