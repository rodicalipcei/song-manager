// src/services/SongService.ts
import { ApiService } from './ApiService';
import { Song } from '../models/Song';

export class SongService {
  private readonly STORAGE_KEY = 'song-manager-songs';
  private useLocalStorage = false; // Default to API mode
  
  async getSongs(): Promise<Song[]> {
    if (this.useLocalStorage) {
      console.log("Using localStorage to get songs");
      return this.getSongsFromLocalStorage();
    }
    
    try {
      console.log("Fetching songs from API");
      // Get songs from API
      const songDataArray = await ApiService.getSongs();
      console.log("API returned songs:", songDataArray);
      
      // Convert API response to Song objects
      return songDataArray.map((songData) => {
        return new Song(
          songData.title,
          songData.musical_range,
          songData.audio_path, // This is the server path, not a blob URL
          songData.last_sung ? new Date(songData.last_sung) : null,
          songData.id || songData._id, // Handle both id formats
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
    console.log("Getting songs from localStorage");
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
      console.log("Saving songs to localStorage");
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
    console.log("Adding new song:", song);
    
    if (this.useLocalStorage) {
      console.log("Using localStorage to add song");
      // Handle localStorage mode
      const newSongs = [...songs, song];
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      // Check if we have an audio file to upload
      if (song.audioFile instanceof File) {
        console.log("Song has audio file, using local storage for this song");
        // Fall back to localStorage just for this song with audio
        const newSongs = [...songs, song];
        this.saveSongs(newSongs);
        return newSongs;
      }
      
      // If no audio file, proceed with API
      console.log("Creating song via API with FormData");
      const songData = {
        title: song.title,
        musicalRange: song.musicalRange,
        lastSung: song.lastSung
      };
      
      const createdSong = await ApiService.createSong(songData);
      console.log("API created song:", createdSong);
      
      // Create a new Song instance with the server data
      const newSong = new Song(
        createdSong.title,
        createdSong.musical_range,
        createdSong.audio_path,
        createdSong.last_sung ? new Date(createdSong.last_sung) : null,
        createdSong.id || createdSong._id,
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
    console.log("Attempting to remove song with ID:", id);
    
    if (this.useLocalStorage) {
      console.log("Using localStorage for song removal");
      const newSongs = songs.filter(song => song.id !== id);
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      console.log("Sending DELETE request to API for song ID:", id);
      // Add a timeout to ensure the request completes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/songs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}: ${response.statusText}`);
        console.error('Error response body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Get the response as text first
      const textResponse = await response.text();
      console.log("Response from delete:", textResponse);
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(textResponse);
        
        // Check if the API indicates an error
        if (!data.success) {
          throw new Error(data.message || 'API operation failed');
        }
        
        console.log("Successfully removed song, returning updated list");
        // Return the updated list without the deleted song
        return songs.filter(song => song.id !== id);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error(`Server returned invalid JSON`);
      }
    } catch (error) {
      console.error('Error removing song via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.removeSong(id, songs);
    }
  }

  async updateSong(updatedSong: Song, songs: Song[]): Promise<Song[]> {
    console.log("Attempting to update song:", updatedSong);
    
    if (this.useLocalStorage) {
      console.log("Using localStorage for song update");
      const newSongs = songs.map(song => 
        song.id === updatedSong.id ? updatedSong : song
      );
      this.saveSongs(newSongs);
      return newSongs;
    }
    
    try {
      // If there's an audio file, use localStorage
      if (updatedSong.audioFile instanceof File) {
        console.log("Song has audio file, using local storage for this update");
        const newSongs = songs.map(song => 
          song.id === updatedSong.id ? updatedSong : song
        );
        this.saveSongs(newSongs);
        return newSongs;
      }
      
      console.log("Sending PUT request to API for song update");
      // If no new audio file, proceed with API
      const songData = {
        title: updatedSong.title,
        musicalRange: updatedSong.musicalRange,
        lastSung: updatedSong.lastSung ? updatedSong.lastSung.toISOString() : null
      };
      
      // Add a timeout to ensure the request completes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/songs/${updatedSong.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(songData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}: ${response.statusText}`);
        console.error('Error response body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const textResponse = await response.text();
      console.log("Response from update:", textResponse);
      
      try {
        const data = JSON.parse(textResponse);
        
        if (!data.success) {
          throw new Error(data.message || 'API operation failed');
        }
        
        // Create a new Song with the server data
        const serverUpdatedSong = new Song(
          data.data.title,
          data.data.musical_range,
          data.data.audio_path,
          data.data.last_sung ? new Date(data.data.last_sung) : null,
          data.data.id || data.data._id, // Handle both id formats
          data.data.created_at ? new Date(data.data.created_at) : new Date()
        );
        
        console.log("Successfully updated song, returning updated list");
        // Update the song in the local array
        return songs.map(song => 
          song.id === updatedSong.id ? serverUpdatedSong : song
        );
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error(`Server returned invalid JSON`);
      }
    } catch (error) {
      console.error('Error updating song via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.updateSong(updatedSong, songs);
    }
  }
  
  async markSongAsSung(id: string, songs: Song[]): Promise<Song[]> {
    console.log("Attempting to mark song as sung with ID:", id);
    
    if (this.useLocalStorage) {
      console.log("Using localStorage to mark song as sung");
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
      console.log("Sending PATCH request to API to mark song as sung");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/songs/${id}/mark-sung`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}: ${response.statusText}`);
        console.error('Error response body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const textResponse = await response.text();
      console.log("Response from mark-sung:", textResponse);
      
      try {
        const data = JSON.parse(textResponse);
        
        if (!data.success) {
          throw new Error(data.message || 'API operation failed');
        }
        
        // Update the song in our local array with server data
        return songs.map(song => 
          song.id === id 
            ? new Song(
                data.data.title,
                data.data.musical_range,
                data.data.audio_path,
                data.data.last_sung ? new Date(data.data.last_sung) : null,
                data.data.id || data.data._id, // Handle both id formats
                data.data.created_at ? new Date(data.data.created_at) : new Date()
              ) 
            : song
        );
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error(`Server returned invalid JSON`);
      }
    } catch (error) {
      console.error('Error marking song as sung via API:', error);
      // Fall back to localStorage
      this.useLocalStorage = true;
      return this.markSongAsSung(id, songs);
    }
  }

  async searchSongs(query: string, songs: Song[]): Promise<Song[]> {
    console.log("Searching for songs with query:", query);
    if (!query.trim()) return this.getSongs(); // Return all songs if query is empty
    
    if (this.useLocalStorage) {
      console.log("Using localStorage for song search");
      // Split the query into individual words for better matching
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      
      // Match ANY of the search terms (not requiring all terms to match)
      return songs.filter(song => {
        const titleLower = song.title.toLowerCase();
        const rangeLower = song.musicalRange.toLowerCase();
        
        // Check if ANY search term matches either the title or musical range
        return searchTerms.some(term => 
          titleLower.includes(term) || rangeLower.includes(term)
        );
      });
    }
    
    try {
      console.log("Searching songs via API");
      // Search songs via API
      const songDataArray = await ApiService.searchSongs(query);
      console.log("API search returned:", songDataArray);
      
      // Convert API response to Song objects
      return songDataArray.map((songData) => {
        return new Song(
          songData.title,
          songData.musical_range,
          songData.audio_path,
          songData.last_sung ? new Date(songData.last_sung) : null,
          songData.id || songData._id, // Handle both id formats
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