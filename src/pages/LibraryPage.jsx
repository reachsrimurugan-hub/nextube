import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import DesktopBrowseSidebar from '../components/DesktopBrowseSidebar';
import VideoGridCard from '../components/VideoGridCard';
import VideoListItem from '../components/VideoListItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Plus, Trash2, Disc3, ArrowLeft, History, LogIn, Eye, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToPlaylists, 
  createPlaylist, 
  updatePlaylist, 
  deletePlaylist, 
  removeVideoFromPlaylist, 
  subscribeToRecentlyWatched 
} from '../services/playlistService';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogle, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [activeTab, setActiveTab] = useState('Playlists');
  
  // Modals & UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editPlaylistName, setEditPlaylistName] = useState('');
  const [editPlaylistDesc, setEditPlaylistDesc] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);

  const [viewingPlaylist, setViewingPlaylist] = useState(null);

  // Sync playlists and recently watched from Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribePlaylists = subscribeToPlaylists(user.uid, (data) => {
      setPlaylists(data);
      // Keep viewing playlist in sync if active
      if (viewingPlaylist) {
        const updated = data.find(p => p.id === viewingPlaylist.id);
        setViewingPlaylist(updated || null);
      }
    });

    const unsubscribeRecently = subscribeToRecentlyWatched(user.uid, (data) => {
      setRecentlyWatched(data);
    });

    return () => {
      unsubscribePlaylists();
      unsubscribeRecently();
    };
  }, [user, viewingPlaylist?.id]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;
    try {
      await createPlaylist(user.uid, newPlaylistName, newPlaylistDesc);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating playlist:", err);
    }
  };

  const handleStartEdit = (e, playlist) => {
    e.stopPropagation(); // Prevent opening playlist details
    setEditingPlaylist(playlist);
    setEditPlaylistName(playlist.title);
    setEditPlaylistDesc(playlist.description || '');
    setShowEditModal(true);
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    if (!editPlaylistName.trim() || !editingPlaylist) return;
    try {
      await updatePlaylist(editingPlaylist.id, editPlaylistName, editPlaylistDesc);
      setShowEditModal(false);
      setEditingPlaylist(null);
    } catch (err) {
      console.error("Error updating playlist:", err);
    }
  };

  const handleStartDelete = (e, playlistId) => {
    e.stopPropagation(); // Prevent opening playlist details
    setDeletingPlaylistId(playlistId);
    setShowDeleteModal(true);
  };

  const handleDeletePlaylist = async () => {
    if (!deletingPlaylistId) return;
    try {
      await deletePlaylist(deletingPlaylistId);
      if (viewingPlaylist && viewingPlaylist.id === deletingPlaylistId) {
        setViewingPlaylist(null);
      }
      setShowDeleteModal(false);
      setDeletingPlaylistId(null);
    } catch (err) {
      console.error("Error deleting playlist:", err);
    }
  };

  const handleRemoveVideo = async (e, playlistId, videoId) => {
    e.stopPropagation();
    try {
      await removeVideoFromPlaylist(playlistId, videoId);
    } catch (err) {
      console.error("Error removing video:", err);
    }
  };

  const handleVideoSelect = (video) => {
    navigate(`/watch/${video.videoId || video.id}`);
  };

  // Sign In fallback for non-authenticated visitors
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-black text-white pb-24 lg:pb-8 flex flex-col">
        <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="glass-premium max-w-md w-full p-8 md:p-10 rounded-[3rem] text-center border border-white/5 relative z-10 shadow-2xl">
            <div className="w-16 h-16 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/20">
              <Film size={28} />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Access Your Library</h2>
            <p className="text-white/40 text-xs leading-relaxed mb-8">
              Sign in with Google to create custom watch collections, manage personal playlists, and sync your streaming logs across devices.
            </p>
            <button 
              onClick={() => loginWithGoogle()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-xs uppercase tracking-widest cursor-pointer"
            >
              <LogIn size={16} />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-8">
      <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[3.75rem] lg:pt-16">
        <DesktopBrowseSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 text-left">
          {viewingPlaylist ? (
            /* Playlist Detail View */
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-5 gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewingPlaylist(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/75"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-black text-white">{viewingPlaylist.title}</h1>
                    <p className="text-xs text-[#8e8e93] mt-1">{viewingPlaylist.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleStartEdit(e, viewingPlaylist)}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all"
                  >
                    <Pencil size={12} /> Edit Playlist
                  </button>
                  <button 
                    onClick={(e) => handleStartDelete(e, viewingPlaylist.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </header>

              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest font-mono">
                {viewingPlaylist.videos?.length || 0} Videos Saved
              </p>

              {/* Videos inside playlist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {viewingPlaylist.videos?.map((video) => (
                  <div key={video.videoId} className="group relative bg-[#141414] rounded-2xl overflow-hidden border border-white/5 shadow-lg flex flex-col">
                    <VideoGridCard video={{ id: video.videoId, title: video.title, thumbnail: video.thumbnail }} onClick={handleVideoSelect} />
                    <div className="p-3 bg-[#111] border-t border-white/5 flex items-center justify-between mt-auto">
                      <span className="text-[10px] text-white/30 truncate font-mono uppercase tracking-wider">{video.duration || 'Video'}</span>
                      <button 
                        onClick={(e) => handleRemoveVideo(e, viewingPlaylist.id, video.videoId)}
                        className="text-white/40 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-white/5"
                        title="Remove from playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {(!viewingPlaylist.videos || viewingPlaylist.videos.length === 0) && (
                  <div className="col-span-full text-center py-20 text-white/30 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-sm">This playlist is currently empty.</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
                    >
                      Browse Videos
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tabbed Library Overview */
            <>
              <header className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <h1 className="text-2xl font-black tracking-tight text-white">My Library</h1>
              </header>

              <div className="flex gap-8 border-b border-white/[0.08] mb-6">
                {['Playlists', 'Recently Watched'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`pv-tab ${activeTab === tab ? 'pv-tab-active' : 'pv-tab-inactive'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="libraryTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'Playlists' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Custom Playlists</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1.5 bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-full transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                      <Plus size={14} /> Create Playlist
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {playlists.map((playlist) => {
                      const firstVideoThumbnail = playlist.videos && playlist.videos.length > 0 ? playlist.videos[0].thumbnail : null;
                      return (
                        <div
                          key={playlist.id}
                          onClick={() => setViewingPlaylist(playlist)}
                          className="group bg-[#151515] border border-white/[0.06] rounded-3xl overflow-hidden hover:border-[#f97316]/30 transition-all duration-300 cursor-pointer shadow-lg flex flex-col"
                        >
                          {/* Playlist Cover Art */}
                          <div className="aspect-video relative bg-[#222] flex items-center justify-center overflow-hidden border-b border-white/5">
                            {firstVideoThumbnail ? (
                              <img 
                                src={firstVideoThumbnail} 
                                alt="" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-orange-500/50 transition-colors">
                                <Disc3 size={32} className="animate-spin-slow" />
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono">Empty List</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="p-3 bg-orange-500 rounded-full text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Eye size={18} />
                              </div>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[9px] font-bold uppercase tracking-wider font-mono">
                              {playlist.videos?.length || 0} Videos
                            </div>
                          </div>

                          {/* Playlist Details */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-white group-hover:text-[#f97316] transition-colors line-clamp-1">{playlist.title}</h4>
                              <p className="text-xs text-white/40 line-clamp-2">{playlist.description || 'No description.'}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4 border-t border-white/5 pt-3">
                              <button 
                                onClick={(e) => handleStartEdit(e, playlist)}
                                className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={(e) => handleStartDelete(e, playlist.id)}
                                className="p-2 text-white/40 hover:text-red-500 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {playlists.length === 0 && (
                      <div className="col-span-full py-20 text-center text-white/30 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                        <Disc3 size={32} className="mx-auto text-white/20 mb-4 animate-pulse" />
                        <p className="text-sm">You haven't created any playlists yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Recently Watched' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 mb-2">
                    <History size={16} />
                    <p className="text-xs font-bold uppercase tracking-widest font-mono">Watch History Logs (Firestore)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recentlyWatched.map((video) => (
                      <VideoGridCard 
                        key={video.videoId} 
                        video={{ 
                          id: video.videoId, 
                          title: video.title, 
                          thumbnail: video.thumbnail, 
                          channelTitle: video.channelTitle 
                        }} 
                        onClick={handleVideoSelect} 
                      />
                    ))}

                    {recentlyWatched.length === 0 && (
                      <div className="col-span-full py-20 text-center text-white/30 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                        <History size={32} className="mx-auto text-white/20 mb-4 animate-pulse" />
                        <p className="text-sm">Your streaming history is empty.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-6 shadow-2xl text-left">
            <h3 className="text-base font-bold uppercase tracking-widest text-[#f97316] font-mono mb-4">Create Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Anime Favorites"
                  className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-[#f97316] text-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Description</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Provide a brief summary..."
                  className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-[#f97316] text-sm h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#f97316] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-6 shadow-2xl text-left">
            <h3 className="text-base font-bold uppercase tracking-widest text-[#f97316] font-mono mb-4">Edit Playlist</h3>
            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Name</label>
                <input
                  type="text"
                  value={editPlaylistName}
                  onChange={(e) => setEditPlaylistName(e.target.value)}
                  className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-[#f97316] text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Description</label>
                <textarea
                  value={editPlaylistDesc}
                  onChange={(e) => setEditPlaylistDesc(e.target.value)}
                  className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-[#f97316] text-sm h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingPlaylist(null); }}
                  className="px-4 py-3 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#f97316] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#161616] border border-white/10 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <h3 className="text-base font-bold uppercase tracking-widest text-red-500 font-mono">Delete Playlist?</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Are you sure you want to permanently delete this playlist? This action cannot be undone and all saved videos will be unlinked.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletingPlaylistId(null); }}
                className="px-4 py-3 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlaylist}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
