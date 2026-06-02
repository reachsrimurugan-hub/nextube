import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Compass,
  Film,
  Sparkles,
  Star,
  Rocket,
} from 'lucide-react';

const browseLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[#f97316]/15 text-[#f97316]'
      : 'text-[#8e8e93] hover:text-white hover:bg-white/[0.04]'
  }`;

const genreLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'text-[#f97316]' : 'text-[#8e8e93] hover:text-white'
  }`;

const BROWSE = [
  { label: 'Travel & Vlogs', to: '/category/TV Series', icon: Compass },
  { label: 'Movies', to: '/category/Movies', icon: Film },
  { label: 'Anime', to: '/category/Anime', icon: Sparkles },
  { label: 'Top Rated', to: '/category/Top Rated', icon: Star },
  { label: 'New Releases', to: '/category/New Releases', icon: Rocket },
];

const GENRES = [
  { label: 'Action', to: '/category/Action' },
  { label: 'Adventure', to: '/category/Adventure' },
  { label: 'Animation', to: '/category/Animation' },
  { label: 'Comedy', to: '/category/Comedy' },
  { label: 'Crime', to: '/category/Crime' },
  { label: 'Documentary', to: '/category/Documentary' },
  { label: 'Drama', to: '/category/Drama' },
  { label: 'Family', to: '/category/Family' },
];

const DesktopBrowseSidebar = () => {
  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-white/[0.08] bg-black min-h-[calc(100vh-4rem)] sticky top-16 self-start">
      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] hide-scrollbar">
        <div>
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">
            Browse
          </p>
          <nav className="space-y-0.5">
           
          </nav>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">
            Genres
          </p>
          <nav className="space-y-0.5">
            {GENRES.map(({ label, to }) => (
              <NavLink key={to} to={to} className={genreLinkClass}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default DesktopBrowseSidebar;
