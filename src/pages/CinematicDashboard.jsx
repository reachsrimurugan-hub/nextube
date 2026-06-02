import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import CinematicHero from '../components/CinematicHero';
import VideoListItem from '../components/VideoListItem';
import VideoGridCard from '../components/VideoGridCard';
import { getPopularMovies, searchVideos } from '../services/cinematicApi';
import { LayoutGrid, Film, Compass, Play, Mic, Trophy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DASHBOARD_CATEGORIES = [
  { name: 'All', icon: LayoutGrid, term: 'All' },
  { name: 'Movie Trailers', icon: Film, term: 'Movie Trailers' },
  { name: 'Vlog & Travel', icon: Compass, term: 'Vlog & Travel' },
  { name: 'Podcasts', icon: Mic, term: 'Podcasts' },
  { name: 'Sports', icon: Trophy, term: 'Sports' },
];

const CinematicDashboard = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const [heroVideo, setHeroVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [trailerVideos, setTrailerVideos] = useState([]);
  const [travelVideos, setTravelVideos] = useState([]);
  const [podcastVideos, setPodcastVideos] = useState([]);
  const [sportsVideos, setSportsVideos] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('nextube_history') || '[]');
    setContinueWatching(history.slice(0, 8));
  }, []);

  const fetchDashboardContent = useCallback(
    async (category = 'All', searchVal = '', lang = selectedLanguage) => {
      setLoading(true);
      setVisibleCount(20);
      try {
        let results = [];
        const langName = lang?.name || 'English';
        const languagePrefix = `${langName} `;

        // 1. Fetch hero video: latest movie trailer in the selected language
        try {
          const heroResults = await searchVideos(`${languagePrefix}latest movie trailer`);
          if (heroResults && heroResults.length > 0) {
            setHeroVideo(heroResults[0]);
          }
        } catch (heroError) {
          console.error('Failed to fetch hero video:', heroError.message);
        }

        // 2. Fetch grid results
        if (searchVal) {
          results = await searchVideos(`${languagePrefix}${searchVal}`);
        } else if (category === 'All') {
          // Fetch Movie Trailers and Vlog/Travel content specifically
          try {
            const trailersRes = await searchVideos(`${languagePrefix}movie trailer`);
            setTrailerVideos(trailersRes || []);
          } catch (err) {
            console.error('Failed to fetch movie trailers', err);
          }
          try {
            const travelRes = await searchVideos(`${languagePrefix}travel vlog`);
            setTravelVideos(travelRes || []);
          } catch (err) {
            console.error('Failed to fetch travel vlogs', err);
          }
          try {
            const podcastRes = await searchVideos(`${languagePrefix}podcast`);
            setPodcastVideos(podcastRes || []);
          } catch (err) {
            console.error('Failed to fetch podcasts', err);
          }
          try {
            const sportsRes = await searchVideos(`${languagePrefix}sports`);
            setSportsVideos(sportsRes || []);
          } catch (err) {
            console.error('Failed to fetch sports videos', err);
          }
          results = []; // No general feed needed if showing Movie Trailers & Travel Vlogs
        } else {
          results = await searchVideos(`${languagePrefix}${category}`);
        }
        setAllVideos(results || []);
      } catch (error) {
        console.error('Failed to fetch dashboard content', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedLanguage]
  );

  useEffect(() => {
    fetchDashboardContent(activeCategory, searchQuery, selectedLanguage);
  }, [selectedLanguage, activeCategory, searchQuery, fetchDashboardContent]);

  const displayedVideos = useMemo(() => allVideos.slice(0, visibleCount), [allVideos, visibleCount]);

  const heroId = heroVideo ? heroVideo.videoId || heroVideo.id : null;

  const movieRow = useMemo(() => {
    return trailerVideos.filter((v) => (v.videoId || v.id) !== heroId);
  }, [trailerVideos, heroId]);

  const travelRow = useMemo(() => {
    return travelVideos.filter((v) => (v.videoId || v.id) !== heroId);
  }, [travelVideos, heroId]);

  const podcastRow = useMemo(() => {
    return podcastVideos.filter((v) => (v.videoId || v.id) !== heroId);
  }, [podcastVideos, heroId]);

  const sportsRow = useMemo(() => {
    return sportsVideos.filter((v) => (v.videoId || v.id) !== heroId);
  }, [sportsVideos, heroId]);

  const handleVideoSelect = useCallback(
    (video) => {
      navigate(`/watch/${video.videoId || video.id}`);
    },
    [navigate]
  );

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    setSearchQuery('');
    fetchDashboardContent(category, '');
  };

  const showWebRows =
    !searchQuery && activeCategory === 'All' && !loading && (movieRow.length > 0 || travelRow.length > 0 || podcastRow.length > 0 || sportsRow.length > 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-10">
      <CinematicNavbar
        onSearch={(q) => navigate(`/search/${q}`)}
        searchResults={searchQuery ? allVideos.slice(0, 5) : []}
        onVideoSelect={handleVideoSelect}
      />

      <main className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 pt-[3.75rem] lg:pt-20 space-y-8 lg:space-y-12">
        {!searchQuery && activeCategory === 'All' && heroVideo && (
          <CinematicHero video={heroVideo} onPlay={handleVideoSelect} />
        )}

        <section className="lg:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Stream Categories</h2>
            <Link to="/categories" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
            {DASHBOARD_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.term;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.term)}
                  className={`flex-shrink-0 w-[88px] h-[88px] rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
                    active
                      ? 'border-[#f97316] bg-[#f97316]/10 text-[#f97316]'
                      : 'border-white/10 bg-[#1a1a1a] text-white/70'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                  <span className="text-[11px] font-semibold">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Browse for more videos</h2>
            <Link to="/category/All" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
              View all videos
            </Link>
          </div>
        </section>

        {showWebRows && (
          <>
            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-white">Movie Trailers</h2>
                <Link to="/category/Movie Trailers" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
                  View all
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {movieRow.slice(0, 5).map((video, idx) => (
                  <VideoGridCard key={video.videoId || video.id || idx} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {movieRow.slice(0, 5).map((video, idx) => (
                  <VideoListItem
                    key={video.videoId || video.id || idx}
                    video={video}
                    onClick={handleVideoSelect}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-white">Vlogs & Travel</h2>
                <Link to="/category/Vlog & Travel" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
                  View all
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {travelRow.slice(0, 5).map((video, idx) => (
                  <VideoGridCard key={video.videoId || video.id || `travel-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {travelRow.slice(0, 5).map((video, idx) => (
                  <VideoListItem key={video.videoId || video.id || `travel-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-white">Podcasts</h2>
                <Link to="/category/Podcasts" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
                  View all
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {podcastRow.slice(0, 5).map((video, idx) => (
                  <VideoGridCard key={video.videoId || video.id || `podcast-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {podcastRow.slice(0, 5).map((video, idx) => (
                  <VideoListItem key={video.videoId || video.id || `podcast-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-white">Sports</h2>
                <Link to="/category/Sports" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
                  View all
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {sportsRow.slice(0, 5).map((video, idx) => (
                  <VideoGridCard key={video.videoId || video.id || `sports-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
              <div className="md:hidden divide-y divide-white/[0.06]">
                {sportsRow.slice(0, 5).map((video, idx) => (
                  <VideoListItem key={video.videoId || video.id || `sports-${idx}`} video={video} onClick={handleVideoSelect} />
                ))}
              </div>
            </section>
          </>
        )}

        {(!showWebRows || searchQuery || activeCategory !== 'All') && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base lg:text-xl font-bold text-white">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : activeCategory === 'All'
                    ? 'Featured'
                    : `${activeCategory} Streams`}
              </h2>
              {!loading && allVideos.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 12)}
                  className="text-sm font-semibold text-[#f97316]"
                >
                  Load more
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="aspect-video bg-[#1a1a1a] rounded-xl" />
                    <div className="h-3 bg-[#1a1a1a] rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {displayedVideos.map((video, idx) => (
                    <VideoGridCard key={video.videoId || video.id || idx} video={video} onClick={handleVideoSelect} />
                  ))}
                </div>
                <div className="md:hidden divide-y divide-white/[0.06]">
                  {displayedVideos.map((video, idx) => (
                    <VideoListItem
                      key={video.videoId || video.id || idx}
                      video={video}
                      onClick={handleVideoSelect}
                      showTrailerBadge={idx === 1}
                    />
                  ))}
                </div>
              </>
            )}

            {!loading && displayedVideos.length === 0 && (
              <p className="text-center py-16 text-[#8e8e93] text-sm">No videos found.</p>
            )}
          </section>
        )}

        {!searchQuery && activeCategory === 'All' && continueWatching.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-xl font-bold text-white">Continue Watching</h2>
              <Link to="/history" className="text-sm font-semibold text-[#f97316] hover:text-orange-400">
                View all
              </Link>
            </div>
            <div className="flex gap-3 lg:gap-4 overflow-x-auto hide-scrollbar pb-1">
              {continueWatching.map((item, idx) => {
                const progress = [72, 45, 30, 60, 20, 85, 50, 35][idx % 8];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/watch/${item.id}`)}
                    className="flex-shrink-0 w-[110px] sm:w-[130px] lg:w-[140px] text-left group"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1a] mb-2 ring-1 ring-white/[0.06]">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={28} className="text-white" fill="white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-[#f97316]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-white line-clamp-2 leading-snug">{item.title}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CinematicDashboard;
