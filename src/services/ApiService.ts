// src/services/ApiService.ts
import { Song } from '../models/Song';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Define interface for API response
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Define interface for song data from API
interface SongData {
  id: string;
  _id: string,
  title: string;
  musical_range: string;
  audio_path: string | null;
  last_sung: string | null;
  created_at: string;
}

export class ApiService {
  // Helper method to handle response and check content type
  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${response.statusText}`);
      console.error('Error response body:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Get the response as text first
    const textResponse = await response.text();
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(textResponse) as ApiResponse<T>;
      
      // Check if the API indicates an error
      if (!data.success) {
        throw new Error(data.message || 'API operation failed');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      throw new Error(`Server returned invalid JSON`);
    }
  }

  // Get all songs
  static async getSongs(): Promise<SongData[]> {
    console.log('Fetching songs from API...');
    try {
      const response = await fetch(`${API_URL}/songs`);
      const data = await this.handleResponse<SongData[]>(response);
      console.log(`Successfully retrieved ${data.data.length} songs`);
      return data.data;
    } catch (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }
  }
  
  // Create a new song
  static async createSong(songData: {
    title: string;
    musicalRange: string;
    audioFile?: File | null;
    lastSung?: Date | null;
  }): Promise<SongData> {
    try {
      // Handle file upload with FormData
      const formData = new FormData();
      formData.append('title', songData.title);
      formData.append('musicalRange', songData.musicalRange);
      
      if (songData.lastSung) {
        formData.append('lastSung', songData.lastSung.toISOString());
      }
      
      if (songData.audioFile instanceof File) {
        formData.append('audioFile', songData.audioFile);
      }
      
      const response = await fetch(`${API_URL}/songs`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await this.handleResponse<SongData>(response);
      return data.data;
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    }
  }
  
  // Update an existing song
  static async updateSong(id: string, songData: {
    title: string;
    musicalRange: string;
    audioFile?: File | null;
    lastSung?: Date | null;
  }): Promise<SongData> {
    try {
      // Handle file upload with FormData
      const formData = new FormData();
      formData.append('title', songData.title);
      formData.append('musicalRange', songData.musicalRange);
      
      if (songData.lastSung) {
        formData.append('lastSung', songData.lastSung.toISOString());
      }
      
      if (songData.audioFile instanceof File) {
        formData.append('audioFile', songData.audioFile);
      }
      
      const response = await fetch(`${API_URL}/songs/${id}`, {
        method: 'PUT',
        body: formData,
      });
      
      const data = await this.handleResponse<SongData>(response);
      return data.data;
    } catch (error) {
      console.error(`Error updating song ${id}:`, error);
      throw error;
    }
  }
  
  // Mark a song as sung today
  static async markSongAsSung(id: string): Promise<SongData> {
    try {
      const response = await fetch(`${API_URL}/songs/${id}/mark-sung`, {
        method: 'PATCH',
      });
      
      const data = await this.handleResponse<SongData>(response);
      return data.data;
    } catch (error) {
      console.error(`Error marking song ${id} as sung:`, error);
      throw error;
    }
  }
  
  // Delete a song
  static async deleteSong(id: string): Promise<{ id: string }> {
    try {
      const response = await fetch(`${API_URL}/songs/${id}`, {
        method: 'DELETE',
      });
      
      const data = await this.handleResponse<{ id: string }>(response);
      return data.data;
    } catch (error) {
      console.error(`Error deleting song ${id}:`, error);
      throw error;
    }
  }
  
  // Search songs
  static async searchSongs(query: string): Promise<SongData[]> {
    try {
      const response = await fetch(`${API_URL}/songs/search?q=${encodeURIComponent(query)}`);
      const data = await this.handleResponse<SongData[]>(response);
      return data.data;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  }
}