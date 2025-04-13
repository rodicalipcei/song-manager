<!-- src/App.vue -->
<template>
  <div class="song-manager">
    <header class="app-header">
      <div class="app-header-content">
        <h1><span class="icon">🎵</span> Song Manager</h1>
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search songs..." 
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>
    </header>
    
    <main class="app-content">
      <div v-if="isLoading" class="loading-indicator">
        <p>Loading songs...</p>
      </div>
      
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="loadSongs" class="button primary">Try Again</button>
      </div>
      
      <song-form 
        v-if="!isLoading"
        :is-editing="isEditing"
        :song-to-edit="songToEdit"
        @add-song="handleAddSong" 
        @update-song="handleUpdateSong"
        @cancel-edit="cancelEdit"
      ></song-form>
      
      <div v-if="!isLoading" class="songs-section">
        <div class="section-header">
          <h2>Your Songs ({{ songs.length }})</h2>
          <div class="view-toggles">
            <button 
              @click="viewMode = 'table'" 
              :class="['view-toggle', { active: viewMode === 'table' }]"
              title="Table View"
            >
              📋
            </button>
            <button 
              @click="viewMode = 'cards'" 
              :class="['view-toggle', { active: viewMode === 'cards' }]"
              title="Card View"
            >
              🪪
            </button>
          </div>
        </div>
        
        <song-table
          v-if="viewMode === 'table'"
          :songs="songs"
          :search-query="searchQuery"
          @mark-sung="handleMarkSung"
          @edit-song="startEdit"
          @remove-song="handleRemoveSong"
        ></song-table>
        
        <div v-else class="song-cards">
          <p v-if="songs.length === 0" class="no-songs">
            <span v-if="searchQuery">No songs match your search.</span>
            <span v-else>No songs added yet. Add your first song above!</span>
          </p>
          <song-card
            v-for="song in songs"
            :key="song.id"
            :song="song"
            @mark-sung="handleMarkSung"
            @edit-song="startEdit"
            @remove-song="handleRemoveSong"
          ></song-card>
        </div>
      </div>
    </main>
    
    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} Song Manager App</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SongTable from './components/SongTable.vue';
import SongForm from './components/SongForm.vue';
import SongCard from './components/SongCard.vue';
import { SongService } from './services/SongService';
import { Song } from './models/Song';

// Services
const songService = new SongService();

// Reactive state
const songs = ref<Song[]>([]);
const searchQuery = ref('');
const isEditing = ref(false);
const songToEdit = ref<Song | null>(null);
const viewMode = ref<'table' | 'cards'>('cards'); // Default to cards for mobile-friendliness
const isLoading = ref(true);
const error = ref<string | null>(null);

// Load songs from API or localStorage
const loadSongs = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const fetchedSongs = await songService.getSongs();
    songs.value = fetchedSongs;
    
    // Auto-detect viewport and set appropriate view
    if (window.innerWidth > 768) {
      viewMode.value = 'table';
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error loading songs:', err);
    error.value = `Failed to load songs: ${errorMessage}`;
  } finally {
    isLoading.value = false;
  }
};

// Action handlers
const handleAddSong = async (newSong: Song) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const updatedSongs = await songService.addSong(newSong, songs.value);
    songs.value = updatedSongs;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error adding song:', err);
    error.value = `Failed to add song: ${errorMessage}`;
  } finally {
    isLoading.value = false;
  }
};

const handleRemoveSong = async (id: string) => {
  if (confirm('Are you sure you want to remove this song?')) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const updatedSongs = await songService.removeSong(id, songs.value);
      songs.value = updatedSongs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error removing song:', err);
      error.value = `Failed to remove song: ${errorMessage}`;
    } finally {
      isLoading.value = false;
    }
  }
};

const handleMarkSung = async (id: string) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const updatedSongs = await songService.markSongAsSung(id, songs.value);
    songs.value = updatedSongs;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error marking song as sung:', err);
    error.value = `Failed to mark song as sung: ${errorMessage}`;
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateSong = async (updatedSong: Song) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const updatedSongs = await songService.updateSong(updatedSong, songs.value);
    songs.value = updatedSongs;
    isEditing.value = false;
    songToEdit.value = null;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error updating song:', err);
    error.value = `Failed to update song: ${errorMessage}`;
  } finally {
    isLoading.value = false;
  }
};

const startEdit = (id: string) => {
  const song = songs.value.find(s => s.id === id);
  if (song) {
    songToEdit.value = { ...song };
    isEditing.value = true;
    
    // Scroll to form
    document.querySelector('.song-form-container')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  songToEdit.value = null;
};

const handleSearch = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    if (!searchQuery.value.trim()) {
      // If search is cleared, reload all songs
      await loadSongs();
      return;
    }
    
    const searchResults = await songService.searchSongs(searchQuery.value, songs.value);
    songs.value = searchResults;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error searching songs:', err);
    error.value = `Failed to search songs: ${errorMessage}`;
  } finally {
    isLoading.value = false;
  }
};

// Load songs when component is mounted
onMounted(() => {
  loadSongs();
});
</script>