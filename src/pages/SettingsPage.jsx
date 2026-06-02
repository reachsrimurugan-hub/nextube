import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import { useLanguage, languages } from '../context/LanguageContext';
import { Settings, Sliders, Eye, Zap } from 'lucide-react';

const cardClass =
  'bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [settings, setSettings] = useState({
    autoPlay: true,
    subtitlesEnabled: false,
    defaultQuality: '1080p',
    cinemaGrain: true,
    mouseGlow: true,
    glowIntensity: 'medium',
    hardwareAcceleration: true,
    dataSaver: false
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nextube_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = (updated) => {
    setSettings(updated);
    localStorage.setItem('nextube_settings', JSON.stringify(updated));
  };

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
  };

  const handleSelectChange = (key, val) => {
    const updated = { ...settings, [key]: val };
    saveSettings(updated);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-24 lg:pb-10">
      <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#f97316]">
              <Settings size={24} className="animate-[spin_6s_linear_infinite]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93]">
                Control panel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              System settings
            </h1>
            <div className="h-1 w-20 bg-[#f97316] rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
              <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider px-1">
                On this page
              </p>
              <div className={`${cardClass} !space-y-2 !p-4`}>
                <a
                  href="#playback"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#f97316]/15 text-[#f97316] font-medium border border-white/[0.06] text-sm transition-colors"
                >
                  <Sliders size={16} />
                  Playback
                </a>
                <a
                  href="#appearance"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] text-[#8e8e93] hover:text-white border border-transparent text-sm transition-colors"
                >
                  <Eye size={16} />
                  Atmosphere &amp; UI
                </a>
                <a
                  href="#performance"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] text-[#8e8e93] hover:text-white border border-transparent text-sm transition-colors"
                >
                  <Zap size={16} />
                  Performance
                </a>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
            {/* Playback Settings */}
            <section id="playback" className={cardClass}>
              <div className="flex items-center gap-3 text-orange-500 mb-2">
                <Sliders size={20} />
                <h3 className="font-bold text-lg text-white">Playback Configuration</h3>
              </div>
              <div className="h-px bg-white/5" />

              {/* Autoplay toggling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Auto-Play Videos</p>
                  <p className="text-xs text-white/40 leading-relaxed">Stream next recommendation automatically when video ends.</p>
                </div>
                <button 
                  onClick={() => handleToggle('autoPlay')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.autoPlay ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Subtitles toggling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Closed Captions (CC)</p>
                  <p className="text-xs text-white/40 leading-relaxed">Show translations and subtitles on video stream if available.</p>
                </div>
                <button 
                  onClick={() => handleToggle('subtitlesEnabled')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.subtitlesEnabled ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Quality Settings Selection */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Default Resolution</p>
                  <p className="text-xs text-white/40 leading-relaxed">Set preferred video streaming quality when loading players.</p>
                </div>
                <select 
                  value={settings.defaultQuality}
                  onChange={(e) => handleSelectChange('defaultQuality', e.target.value)}
                  className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-orange-500 cursor-pointer"
                >
                  {['Auto', '4K', '1080p', '720p', '480p'].map(q => (
                    <option key={q} value={q} className="bg-[#1a1a1a] text-white">{q}</option>
                  ))}
                </select>
              </div>

              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Application Language</p>
                  <p className="text-xs text-white/40 leading-relaxed">Select your default translation language for PlayVerse.</p>
                </div>
                <select 
                  value={selectedLanguage.code}
                  onChange={(e) => {
                    const matched = languages.find(l => l.code === e.target.value);
                    if (matched) setSelectedLanguage(matched);
                  }}
                  className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-orange-500 cursor-pointer"
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code} className="bg-[#1a1a1a] text-white">{l.name}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Atmosphere & UI Settings */}
            <section id="appearance" className={cardClass}>
              <div className="flex items-center gap-3 text-orange-500 mb-2">
                <Eye size={20} />
                <h3 className="font-bold text-lg text-white">Atmosphere & Interface</h3>
              </div>
              <div className="h-px bg-white/5" />

              {/* Grain Overlay toggling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Cinematic Grain Overlay</p>
                  <p className="text-xs text-white/40 leading-relaxed">Enable aesthetic micro-grain motion filter over user interface.</p>
                </div>
                <button 
                  onClick={() => handleToggle('cinemaGrain')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.cinemaGrain ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Mouse Glow effect toggling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Interactive Mouse Follower</p>
                  <p className="text-xs text-white/40 leading-relaxed">Turn on the dynamic orange atmospheric light following mouse movement.</p>
                </div>
                <button 
                  onClick={() => handleToggle('mouseGlow')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.mouseGlow ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </section>

            {/* Performance Settings */}
            <section id="performance" className={cardClass}>
              <div className="flex items-center gap-3 text-orange-500 mb-2">
                <Zap size={20} />
                <h3 className="font-bold text-lg text-white">Performance Optimizations</h3>
              </div>
              <div className="h-px bg-white/5" />

              {/* GPU acceleration */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Hardware GPU Acceleration</p>
                  <p className="text-xs text-white/40 leading-relaxed">Utilize local device hardware acceleration for smoother Framer animations.</p>
                </div>
                <button 
                  onClick={() => handleToggle('hardwareAcceleration')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.hardwareAcceleration ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Data Saver Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Bandwidth Data Saver</p>
                  <p className="text-xs text-white/40 leading-relaxed">Optimize buffer speeds and set player qualities to lower resolutions automatically.</p>
                </div>
                <button 
                  onClick={() => handleToggle('dataSaver')}
                  className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${settings.dataSaver ? 'bg-orange-500 justify-end shadow-md shadow-orange-500/20' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
