import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import CinematicVideoPlayer from '../components/CinematicVideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoDetails, getRelatedVideos } from '../services/cinematicApi';
import {
  ChevronLeft, Share2, Plus, ThumbsUp, Info, Sparkles,
  Heart, Bookmark, Clock, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToPlaylists, 
  createPlaylist, 
  addVideoToPlaylist, 
  removeVideoFromPlaylist, 
  addToRecentlyWatched 
} from '../services/playlistService';

const VideoDetails = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Interactive Stats & Subscriptions
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSavedWatchLater, setIsSavedWatchLater] = useState(false);
  const [isSavedFavorites, setIsSavedFavorites] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Firebase Auth & Playlist state
  const { user } = useAuth();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };



  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      try {
        const details = await getVideoDetails(videoId);
        if (details) {
          setVideo(details);
          setLikesCount(parseInt(details.likes) || 0);

          // Save video to history in LocalStorage
          const history = JSON.parse(localStorage.getItem('nextube_history') || '[]');
          const newEntry = {
            id: videoId,
            title: details.title,
            thumbnail: details.thumbnail,
            channelTitle: details.channelTitle,
            watchedAt: new Date().toISOString()
          };
          const filteredHistory = history.filter(item => item.id !== videoId);
          localStorage.setItem('nextube_history', JSON.stringify([newEntry, ...filteredHistory].slice(0, 50)));

          // Check if already saved in Watch Later / Favorites
          const watchLater = JSON.parse(localStorage.getItem('nextube_watch_later') || '[]');
          const favorites = JSON.parse(localStorage.getItem('nextube_favorites') || '[]');
          setIsSavedWatchLater(watchLater.some(v => v.id === videoId));
          setIsSavedFavorites(favorites.some(v => v.id === videoId));

          const related = await getRelatedVideos(videoId);
          setRelatedVideos(related || []);
        }
      } catch (error) {
        console.error("Failed to fetch video details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
    window.scrollTo(0, 0);
  }, [videoId]);

  // Sync history to Firestore when video is loaded
  useEffect(() => {
    if (user && video) {
      addToRecentlyWatched(user.uid, {
        id: videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle
      });
    }
  }, [user, video, videoId]);

  // Listen to user's playlists when modal is open
  useEffect(() => {
    if (!user || !showPlaylistModal) return;
    const unsubscribe = subscribeToPlaylists(user.uid, (data) => {
      setPlaylists(data);
    });
    return () => unsubscribe();
  }, [user, showPlaylistModal]);

  const handleVideoSelect = (newVideo) => {
    const id = newVideo.videoId || newVideo.id;
    navigate(`/watch/${id}`);
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
      triggerToast('Added to liked videos');
    }
  };

  const toggleWatchLater = () => {
    const watchLater = JSON.parse(localStorage.getItem('nextube_watch_later') || '[]');
    if (isSavedWatchLater) {
      const updated = watchLater.filter(v => v.id !== videoId);
      localStorage.setItem('nextube_watch_later', JSON.stringify(updated));
      setIsSavedWatchLater(false);
      triggerToast('Removed from Watch Later');
    } else {
      const newVideo = { id: videoId, title: video.title, thumbnail: video.thumbnail, channelTitle: video.channelTitle };
      localStorage.setItem('nextube_watch_later', JSON.stringify([...watchLater, newVideo]));
      setIsSavedWatchLater(true);
      triggerToast('Added to Watch Later');
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('nextube_favorites') || '[]');
    if (isSavedFavorites) {
      const updated = favorites.filter(v => v.id !== videoId);
      localStorage.setItem('nextube_favorites', JSON.stringify(updated));
      setIsSavedFavorites(false);
      triggerToast('Removed from Favorites');
    } else {
      const newVideo = { id: videoId, title: video.title, thumbnail: video.thumbnail, channelTitle: video.channelTitle };
      localStorage.setItem('nextube_favorites', JSON.stringify([...favorites, newVideo]));
      setIsSavedFavorites(true);
      triggerToast('Added to Favorites');
    }
  };

  const handleSubscribe = () => {
    const next = !isSubscribed;
    setIsSubscribed(next);
    triggerToast(next ? `Subscribed to ${video.channelTitle}` : `Unsubscribed from ${video.channelTitle}`);
  };


  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast('Link copied to clipboard!');
  };

  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  if (loading && !video) return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-6 z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
        />
        <p className="text-orange-500 font-bold tracking-[0.3em] uppercase text-[10px] animate-pulse">Initializing PlayVerse Stream</p>
      </div>
    </div>
  );

  if (!video && !loading) return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="glass-premium p-6 sm:p-12 rounded-2xl sm:rounded-[3rem] text-center max-w-md mx-4 relative z-10">
        <Info size={32} className="text-orange-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black mb-2">Content Unavailable</h2>
        <p className="text-white/40 text-sm mb-8">This video may have been removed or is restricted in your region.</p>
        <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-orange-500/25">
          Explore More Content
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden pb-10">
      <CinematicNavbar onVideoSelect={handleVideoSelect} />

      {/* Floating Notifications Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-10 z-[600] glass-dark px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-3 text-sm font-bold shadow-2xl"
          >
            <Check size={18} className="text-orange-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Overlay Panel */}
      <AnimatePresence>
        {showInfoOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="glass-premium max-w-2xl w-full rounded-[3.5rem] border border-white/10 p-8 md:p-10 relative overflow-hidden shadow-2xl text-left"
            >
              {/* Backglow */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/10 blur-[100px] rounded-full" />

              <button
                onClick={() => setShowInfoOverlay(false)}
                className="absolute top-8 right-8 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={20} className="rotate-180" />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-orange-500">
                  <Info size={24} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Stream Specifications</span>
                </div>

                <h2 className="text-2xl font-black tracking-tight leading-snug">{video.title}</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 font-mono">Publisher</p>
                    <p className="text-xs font-extrabold text-orange-500 truncate">{video.channelTitle}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 font-mono">Views</p>
                    <p className="text-xs font-extrabold text-white">{parseInt(video.views).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 font-mono">Published</p>
                    <p className="text-xs font-extrabold text-white">{new Date(video.publishedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40 font-mono">Description Summary</h4>
                  <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-xs text-white/60 leading-relaxed font-medium whitespace-pre-line">
                      {video.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-orange-500/10 px-5 py-4 rounded-2xl border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest font-mono">
                  <Sparkles size={16} className="flex-shrink-0" />
                  <span>Licensed PlayVerse stream authorization via YouTube API</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save to Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="glass-premium max-w-sm w-full rounded-[2.5rem] border border-white/10 p-6 relative overflow-hidden shadow-2xl text-left"
            >
              {/* Backglow */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/10 blur-[100px] rounded-full" />

              <h3 className="text-sm font-bold uppercase tracking-widest text-[#f97316] font-mono mb-4">Save Video to...</h3>

              {/* List of playlists with checkboxes */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {playlists.map((playlist) => {
                  const inPlaylist = playlist.videos?.some(v => v.videoId === videoId);
                  return (
                    <label key={playlist.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={inPlaylist || false}
                        onChange={async () => {
                          if (inPlaylist) {
                            await removeVideoFromPlaylist(playlist.id, videoId);
                            triggerToast(`Removed from ${playlist.title}`);
                          } else {
                            await addVideoToPlaylist(playlist.id, {
                              id: videoId,
                              title: video.title,
                              thumbnail: video.thumbnail,
                              duration: video.duration || ''
                            });
                            triggerToast(`Added to ${playlist.title}`);
                          }
                        }}
                        className="accent-[#f97316] rounded w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{playlist.title}</p>
                        <p className="text-[9px] text-[#8e8e93] truncate">{playlist.videos?.length || 0} videos</p>
                      </div>
                    </label>
                  );
                })}

                {playlists.length === 0 && (
                  <p className="text-xs text-white/40 italic py-4 text-center">No playlists created yet.</p>
                )}
              </div>

              {/* Create Playlist Inline Form */}
              {showCreateForm ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newPlaylistName.trim() || !user) return;
                  try {
                    const newId = await createPlaylist(user.uid, newPlaylistName, newPlaylistDesc);
                    await addVideoToPlaylist(newId, {
                      id: videoId,
                      title: video.title,
                      thumbnail: video.thumbnail,
                      duration: video.duration || ''
                    });
                    triggerToast(`Created & added to ${newPlaylistName}`);
                    setNewPlaylistName('');
                    setNewPlaylistDesc('');
                    setShowCreateForm(false);
                  } catch (err) {
                    console.error(err);
                  }
                }} className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">Name</label>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="e.g. Chill Music"
                      className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#f97316]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">Description</label>
                    <input
                      type="text"
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      placeholder="Optional details..."
                      className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#f97316]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 text-white/60 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#f97316] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 border border-dashed border-white/10 hover:border-white/20 rounded-2xl text-xs font-bold text-[#f97316] transition-all cursor-pointer"
                >
                  <Plus size={14} /> Create Playlist
                </button>
              )}

              <div className="mt-6 flex justify-end border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setShowCreateForm(false);
                  }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/80 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Watch Page Layout with dynamic animated top padding */}
      <div className="w-full flex flex-col pt-[3.75rem] lg:pt-16">

        {/* Back navigation header */}
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-orange-500 transition-colors group cursor-pointer"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest font-mono">Back</span>
          </button>

          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 select-none hidden md:inline font-mono">
            Now Playing • PlayVerse Cinema Immersive
          </span>
        </div>

        {/* 1. Immersive Video Player Container (optimized to fit window) */}
        <div className="w-full bg-black/40 border-y border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.95)]">
          <div className="max-w-[1720px] mx-auto px-0 lg:px-4">
            <motion.div
              initial={{ scale: 0.99, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full relative overflow-hidden md:rounded-[2.5rem]"
            >
              <CinematicVideoPlayer
                videoId={videoId}
                title={video.title}
                channelTitle={video.channelTitle}
                isSavedWatchLater={isSavedWatchLater}
                onWatchLaterToggle={toggleWatchLater}
                onInfoClick={() => setShowInfoOverlay(true)}
                onTheaterToggle={setIsTheaterMode}
              />
            </motion.div>
          </div>
        </div>

        {/* 2. Beautiful Responsive Grid Content Details Section */}
        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Player Details, Channel, Description, Comments */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Actions Row */}
              <div className="space-y-4 pt-4 border-b border-white/5 pb-6">
                <div className="space-y-2.5 text-left">
                  <h1 className="text-lg sm:text-xl font-bold leading-snug text-white">
                    {video.title}
                  </h1>
                  <p className="text-sm text-[#8e8e93]">
                    {parseInt(video.views || 0).toLocaleString()} views •{' '}
                    {video.publishedAt
                      ? new Date(video.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : 'Recently'}
                  </p>
                </div>

                {/* Actions Row stacked vertically exactly like mockup */}
                <div className="flex items-center justify-around py-4 border-t border-b border-white/5 text-center">
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer transition-colors group ${hasLiked ? 'text-orange-500' : 'text-white/60 hover:text-orange-500'
                      }`}
                  >
                    <ThumbsUp size={18} className={`group-hover:scale-110 transition-transform ${hasLiked ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(0)}K` : likesCount}
                    </span>
                  </button>

                  {/* Watch Later Button */}
                  <button
                    onClick={toggleWatchLater}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer transition-colors group ${isSavedWatchLater ? 'text-orange-500' : 'text-white/60 hover:text-orange-500'
                      }`}
                  >
                    <Clock size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      Watch Later
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={copyShareLink}
                    className="flex flex-col items-center gap-1.5 cursor-pointer text-white/60 hover:text-orange-500 transition-colors group"
                  >
                    <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      Share
                    </span>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/auth');
                      } else {
                        setShowPlaylistModal(true);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer text-white/60 hover:text-orange-500 transition-colors group"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      Save
                    </span>
                  </button>
                </div>
              </div>

              {/* Publisher/Channel Row exactly like mockup */}
              <div className="flex items-center justify-between py-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.channelTitle}&backgroundColor=f97316`}
                      alt={video.channelTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm tracking-tight leading-snug">
                      {video.channelTitle}
                    </h3>
                    <p className="text-[10px] text-white/40 font-medium">
                      1.2M subscribers
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isSubscribed
                      ? 'bg-white/10 text-white/80 border border-white/10 hover:bg-white/15'
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/10 active:scale-95'
                    }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Description Section exactly like mockup */}
              <div className="pt-2 text-left space-y-2">
                <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">Description</h4>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                  <p className={`text-xs text-white/60 leading-relaxed font-medium ${isDescriptionExpanded ? '' : 'line-clamp-2'
                    }`}>
                    {video.description || "No description provided."}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors font-mono mt-2 block cursor-pointer"
                  >
                    {isDescriptionExpanded ? '...less' : '...more'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Recommended Sidebar (desktop) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6 lg:border-l lg:border-white/5 lg:pl-8 text-left">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-orange-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest font-mono text-white">
                  Next to Stream
                </h3>
              </div>

              {/* Recommended List */}
              <div className="space-y-4">
                {relatedVideos.map((item) => {
                  const id = item.videoId || item.id;
                  if (!id) return null;

                  return (
                    <div
                      key={id}
                      onClick={() => handleVideoSelect(item)}
                      className="flex gap-3 group cursor-pointer p-2 rounded-2xl bg-white/[0.01] hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                    >
                      {/* 16:9 Thumbnail */}
                      <div className="relative w-32 min-w-32 aspect-video rounded-xl overflow-hidden border border-white/5 bg-white/5 flex-shrink-0">
                        <img
                          src={item.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop'}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';
                          }}
                        />
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-col justify-between py-0.5 overflow-hidden flex-grow text-left">
                        <h4 className="text-white font-bold text-xs leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {item.title}
                        </h4>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">
                            {item.channelTitle}
                          </p>
                          {item.views && (
                            <p className="text-[8px] font-extrabold text-orange-500/80 font-mono uppercase tracking-wider">
                              {parseInt(item.views).toLocaleString()} Views
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {relatedVideos.length === 0 && (
                  <div className="text-center py-12 text-white/20 text-xs italic bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    No recommendations found.
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoDetails;
