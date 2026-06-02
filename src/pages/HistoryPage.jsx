import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import VideoListItem from '../components/VideoListItem';
import VideoGridCard from '../components/VideoGridCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Search, History, AlertCircle } from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('nextube_history') || '[]'));
  }, []);

  const deleteEntry = (id) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('nextube_history', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (window.confirm('Clear your entire watch history?')) {
      setHistory([]);
      localStorage.removeItem('nextube_history');
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channelTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toVideo = (item) => ({
    ...item,
    videoId: item.id,
    views: item.views || 0,
    publishedAt: item.watchedAt,
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#f97316] mb-1">
                <History size={22} />
                <span className="text-xs font-semibold uppercase tracking-wider">Watch history</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Recently watched</h1>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearAllHistory}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 rounded-full px-4 py-2 w-fit"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="relative max-w-md w-full bg-[#1a1a1a] border border-white/[0.08] px-4 py-2.5 rounded-full flex items-center gap-3">
              <Search size={18} className="text-[#8e8e93] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history…"
                className="bg-transparent border-none outline-none text-sm flex-1 text-white placeholder:text-[#8e8e93]"
              />
            </div>
          )}

          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            <AnimatePresence>
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={`${item.id}_${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative group"
                >
                  <VideoGridCard video={toVideo(item)} onClick={() => navigate(`/watch/${item.id}`)} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntry(item.id);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove from history"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="md:hidden divide-y divide-white/[0.06]">
            {filteredHistory.map((item) => (
              <div key={item.id} className="relative">
                <VideoListItem video={toVideo(item)} onClick={() => navigate(`/watch/${item.id}`)} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEntry(item.id);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#8e8e93]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-12 text-center max-w-md mx-auto">
              <AlertCircle size={36} className="text-[#f97316] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nothing here yet</h3>
              <p className="text-sm text-[#8e8e93] mb-6">
                {searchQuery ? 'No matches for your search.' : 'Videos you watch will appear in this list.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-[#f97316] text-white px-6 py-2.5 rounded-full text-sm font-semibold"
                >
                  Browse home
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HistoryPage;
