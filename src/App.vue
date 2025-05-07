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
        <div class="loading-animation">
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
        </div>
        <p>Loading songs...</p>
      </div>
      
      <div v-if="error" class="error-message">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="loadSongs" class="button primary">Try Again</button>
      </div>
      
      <!-- Songs section first -->
      <div v-if="!isLoading" class="songs-section">
        <div class="section-header">
          <h2>Your Songs <span class="songs-count">{{ songs.length }}</span></h2>
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
          <div v-if="songs.length === 0" class="no-songs">
            <div class="empty-state">
              <div class="empty-state-icon">🎵</div>
              <p v-if="searchQuery">No songs match your search.</p>
              <p v-else>No songs added yet. Add your first song above!</p>
            </div>
          </div>
          <song-card
            v-for="(song, index) in songs"
            :key="song.id"
            :song="song"
            :number="index + 1"
            @mark-sung="handleMarkSung"
            @edit-song="startEdit"
            @remove-song="handleRemoveSong"
          ></song-card>
        </div>
      </div>
      
      <!-- Add song form below the songs list -->
      <div class="add-song-section">
        <h2 class="add-song-title">Add New Song</h2>
        <song-form 
          v-if="!isLoading"
          :is-editing="isEditing"
          :song-to-edit="songToEdit"
          @add-song="handleAddSong" 
          @update-song="handleUpdateSong"
          @cancel-edit="cancelEdit"
        ></song-form>
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
    document.querySelector('.add-song-section')?.scrollIntoView({ 
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

<style scoped>
/* Root variables are defined in index.css or App.vue */

/* Layout styles */
.app-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  padding: var(--spacing-6);
}

.songs-section {
  flex: 1;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.add-song-section {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  margin-top: var(--spacing-6);
}

.add-song-title {
  margin-top: 0;
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-xl);
  color: var(--color-text-dark);
}

/* Header styles */
.app-header {
  background-color: var(--color-bg-dark);
  padding: var(--spacing-4) var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.app-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-4) var(--spacing-2) var(--spacing-8);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-light);
  color: var(--color-text-dark);
}

.search-icon {
  position: absolute;
  left: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
}

/* Section header with toggles */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.view-toggles {
  display: flex;
  gap: var(--spacing-2);
}

.view-toggle {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-2);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-toggle.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Song cards grid */
.song-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

/* Loading and empty states */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  color: var(--color-text-light);
}

.loading-animation {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.loading-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--color-primary);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-circle:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1.0);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8);
  color: var(--color-text-light);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  color: var(--color-text-lighter);
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-4);
  color: var(--color-error);
}

/* Footer */
.app-footer {
  background-color: var(--color-bg-dark);
  color: var(--color-text-light);
  text-align: center;
  padding: var(--spacing-4);
  margin-top: auto;
}

/* Song count badge */
.songs-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  padding: 0 var(--spacing-2);
  font-size: var(--font-size-sm);
  height: 1.5rem;
  min-width: 1.5rem;
  margin-left: var(--spacing-2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--spacing-4);
  }
  
  .search-container {
    width: 100%;
  }
  
  .app-content {
    padding: var(--spacing-4);
  }
  
  .songs-section,
  .add-song-section {
    padding: var(--spacing-4);
  }
  
  .section-header {
    flex-direction: column;
    gap: var(--spacing-4);
    align-items: center;
  }
}
</style>