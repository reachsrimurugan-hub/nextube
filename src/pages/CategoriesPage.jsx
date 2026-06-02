import React from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import {
  Flame, Film, Compass, Sparkles, Music, Gamepad2, Newspaper, FileText,
} from 'lucide-react';

const CategoriesPage = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Trending', icon: Flame, color: 'text-orange-500', path: '/trending' },
    { name: 'Movies', icon: Film, color: 'text-sky-400', path: '/category/Movies' },
    { name: 'Travel & Vlogs', icon: Compass, color: 'text-emerald-400', path: '/category/TV Series' },
    { name: 'Anime', icon: Sparkles, color: 'text-purple-400', path: '/category/Anime' },
    { name: 'Music', icon: Music, color: 'text-yellow-400', path: '/category/Music' },
    { name: 'Gaming', icon: Gamepad2, color: 'text-blue-400', path: '/category/Gaming' },
    { name: 'News', icon: Newspaper, color: 'text-amber-500', path: '/category/News' },
    { name: 'Documentary', icon: FileText, color: 'text-green-400', path: '/category/Documentary' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          <header className="mb-8">
            <p className="text-[11px] font-bold text-[#f97316] uppercase tracking-[0.2em] mb-2">
              Categories
            </p>
            <h1 className="text-3xl font-bold text-white">Browse by category</h1>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => navigate(category.path)}
                  className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-3 hover:border-[#f97316]/40 hover:bg-[#222] transition-all min-h-[140px]"
                >
                  <Icon size={32} className={category.color} strokeWidth={1.75} />
                  <span className="text-sm font-semibold text-white">{category.name}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CategoriesPage;
