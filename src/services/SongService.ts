// src/services/SongService.ts
import { ApiService } from './ApiService';
import { Song } from '../models/Song';

export class SongService {
  private readonly STORAGE_KEY = 'song-manager-songs';
  private useLocalStorage = false; // Default to API mode
  
  async getSongs(): Promise<Song[]> {
    if (this.useLocalStorage) {
      return this.getSongsFromLocalStorage();
    }
    
    try {
      // Get songs from API
      const songDataArray = await ApiService.getSongs();
      
      // Convert API response to Song objects
      return songDataArray.map((songData) => {
        return new Song(
          songData.title,
          songData.musical_range,
          songData.audio_path, // This is the server path, not a blob URL
          songData.last_sung ? new Date(songData.last_sung) : null,
          songData.id,
          songData.created_at ? new Date(songData.created_at) : new Date()
        );
      });
    } catch (error) {
      console.error('Error fetching songs from API, falling back to localStorage:', error);
      // Enable localStorage fallback
      this.useLocalStorage = true;
      return this.getSongsFromLocalStorage();
    }
  }
  
  private getSongsFromLocalStorage(): Song[] {
    const storedSongs = localStorage.getItem(this.STORAGE_KEY);
    if (!storedSongs) return [];
    
    try {
      const parsedData = JSON.parse(storedSongs);
      return parsedData.map((song: any) => {
        return new Song(
          song.title,
          song.musicalRange,
          null, // We can't store Files in localStorage
          song.lastSung ? new Date(song.lastSung) : null,
          song.id,
          song.createdAt ? new Date(song.createdAt) : new Date()
        );
      });
    } catch (error) {
      console.error('Error parsing stored songs:', error);
      return [];
    }
  }

  saveSongs(songs: Song[]): void {
    if (this.useLocalStorage) {
      // Store only the serializable data (not Files)
      const serializableSongs = songs.map(song => ({
        id: song.id,
        title: song.title,
        musicalRange: song.musicalRange,
        lastSung: song.lastSung ? song.lastSung.toISOString() : null,
        createdAt: song.createdAt.toISOString(),
        // Don't store audioFile as it's not serializable
        audioPath: song.audioPath
      }));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializableSongs));
    }
    // When using the API, we don't need to save all songs at once
  }

  async addSong(song: Song, songs: Song[]): Promise<Song[]> {
    if (this.useLocalStorage) {
      // Handle localStorage mode
      const newSongs = [...songs, song];
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      // Create the song via API with FormData for file upload
      const songData = {
        title: song.title,
        musicalRange: song.musicalRange,
        audioFile: song.audioFile,
        lastSung: song.lastSung
      };
      
      const createdSong = await ApiService.createSong(songData);
      
      // Create a new Song instance with the server data
      const newSong = new Song(
        createdSong.title,
        createdSong.musical_range,
        createdSong.audio_path, // Use the server path
        createdSong.last_sung ? new Date(createdSong.last_sung) : null,
        createdSong.id,
        createdSong.created_at ? new Date(createdSong.created_at) : new Date()
      );
      
      return [...songs, newSong];
    } catch (error) {
      console.error('Error adding song via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.addSong(song, songs);
    }
  }

  async removeSong(id: string, songs: Song[]): Promise<Song[]> {
    if (this.useLocalStorage) {
      const newSongs = songs.filter(song => song.id !== id);
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      // Delete the song via API
      await ApiService.deleteSong(id);
      
      // Return the updated list without the deleted song
      return songs.filter(song => song.id !== id);
    } catch (error) {
      console.error('Error removing song via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.removeSong(id, songs);
    }
  }

  async updateSong(updatedSong: Song, songs: Song[]): Promise<Song[]> {
    if (this.useLocalStorage) {
      const newSongs = songs.map(song => 
        song.id === updatedSong.id ? updatedSong : song
      );
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      // Update the song via API
      const songData = {
        title: updatedSong.title,
        musicalRange: updatedSong.musicalRange,
        audioFile: updatedSong.audioFile, // This is the File object
        lastSung: updatedSong.lastSung
      };
      
      const updatedSongData = await ApiService.updateSong(updatedSong.id, songData);
      
      // Create a new Song with the server data
      const serverUpdatedSong = new Song(
        updatedSongData.title,
        updatedSongData.musical_range,
        updatedSongData.audio_path, // Use the server path
        updatedSongData.last_sung ? new Date(updatedSongData.last_sung) : null,
        updatedSongData.id,
        updatedSongData.created_at ? new Date(updatedSongData.created_at) : new Date()
      );
      
      // Update the song in the local array
      return songs.map(song => 
        song.id === updatedSong.id ? serverUpdatedSong : song
      );
    } catch (error) {
      console.error('Error updating song via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.updateSong(updatedSong, songs);
    }
  }
  
  async markSongAsSung(id: string, songs: Song[]): Promise<Song[]> {
    if (this.useLocalStorage) {
      const song = songs.find(s => s.id === id);
      if (song) {
        song.updateLastSung();
        const newSongs = songs.map(s => s.id === id ? song : s);
        this.saveSongs(newSongs);
        return newSongs;
      }
      return songs;
    }
    
    try {
      // Mark the song as sung via API
      const updatedSongData = await ApiService.markSongAsSung(id);
      
      // Update the song in our local array with server data
      return songs.map(song => 
        song.id === id 
          ? new Song(
              updatedSongData.title,
              updatedSongData.musical_range,
              updatedSongData.audio_path,
              updatedSongData.last_sung ? new Date(updatedSongData.last_sung) : null,
              updatedSongData.id,
              updatedSongData.created_at ? new Date(updatedSongData.created_at) : new Date()
            ) 
          : song
      );
    } catch (error) {
      console.error('Error marking song as sung via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.markSongAsSung(id, songs);
    }
  }

  async searchSongs(query: string, songs: Song[]): Promise<Song[]> {
    if (!query.trim()) return this.getSongs(); // Return all songs if query is empty
    
    if (this.useLocalStorage) {
      const lowerQuery = query.toLowerCase().trim();
      return songs.filter(song => 
        song.title.toLowerCase().includes(lowerQuery) ||
        song.musicalRange.toLowerCase().includes(lowerQuery)
      );
    }
    
    try {
      // Search songs via API
      const songDataArray = await ApiService.searchSongs(query);
      
      // Convert API response to Song objects
      return songDataArray.map((songData) => {
        return new Song(
          songData.title,
          songData.musical_range,
          songData.audio_path,
          songData.last_sung ? new Date(songData.last_sung) : null,
          songData.id,
          songData.created_at ? new Date(songData.created_at) : new Date()
        );
      });
    } catch (error) {
      console.error('Error searching songs via API:', error);
      
      // Fall back to local search
      this.useLocalStorage = true;
      return this.searchSongs(query, songs);
    }
  }
}