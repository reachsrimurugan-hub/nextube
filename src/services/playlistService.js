import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDocs,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Listen to user's playlists in real-time
export const subscribeToPlaylists = (userId, onUpdate) => {
  const q = query(
    collection(db, 'playlists'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const playlists = [];
    snapshot.forEach((doc) => {
      playlists.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(playlists);
  }, (error) => {
    console.error("Error subscribing to playlists:", error);
  });
};

// Create a new playlist
export const createPlaylist = async (userId, title, description) => {
  try {
    const docRef = doc(collection(db, 'playlists'));
    const playlistData = {
      id: docRef.id,
      userId,
      title,
      description: description || '',
      videos: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, playlistData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
};

// Edit playlist details
export const updatePlaylist = async (playlistId, title, description) => {
  try {
    const docRef = doc(db, 'playlists', playlistId);
    await updateDoc(docRef, {
      title,
      description: description || '',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating playlist:", error);
    throw error;
  }
};

// Delete a playlist
export const deletePlaylist = async (playlistId) => {
  try {
    const docRef = doc(db, 'playlists', playlistId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
};

// Add video to playlist (prevent duplicates)
export const addVideoToPlaylist = async (playlistId, video) => {
  try {
    const docRef = doc(db, 'playlists', playlistId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Playlist not found");
    const data = snap.data();
    
    // Video structure: { videoId, title, thumbnail, duration }
    const videoObj = {
      videoId: video.videoId || video.id || '',
      title: video.title || '',
      thumbnail: video.thumbnail || '',
      duration: video.duration || ''
    };

    // Prevent duplicate videos
    const exists = data.videos.some(v => v.videoId === videoObj.videoId);
    if (exists) {
      return { success: false, message: "Video already exists in this playlist" };
    }

    await updateDoc(docRef, {
      videos: arrayUnion(videoObj),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    throw error;
  }
};

// Remove video from playlist
export const removeVideoFromPlaylist = async (playlistId, videoId) => {
  try {
    const docRef = doc(db, 'playlists', playlistId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Playlist not found");
    const data = snap.data();
    
    // Find matching video to remove
    const videoToRemove = data.videos.find(v => v.videoId === videoId);
    if (!videoToRemove) return { success: false, message: "Video not found in playlist" };

    await updateDoc(docRef, {
      videos: arrayRemove(videoToRemove),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error removing video from playlist:", error);
    throw error;
  }
};

// Listen to recently watched videos in real-time
export const subscribeToRecentlyWatched = (userId, onUpdate) => {
  const q = query(
    collection(db, `users/${userId}/recentlyWatched`),
    orderBy('watchedAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (error) => {
    console.error("Error subscribing to recently watched:", error);
  });
};

// Add video to recently watched (limit 20)
export const addToRecentlyWatched = async (userId, video) => {
  try {
    const videoId = video.videoId || video.id;
    if (!videoId) return;

    const docRef = doc(db, `users/${userId}/recentlyWatched`, videoId);
    const watchData = {
      videoId,
      title: video.title || '',
      thumbnail: video.thumbnail || '',
      channelTitle: video.channelTitle || '',
      watchedAt: serverTimestamp()
    };
    
    await setDoc(docRef, watchData);

    // Limit to 20 by cleaning up older ones if they exceed 20
    const colRef = collection(db, `users/${userId}/recentlyWatched`);
    const q = query(colRef, orderBy('watchedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.size > 20) {
      const docsToDelete = snapshot.docs.slice(20);
      for (const d of docsToDelete) {
        await deleteDoc(d.ref);
      }
    }
  } catch (error) {
    console.error("Error adding to recently watched:", error);
  }
};
