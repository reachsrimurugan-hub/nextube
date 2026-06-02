import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  Tv, Eye, Sparkles, Sliders, ChevronDown, Check,
  RotateCcw, RotateCw, Subtitles, SkipForward, Info, Clock
} from 'lucide-react';

// Static options object outside of component render scope.
// This prevents react-youtube from detecting new opts references 
// and recreating/reloading the YouTube iframe when local state changes.
const YOUTUBE_PLAYER_OPTS = {
  height: '100%',
  width: '100%',
  playerVars: {
    autoplay: 1,
    controls: 0,
    modestbranding: 1,
    rel: 0,
    showinfo: 0,
    iv_load_policy: 3,
    enablejsapi: 1,
    disablekb: 1,
  }
};

const QUALITY_MAP = {
  'Auto': 'auto',
  '1080p': 'hd1080',
  '720p': 'hd720',
  '480p': 'large',
  '360p': 'medium',
  '240p': 'small',
  '144p': 'tiny'
};

const CinematicVideoPlayer = ({ 
  videoId, 
  title, 
  channelTitle = "PlayVerse", 
  onTheaterToggle,
  isSavedWatchLater = false,
  onWatchLaterToggle,
  onInfoClick
}) => {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Custom quality & speed controls
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState('main'); // 'main' | 'quality' | 'speed'
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [currentSpeed, setCurrentSpeed] = useState('1x');
  const [availableQualities, setAvailableQualities] = useState(['Auto', '1080p', '720p', '480p', '360p']);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showSeekFeedback, setShowSeekFeedback] = useState({ type: 'forward', visible: false });
  const [isQualitySwitching, setIsQualitySwitching] = useState(false);
  const [switchingToLabel, setSwitchingToLabel] = useState('');
  
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressRef = useRef(null);
  const lastTapRef = useRef(null);

  const handlePlayerTap = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTapRef.current && (now - lastTapRef.current.time < DOUBLE_TAP_DELAY)) {
      // It's a double tap!
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const width = rect.width;
      
      if (tapX < width / 2) {
        // Double tap on the LEFT: Seek backward 10s
        if (player) {
          const seekBack = Math.max(player.getCurrentTime() - 10, 0);
          player.seekTo(seekBack, true);
          setCurrentTime(seekBack);
          
          // Flash backward seek feedback bubble
          setShowSeekFeedback({ type: 'back', visible: true });
          setTimeout(() => setShowSeekFeedback({ type: 'back', visible: false }), 600);
        }
      } else {
        // Double tap on the RIGHT: Seek forward 10s
        if (player) {
          const seekForward = Math.min(player.getCurrentTime() + 10, duration);
          player.seekTo(seekForward, true);
          setCurrentTime(seekForward);
          
          // Flash forward seek feedback bubble
          setShowSeekFeedback({ type: 'forward', visible: true });
          setTimeout(() => setShowSeekFeedback({ type: 'forward', visible: false }), 600);
        }
      }
      lastTapRef.current = null;
    } else {
      // It's a single tap: Toggle controls overlay
      lastTapRef.current = { time: now };
      
      // Delay single-tap actions slightly to check if a second tap is incoming
      setTimeout(() => {
        if (lastTapRef.current && lastTapRef.current.time === now) {
          setShowControls((prev) => !prev);
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Auto-hide controls disabled
  const resetControlsTimeout = () => {};



  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Sync timeline interval when video is playing
  useEffect(() => {
    let interval;
    if (player && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 400);
    }
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent shortcut interference in input text fields
      if (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (!player) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          const rewindTime = Math.max(player.getCurrentTime() - 5, 0);
          player.seekTo(rewindTime, true);
          setCurrentTime(rewindTime);
          resetControlsTimeout();
          break;
        case 'arrowright':
          e.preventDefault();
          const forwardTime = Math.min(player.getCurrentTime() + 5, duration);
          player.seekTo(forwardTime, true);
          setCurrentTime(forwardTime);
          resetControlsTimeout();
          break;
        case 'arrowup':
          e.preventDefault();
          const volUp = Math.min(volume + 5, 100);
          setVolume(volUp);
          player.setVolume(volUp);
          if (isMuted && volUp > 0) {
            setIsMuted(false);
            player.unMute();
          }
          resetControlsTimeout();
          break;
        case 'arrowdown':
          e.preventDefault();
          const volDown = Math.max(volume - 5, 0);
          setVolume(volDown);
          player.setVolume(volDown);
          if (volDown === 0) {
            setIsMuted(true);
            player.mute();
          }
          resetControlsTimeout();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, isPlaying, isMuted, volume, duration]);

  // Player Handlers
  const handleReady = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    setDuration(ytPlayer.getDuration());
    setIsBuffering(false);
    
    // Set starting volume using YouTube Player API
    ytPlayer.setVolume(volume);
    
    if (isMuted) {
      ytPlayer.mute();
    } else {
      ytPlayer.unMute();
    }

    // Force trigger autoplay playback
    try {
      ytPlayer.playVideo();
    } catch (e) {
      console.warn("Autoplay was blocked or failed to initialize:", e);
    }

    // Populate dynamic quality settings if available
    try {
      const levels = ytPlayer.getAvailableQualityLevels();
      if (levels && levels.length > 0) {
        const qualityLabelsMap = {
          'auto': 'Auto',
          'hd1080': '1080p',
          'hd720': '720p',
          'large': '480p',
          'medium': '360p',
          'small': '240p',
          'tiny': '144p'
        };
        const mappedLevels = levels.map(l => qualityLabelsMap[l] || l).filter(Boolean);
        // Include 'Auto' at the front if not present
        if (!mappedLevels.includes('Auto')) mappedLevels.unshift('Auto');
        setAvailableQualities(mappedLevels);
      }
    } catch (e) {
      console.warn("Quality levels not loaded yet:", e);
    }
  };

  const handleStateChange = (event) => {
    const state = event.data;
    if (state === 1) {
      setIsPlaying(true);
      setIsBuffering(false);
    } else if (state === 2) {
      setIsPlaying(false);
    } else if (state === 3) {
      setIsBuffering(true);
    } else if (state === 0) {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    resetControlsTimeout();
  };

  // MUTE/UNMUTE IMPLEMENTATION (No reloads!)
  // Simply calls player.mute() or player.unMute() without altering component properties.
  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
    resetControlsTimeout();
  };

  const handleVolumeSliderChange = (e) => {
    if (!player) return;
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    player.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      player.unMute();
    } else if (newVol === 0 && !isMuted) {
      setIsMuted(true);
      player.mute();
    }
  };

  const handleProgressSeek = (e) => {
    if (!player || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(clickX / width, 1));
    const seekTime = percentage * duration;
    
    player.seekTo(seekTime, true);
    setCurrentTime(seekTime);
    resetControlsTimeout();
  };

  const getQualityFilter = (quality) => {
    switch (quality) {
      case '144p':
        return 'contrast(0.95) saturate(0.9) blur(1.8px)';
      case '240p':
        return 'contrast(0.98) saturate(0.95) blur(1.2px)';
      case '360p':
        return 'contrast(1) blur(0.6px)';
      case '480p':
        return 'contrast(1) blur(0.3px)';
      case '720p':
      case '1080p':
      case 'Auto':
      default:
        return 'none';
    }
  };

  // Dynamic Quality Switcher via API
  const handleQualitySelect = (qualityLabel) => {
    if (!player) return;
    
    // Trigger simulated quality buffering rebuilding sequence
    setIsQualitySwitching(true);
    setSwitchingToLabel(qualityLabel);
    
    const ytQualityValue = QUALITY_MAP[qualityLabel] || 'auto';
    player.setPlaybackQuality(ytQualityValue);
    
    setTimeout(() => {
      setCurrentQuality(qualityLabel);
      setIsQualitySwitching(false);
    }, 1200);

    setShowSettingsMenu(false);
    setSettingsTab('main');
    resetControlsTimeout();
  };

  // Speed Switcher
  const handleSpeedSelect = (speedLabel, speedValue) => {
    if (!player) return;
    player.setPlaybackRate(speedValue);
    setCurrentSpeed(speedLabel);
    setShowSettingsMenu(false);
    setSettingsTab('main');
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Fullscreen request failed", err);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimeout();
  };

  const toggleTheaterMode = () => {
    const updated = !isTheaterMode;
    setIsTheaterMode(updated);
    if (onTheaterToggle) onTheaterToggle(updated);
    resetControlsTimeout();
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video md:rounded-3xl overflow-hidden group bg-black"
    >
      {/* Background Iframe */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none scale-105 select-none transition-all duration-500"
        style={{ filter: getQualityFilter(currentQuality) }}
      >
        <YouTube
          videoId={videoId}
          opts={YOUTUBE_PLAYER_OPTS}
          onReady={handleReady}
          onStateChange={handleStateChange}
          className="w-full h-full"
          containerClassName="w-full h-full absolute inset-0"
        />
      </div>

      {/* Click-to-Play Area Overlay */}
      <div 
        onClick={handlePlayerTap}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {/* Pulsating Glassmorphic Center Play Button Overlay */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && !isQualitySwitching && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={togglePlay}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[1px] cursor-pointer"
          >
            <motion.div 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(249, 115, 22, 0.95)' }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-[#f97316]/90 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-all duration-300 animate-pulse"
            >
              <Play size={36} fill="white" className="ml-1.5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated double-tap seek feedback bubbles */}
      <AnimatePresence>
        {showSeekFeedback.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-1/2 -translate-y-1/2 z-40 bg-black/60 backdrop-blur-md px-6 py-4 rounded-full flex flex-col items-center justify-center gap-1 text-white border border-white/10 ${
              showSeekFeedback.type === 'back' ? 'left-[15%]' : 'right-[15%]'
            }`}
          >
            {showSeekFeedback.type === 'back' ? (
              <>
                <RotateCcw size={24} className="text-orange-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest font-mono">-10s</span>
              </>
            ) : (
              <>
                <RotateCw size={24} className="text-orange-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest font-mono">+10s</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buffering Indicator overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none"
          >
            <div className="relative w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Buffering Stream</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Switch buffering Overlay */}
      <AnimatePresence>
        {isQualitySwitching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-45 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[3px] pointer-events-none animate-fade-in"
          >
            <div className="relative w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
              Adjusting Stream Resolution to {switchingToLabel}
            </p>
            <span className="mt-1 text-[8px] text-white/40 uppercase tracking-widest font-mono">
              Rebuilding stream buffer
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Custom Controls panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-35 bg-gradient-to-t from-black/95 via-transparent to-black/60 flex flex-col justify-between p-4 sm:p-6 md:p-10 pointer-events-none"
          >
            {/* Top Row Info */}
            <div className="flex items-start justify-between w-full pointer-events-auto mt-2">
              <div className="hidden sm:flex items-center gap-4">
                {/* Channel/profile avatar badge */}
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-black text-lg overflow-hidden border border-white/20 shadow-2xl">
                  {channelTitle ? (
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${channelTitle}&backgroundColor=f97316`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'PV'
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-extrabold text-base md:text-xl tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase shadow-lg shadow-orange-500/30">
                      CINEMATIC PLAYER
                    </span>
                    <span className="text-white/60 text-[10px] font-extrabold tracking-wide uppercase font-mono drop-shadow">
                      {channelTitle || 'PlayVerse Stream'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal status indicator on mobile/tablet */}
              <div className="sm:hidden flex items-center gap-2">
                <span className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase font-mono">
                  PLAYING
                </span>
              </div>

              {/* Right Side Immersive Actions */}
              <div className="flex items-center gap-4 sm:gap-6 bg-black/25 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2 md:px-5 md:py-2.5">
                <button
                  onClick={onWatchLaterToggle}
                  className={`flex flex-col items-center gap-0.5 transition-colors group/btn cursor-pointer ${
                    isSavedWatchLater ? 'text-orange-500' : 'text-white/60 hover:text-orange-500'
                  }`}
                  title="Watch Later"
                >
                  <Clock size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-wider font-mono">Watch later</span>
                </button>
                <button
                  onClick={onInfoClick}
                  className="flex flex-col items-center gap-0.5 text-white/60 hover:text-orange-500 transition-colors group/btn cursor-pointer"
                  title="Video Info"
                >
                  <Info size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-wider font-mono">Info</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu);
                    setSettingsTab('main');
                  }}
                  className="flex flex-col items-center gap-0.5 text-white/60 hover:text-orange-500 transition-colors group/btn cursor-pointer"
                  title="More Options"
                >
                  <Sliders size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-wider font-mono">More</span>
                </button>
              </div>
            </div>

            {/* Bottom Controls Panel */}
            <div className="space-y-4 md:space-y-6 w-full pointer-events-auto mb-2">
              {/* Timeline Progress Bar */}
              <div 
                ref={progressRef}
                onClick={handleProgressSeek}
                className="relative group/progress h-1.5 w-full bg-white/10 rounded-full cursor-pointer transition-all hover:h-2"
              >
                <div 
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.8)] border-2 border-white scale-0 group-hover/progress:scale-100 transition-transform" />
                </div>
              </div>

              {/* Action Buttons panel */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Circular Orange Play/Pause Button */}
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                  </button>

                  {/* Skip Forward Button */}
                  <button
                    onClick={() => {
                      if (!player) return;
                      const forwardTime = Math.min(player.getCurrentTime() + 10, duration);
                      player.seekTo(forwardTime, true);
                      setCurrentTime(forwardTime);
                      resetControlsTimeout();
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"
                    title="Forward 10s"
                  >
                    <SkipForward size={16} />
                  </button>

                  {/* Volume Slider Widget - Desktop/Tablet Only */}
                  <div 
                    className="hidden sm:flex relative items-center gap-2"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div 
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 80, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="overflow-hidden flex items-center"
                        >
                          <input 
                            type="range" 
                            min="0" 
                            max="100"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeSliderChange}
                            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Simple Mute/Unmute Toggle Icon - Mobile Only */}
                  <button onClick={toggleMute} className="sm:hidden text-white/60 hover:text-white transition-colors cursor-pointer">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Timestamps */}
                  <div className="text-[10px] font-black text-white/50 tracking-widest font-mono select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span className="mx-1.5 text-white/20">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Quality & Speed Control (Settings Cog Menu) */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowSettingsMenu(!showSettingsMenu);
                        setSettingsTab('main');
                      }}
                      className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-orange-500 transition-colors cursor-pointer relative"
                      title="Playback Settings"
                    >
                      <Settings size={16} />
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[7px] px-1 rounded-sm scale-75">HD</span>
                    </button>

                    <AnimatePresence>
                      {showSettingsMenu && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="absolute bottom-full right-0 mb-3 w-48 glass-dark border border-white/10 rounded-2xl overflow-hidden py-2 shadow-2xl z-50 pointer-events-auto"
                        >
                          {settingsTab === 'main' && (
                            <div className="space-y-1">
                              <button 
                                onClick={() => setSettingsTab('quality')}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                              >
                                <span className="font-medium">Quality</span>
                                <span className="text-[10px] text-orange-500 font-bold">{currentQuality}</span>
                              </button>
                              <button 
                                onClick={() => setSettingsTab('speed')}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                              >
                                <span className="font-medium">Speed</span>
                                <span className="text-[10px] text-orange-500 font-bold">{currentSpeed}</span>
                              </button>
                            </div>
                          )}

                          {settingsTab === 'quality' && (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              <div className="px-4 py-1.5 text-[9px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
                                Video Quality
                              </div>
                              {availableQualities.map((q) => (
                                <button
                                  key={q}
                                  onClick={() => handleQualitySelect(q)}
                                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 text-left cursor-pointer"
                                >
                                  <span>{q}</span>
                                  {currentQuality === q && <Check size={12} className="text-orange-500" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {settingsTab === 'speed' && (
                            <div className="space-y-0.5">
                              <div className="px-4 py-1.5 text-[9px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
                                Playback Speed
                              </div>
                              {[
                                { label: '0.25x', val: 0.25 },
                                { label: '0.5x', val: 0.5 },
                                { label: '0.75x', val: 0.75 },
                                { label: 'Normal', val: 1 },
                                { label: '1.25x', val: 1.25 },
                                { label: '1.5x', val: 1.5 },
                                { label: '1.75x', val: 1.75 },
                                { label: '2x', val: 2 }
                              ].map((item) => (
                                <button
                                  key={item.label}
                                  onClick={() => handleSpeedSelect(item.label, item.val)}
                                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 text-left cursor-pointer"
                                >
                                  <span>{item.label}</span>
                                  {currentSpeed === item.label && <Check size={12} className="text-orange-500" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Theater Mode Toggle */}
                  <button 
                    onClick={toggleTheaterMode}
                    className={`hidden md:block p-2.5 rounded-xl transition-all cursor-pointer ${isTheaterMode ? 'bg-orange-500/25 text-orange-500 border border-orange-500/20' : 'glass text-white/60 hover:text-white hover:border-white/10'}`}
                    title="Theater Mode"
                  >
                    <Tv size={16} />
                  </button>

                  {/* Fullscreen Button */}
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 sm:p-2.5 glass rounded-xl text-white/60 hover:text-white transition-all cursor-pointer hover:border-white/10"
                    title="Fullscreen"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicVideoPlayer;
