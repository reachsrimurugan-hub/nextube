import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicNavbar from '../components/CinematicNavbar';
import { motion } from 'framer-motion';
import { 
  User, CreditCard, Receipt, History, Library, Settings, 
  LogOut, ChevronRight, Volume2, Shield, Bell, Globe, Eye, Pencil 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Import local premium avatars so Vite resolves and bundles them correctly
import man1 from '../assets/man1.png';
import man2 from '../assets/man2.png';
import man3 from '../assets/man3.png';
import woman1 from '../assets/woman1.png';
import woman2 from '../assets/woman2.png';
import woman3 from '../assets/women3.png';

const DEFAULT_AVATARS = [man1, man2, man3, woman1, woman2, woman3];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    tier: 'Cinema Elite',
    avatar: man1,
    joined: 'June 2026'
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleStartEdit = () => {
    setEditUsername(profile.username || '');
    setEditEmail(profile.email || '');
    setEditAvatar(profile.avatar || man1);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Update Firebase Auth profile
        await firebaseUpdateProfile(currentUser, {
          displayName: editUsername,
          photoURL: editAvatar
        });

        // Update Firestore users collection document
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          name: editUsername,
          photoURL: editAvatar,
          email: editEmail
        });

        setProfile((prev) => ({
          ...prev,
          username: editUsername,
          email: editEmail,
          avatar: editAvatar
        }));
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile details:", err);
    }
  };

  useEffect(() => {
    setIsLoggedIn(!!user);
    if (user) {
      setProfile({
        username: user.displayName || '',
        email: user.email || '',
        tier: 'Cinema Elite',
        avatar: user.photoURL || man1,
        joined: 'June 2026'
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  const menuItems = [
    { label: 'Profile', icon: <User size={16} /> },
    { label: 'Watch History', icon: <History size={16} />, path: '/history' },
    { label: 'My List', icon: <Library size={16} />, path: '/library' },
    { label: 'Settings', icon: <Settings size={16} />, path: '/settings' }
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-10">
      <CinematicNavbar onSearch={(q) => navigate(`/search/${q}`)} />

      <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pt-[3.75rem] lg:pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider px-1">Account</p>
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-2 space-y-0.5">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveMenu(item.label);
                      if (item.path) navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      activeMenu === item.label
                        ? 'bg-[#f97316]/15 text-[#f97316]'
                        : 'text-[#8e8e93] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          <div className="lg:col-span-8 space-y-8 text-left">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-6">Profile</h1>
            </div>

            {/* Profile Detail Card exactly like mockup */}
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5 w-full sm:w-auto">
                {/* Circular Profile Avatar */}
                <div className="relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-red-500 rounded-full blur-md opacity-20" />
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 relative z-10">
                    <img 
                      src={profile.avatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name / Email / Tier Info Row */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white truncate">{profile.username}</h2>
                    
                    {/* Orange status label + PREMIUM badge */}
                    <span className="bg-[#f97316] text-white text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded">
                      {profile.tier}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white/40 truncate">{profile.email}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">
                    Member since {profile.joined}
                  </p>
                </div>
              </div>

              {/* Edit button */}
              <button 
                onClick={handleStartEdit}
                className="flex-shrink-0 w-full sm:w-auto px-5 py-3 rounded-full border border-white/10 hover:border-white/20 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Pencil size={12} />
                Edit Profile
              </button>
            </div>

            {/* Preferences block exactly like mockup */}
            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight text-white uppercase tracking-wider font-mono">Preferences</h3>
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                {[
                  { label: 'Playback Settings', icon: <Volume2 size={16} className="text-orange-500" /> },
                  { label: 'Language', icon: <Globe size={16} className="text-orange-500" />, detail: 'English' },
                ].map((pref) => (
                  <div 
                    key={pref.label} 
                    className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                        {pref.icon}
                      </div>
                      <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                        {pref.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-white/30 group-hover:text-white transition-colors">
                      {pref.detail && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">
                          {pref.detail}
                        </span>
                      )}
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-3xl w-full max-w-[480px] overflow-hidden shadow-2xl flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#f97316] font-mono">Edit Profile</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f97316] transition-colors"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f97316] transition-colors"
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider block">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(av)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                        editAvatar === av 
                          ? 'border-[#f97316] scale-105 ring-4 ring-[#f97316]/20' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={av} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Avatar URL Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider">Custom Avatar URL</label>
                <input 
                  type="text" 
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Paste an image URL..."
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#f97316] transition-colors"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-[#161616] border-t border-white/[0.06] flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-3 bg-[#f97316] hover:bg-orange-600 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
