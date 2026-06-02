import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Flame, Search, Tv, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CinematicBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user } = useAuth();

  const hideOnPaths = ['/watch/', '/auth'];
  if (hideOnPaths.some((p) => currentPath.startsWith(p))) return null;

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Trending', icon: Flame, path: '/trending' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'My List', icon: Tv, path: '/library' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    if (path === '/search') return currentPath.startsWith('/search');
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] border-t border-white/[0.06] safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.path === '/profile' && !user) {
                  navigate('/auth');
                } else {
                  navigate(item.path);
                }
              }}
              className="flex flex-col items-center gap-1 min-w-[56px] py-1"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.75}
                className={active ? 'text-[#f97316]' : 'text-[#8e8e93]'}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-[#f97316]' : 'text-[#8e8e93]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CinematicBottomNav;
