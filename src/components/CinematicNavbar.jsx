import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Search, Home, Plus, Play, User, Settings, History, 
  Library, LogOut, LogIn, Menu, X,
  ChevronRight, Pencil, HelpCircle, Sparkles, Globe
} from 'lucide-react';
import debounce from 'lodash.debounce';
import { useLanguage, languages } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import playButtonImg from '../assets/play-button.png';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Categories', to: '/category/TV Series' },
  { label: 'Movies', to: '/category/Movies' },
  { label: 'Anime', to: '/category/Anime' },
];

const CinematicNavbar = ({ onSearch, searchResults = [], onVideoSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  
  const { user, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const profileRef = useRef(null);
  const languageRef = useRef(null);

  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [mobileLanguageExpanded, setMobileLanguageExpanded] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!user);
    if (user) {
      setUserProfile({
        username: user.displayName,
        email: user.email,
        avatar: user.photoURL
      });
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const navLinkClass = ({ isActive }) =>
    `text-xs font-semibold transition-colors border-b-2 pb-0.5 -mb-px whitespace-nowrap ${
      isActive
        ? 'text-white border-[#f97316]'
        : 'text-[#8e8e93] border-transparent hover:text-white'
    }`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move and scroll listener to show/hide navbar on other pages
  useEffect(() => {
    if (isHomepage) {
      setIsNavbarVisible(true);
      return;
    }

    // Default to hidden on other pages initially, or keep visible if at the very top of page
    setIsNavbarVisible(window.scrollY < 20);

    let lastScrollY = window.scrollY;
    let hideTimeout = null;

    const handleMouseMove = (e) => {
      // Clear any pending hide timeouts
      if (hideTimeout) clearTimeout(hideTimeout);

      // If mouse is near the top (within 70px)
      if (e.clientY <= 70) {
        setIsNavbarVisible(true);
      } else if (e.clientY > 130 && window.scrollY > 20) {
        // If they move cursor away, hide it after a short lag to prevent erratic flickering
        // But only if dropdowns are closed!
        if (!showProfileDropdown && !showLanguageDropdown && !showMobileDrawer && !showMobileSearch) {
          hideTimeout = setTimeout(() => {
            setIsNavbarVisible(false);
          }, 600);
        }
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If close to top, always show
      if (currentScrollY < 20) {
        setIsNavbarVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      // Detect scrolling direction
      if (currentScrollY < lastScrollY) {
        // Scrolling UP - show navbar
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY + 10) {
        // Scrolling DOWN - hide navbar (if dropdowns are closed)
        if (!showProfileDropdown && !showLanguageDropdown && !showMobileDrawer && !showMobileSearch) {
          setIsNavbarVisible(false);
        }
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isHomepage, showProfileDropdown, showLanguageDropdown, showMobileDrawer, showMobileSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    debounce((query) => {
      if (onSearch) onSearch(query);
    }, 500),
    [onSearch]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
    setShowResults(query.length > 0);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowResults(false);
      navigate(`/search/${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setShowProfileDropdown(false);
    navigate('/auth');
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-10 lg:px-12 xl:px-16 py-2 md:py-2.5 ${
          !isHomepage || isScrolled || showMobileDrawer
            ? 'bg-black/90 backdrop-blur-lg border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.9)]'
            : 'bg-black md:bg-transparent'
        }`}
        style={{
          transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <div className="max-w-[1800px] mx-auto">
          <AnimatePresence mode="wait">
            {showMobileSearch ? (
              <motion.div 
                key="mobile-search-bar"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex items-center gap-3"
              >
                <div className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3 focus-within:border-orange-500/40 transition-all">
                  <Search size={18} className="text-white/30" />
                  <input 
                    type="text" 
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setShowMobileSearch(false);
                        setShowResults(false);
                        navigate(`/search/${searchQuery}`);
                      }
                    }}
                    placeholder="Search titles, creators..." 
                    className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-white/20 font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setShowResults(false);
                      }} 
                      className="text-white/30 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setShowMobileSearch(false);
                    setShowResults(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="standard-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 lg:gap-5 w-full min-h-[38px]"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <img 
                      src={playButtonImg} 
                      alt="PlayVerse" 
                      className="w-8 h-8 object-contain rounded-full flex-shrink-0"
                    />
                    <span className="text-base font-bold tracking-tight text-white hidden sm:inline">PlayVerse</span>
                  </Link>
                </div>

                <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0 overflow-x-auto hide-scrollbar max-w-[min(42vw,28rem)] border-b border-transparent">
                  {NAV_LINKS.map(({ label, to }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={navLinkClass}
                    >
                      {label}
                    </NavLink>
                  ))}
                </nav>

                {/* Desktop search — icon on right */}
                <div className="hidden lg:flex flex-1 min-w-0 justify-center xl:justify-start max-w-lg xl:max-w-xl relative">
                  <div className="w-full bg-[#121212] border border-white/[0.06] rounded-full pl-4 pr-2.5 py-1.5 flex items-center gap-2 focus-within:border-[#f97316]/50 transition-colors">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => setShowResults(searchQuery.length > 0)}
                      placeholder="Search for movies, shows and more..."
                      className="bg-transparent border-none outline-none text-xs flex-1 min-w-0 text-white placeholder:text-[#8e8e93]/80"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          setShowResults(false);
                          navigate(`/search/${searchQuery}`);
                        }
                      }}
                      className="p-1.5 text-[#8e8e93] hover:text-white rounded-full hover:bg-white/5 shrink-0"
                      aria-label="Search"
                    >
                      <Search size={16} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-[#141414] p-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto z-50"
                      >
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 px-2">Matches Found</p>
                          {searchResults.map((video) => (
                            <div
                              key={video.videoId || video.id}
                              onClick={() => {
                                if (onVideoSelect) onVideoSelect(video);
                                else navigate(`/watch/${video.videoId || video.id}`);
                                setShowResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all"
                            >
                              <div className="w-20 aspect-video rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-500 transition-colors">{video.title}</h4>
                                <p className="text-[10px] font-bold text-white/30 uppercase mt-0.5">{video.channelTitle}</p>
                              </div>
                              <Play size={16} className="ml-auto text-white/0 group-hover:text-orange-500 transition-all translate-x-2 group-hover:translate-x-0" />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: bell + profile / mobile controls */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                  <button 
                    type="button"
                    onClick={() => setShowMobileSearch(true)}
                    className="lg:hidden p-2 text-white hover:text-[#f97316] transition-colors"
                    aria-label="Search"
                  >
                    <Search size={22} />
                  </button>

                  {/* Language Selector Button */}
                  <div className="relative" ref={languageRef}>
                    <button
                      type="button"
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className="relative p-1.5 rounded-lg sm:p-2 text-[#8e8e93] hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1 cursor-pointer"
                      aria-label="Select Language"
                    >
                      <Globe size={16} className="shrink-0" />
                      <span className="text-xs font-semibold sm:inline hidden">{selectedLanguage?.name || 'English'}</span>
                      <span className="text-xs font-semibold inline sm:hidden">{selectedLanguage?.code.toUpperCase() || 'EN'}</span>
                    </button>

                    <AnimatePresence>
                      {showLanguageDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="absolute top-full right-0 mt-3 w-40 glass-dark border border-white/10 rounded-2xl shadow-3xl overflow-hidden py-2 z-50 max-h-[300px] overflow-y-auto scrollbar-thin"
                        >
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-1.5">Languages</p>
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setSelectedLanguage(lang);
                                setShowLanguageDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all text-left ${
                                selectedLanguage?.code === lang.code
                                  ? 'text-[#f97316] bg-white/5'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {lang.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hamburger menu button in the right for mobile/tablet */}
                  <button 
                    type="button"
                    onClick={() => setShowMobileDrawer(true)}
                    className="lg:hidden p-2 text-white hover:text-[#f97316] transition-colors"
                    aria-label="Menu"
                  >
                    <Menu size={20} />
                  </button>

                  {/* Profile Menu dropdown widget */}
                  <div className="hidden lg:block relative" ref={profileRef}>
                    <div 
                      onClick={() => {
                        if (isLoggedIn) {
                          setShowProfileDropdown(!showProfileDropdown);
                        } else {
                          navigate('/auth');
                        }
                      }}
                      className="flex items-center gap-2 bg-[#121212] border border-white/[0.06] p-1 pr-3 rounded-xl cursor-pointer group hover:border-[#f97316]/30 transition-all active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        <img 
                          src={isLoggedIn && userProfile ? userProfile.avatar : "src/assets/man1.png"} 
                          alt="User" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-[8px] font-bold text-[#8e8e93] uppercase tracking-wider">{isLoggedIn ? 'Premium' : 'Guest'}</p>
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs font-semibold text-white truncate max-w-[80px]">
                            {isLoggedIn && userProfile ? userProfile.username : 'Sign In'}
                          </span>
                          <ChevronDown size={10} className="text-[#8e8e93] group-hover:text-[#f97316] transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Profile Dropdown box */}
                    <AnimatePresence>
                      {showProfileDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="absolute top-full right-0 mt-3 w-56 glass-dark border border-white/10 rounded-2xl shadow-3xl overflow-hidden py-2"
                        >
                          {isLoggedIn ? (
                            <>
                              <Link 
                                to="/profile" 
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <User size={16} className="text-orange-500" /> My Profile
                              </Link>
                              <Link 
                                to="/library" 
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Library size={16} className="text-orange-500" /> My Library
                              </Link>
                              <Link 
                                to="/history" 
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <History size={16} className="text-orange-500" /> Streaming Logs
                              </Link>
                              <Link 
                                to="/settings" 
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Settings size={16} className="text-orange-500" /> Settings
                              </Link>
                              <div className="h-px bg-white/5 my-1" />
                              <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all text-left"
                              >
                                <LogOut size={16} /> Disconnect
                              </button>
                            </>
                          ) : (
                            <Link 
                              to="/auth" 
                              onClick={() => setShowProfileDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-orange-500 hover:bg-white/5 transition-all"
                            >
                              <LogIn size={16} /> Connect Account
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Slide-out Mobile overlay Sidebar Drawer */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-[200] flex">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDrawer(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Drawer list matching the MENU Mockup */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[min(320px,82vw)] min-h-screen bg-black border-r border-white/[0.06] flex flex-col p-5 z-10 text-left"
            >
              {/* Profile Card Header exactly like MENU mockup */}
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div className="flex items-center gap-3">
                  {/* Rounded avatar PV */}
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-500/20">
                    {isLoggedIn && userProfile ? userProfile.username.slice(0, 2).toUpperCase() : 'PV'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      {isLoggedIn && userProfile ? userProfile.username : 'Guest'}
                    </h3>
                    <Link 
                      to={isLoggedIn ? "/profile" : "/auth"}
                      onClick={() => setShowMobileDrawer(false)}
                      className="text-[10px] font-black text-orange-500 uppercase tracking-widest block hover:text-white transition-colors"
                    >
                      {isLoggedIn ? 'View Profile' : 'Connect Account'}
                    </Link>
                  </div>
                </div>

              </div>

              {/* Drawer navigation */}
              <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
                {[
                  { label: 'Home', icon: <Home size={18} />, path: '/' },
                  { label: 'Trending', icon: <Sparkles size={18} />, path: '/trending' },
                  { label: 'Categories', icon: <Library size={18} />, path: '/categories' },
                  { label: 'My List', icon: <Plus size={18} />, path: '/library' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowMobileDrawer(false);
                      if (item.path !== '#') navigate(item.path);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all cursor-pointer group text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3 text-white/50 group-hover:text-orange-500 transition-colors">
                      {item.icon}
                      <span className="text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-colors" />
                  </button>
                ))}

                <hr className="border-white/[0.08] my-3" />

                {[
                  { label: 'History', icon: <History size={18} />, path: '/history' },
                  { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
                  { label: 'Help & Support', icon: <HelpCircle size={18} />, path: '#' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowMobileDrawer(false);
                      if (item.path !== '#') navigate(item.path);
                    }}
                    className="w-full flex items-center justify-between px-3 py-3.5 text-[#8e8e93] hover:text-white transition-colors text-sm"
                  >
                    <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                    <ChevronRight size={16} className="opacity-40" />
                  </button>
                ))}

                {/* Mobile Language Section */}
                <div className="border-t border-white/5 my-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileLanguageExpanded(!mobileLanguageExpanded)}
                    className="w-full flex items-center justify-between px-3 py-3 text-sm text-[#8e8e93] hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Globe size={18} className="text-[#f97316]" />
                      <span className="font-semibold">Language: {selectedLanguage?.name || 'English'}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${mobileLanguageExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {mobileLanguageExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-8 pr-2 space-y-1 overflow-hidden"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setMobileLanguageExpanded(false);
                              setShowMobileDrawer(false);
                            }}
                            className={`w-full flex items-center justify-between py-2.5 text-xs transition-all text-left ${
                              selectedLanguage?.code === lang.code
                                ? 'text-[#f97316] font-bold'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            <span>{lang.name}</span>
                            {selectedLanguage?.code === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <hr className="border-white/[0.08] my-3" />

                {isLoggedIn ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3.5 text-[#f97316] text-sm font-medium"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setShowMobileDrawer(false)}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-orange-500 hover:bg-white/5 transition-all text-left text-sm font-bold mt-4"
                  >
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CinematicNavbar;
