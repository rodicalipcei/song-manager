<!-- src/components/SongTable.vue -->
<template>
  <div class="song-table-container">
    <table class="song-table">
      <thead>
        <tr>
          <th class="number-column">#</th>
          <th class="title-column">Title</th>
          <th class="range-column">Range</th>
          <th class="last-sung-column">Last Sung</th>
          <th class="audio-column">Audio</th>
          <th class="actions-column">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="songs.length === 0">
          <td colspan="6" class="empty-message">
            <div class="empty-state">
              <div class="empty-state-icon">🎵</div>
              <p v-if="searchQuery">No songs match your search.</p>
              <p v-else>No songs added yet. Add your first song above!</p>
            </div>
          </td>
        </tr>
        <tr v-for="(song, index) in songs" :key="song.id">
          <td class="number-column">{{ index + 1 }}</td>
          <td class="title-column">{{ song.title }}</td>
          <td class="range-column">
            <span class="range-icon">🎹</span>
            <span>{{ song.musicalRange }}</span>
          </td>
          <td class="last-sung-column">
            <span class="last-sung-badge" :class="getLastSungClass(song)">
              {{ song.lastSung ? song.formatLastSung() : 'Never' }}
            </span>
          </td>
          <td class="audio-column">
            <audio v-if="song.audioPath || song.audioFile" controls class="audio-player">
              <source :src="getAudioUrl(song)" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <span v-else class="no-audio">No audio</span>
          </td>
          <td class="actions-column">
            <div class="actions-container">
              <button 
                class="icon-button mark-sung" 
                @click="$emit('mark-sung', song.id)"
                title="Mark as Sung Today"
              >
                <span class="action-icon">📅</span>
              </button>
              <button 
                class="icon-button edit" 
                @click="$emit('edit-song', song.id)"
                title="Edit Song"
              >
                <span class="action-icon">✏️</span>
              </button>
              <button 
                class="icon-button remove" 
                @click="$emit('remove-song', song.id)"
                title="Remove Song"
              >
                <span class="action-icon">🗑️</span>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Song } from '../models/Song';

const props = defineProps<{
  songs: Song[];
  searchQuery?: string;
}>();

defineEmits<{
  'mark-sung': [id: string];
  'edit-song': [id: string];
  'remove-song': [id: string];
}>();

const getLastSungClass = (song: Song): string => {
  if (!song.lastSung) return 'never-sung';
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - song.lastSung.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'recently-sung';
  if (diffDays <= 30) return 'moderately-sung';
  return 'long-ago-sung';
};

const getAudioUrl = (song: Song): string | null => {
  if (song.audioFile instanceof File) {
    return URL.createObjectURL(song.audioFile);
  }
  return song.audioPath || null;
};
</script>

<style scoped>
.song-table-container {
  overflow-x: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.song-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  margin-bottom: var(--spacing-6);
}

.song-table th,
.song-table td {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.song-table th {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-text-dark);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--font-size-xs);
  letter-spacing: 0.05em;
}

.song-table tr:last-child td {
  border-bottom: none;
}

.song-table tr:hover td {
  background-color: rgba(var(--color-primary-rgb), 0.05);
}

.number-column {
  width: 50px;
  text-align: center;
  font-weight: bold;
  color: var(--color-primary);
}

.title-column {
  min-width: 200px;
  font-weight: 500;
}

.range-column {
  width: 150px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.range-icon {
  color: var(--color-text-light);
}

.last-sung-column {
  width: 150px;
}

.audio-column {
  width: 200px;
}

.actions-column {
  width: 150px;
}

.actions-container {
  display: flex;
  gap: var(--spacing-2);
}

.icon-button {
  background-color: transparent;
  border: none;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button.mark-sung:hover {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.icon-button.edit:hover {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-info);
}

.icon-button.remove:hover {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.last-sung-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.never-sung {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.recently-sung {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.moderately-sung {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
}

.long-ago-sung {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.no-audio {
  color: var(--color-text-lighter);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.audio-player {
  max-width: 100%;
  height: 30px;
}

.empty-message {
  text-align: center;
  padding: var(--spacing-8) !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-4);
  color: var(--color-text-lighter);
}

@media (max-width: 768px) {
  .song-table th,
  .song-table td {
    padding: var(--spacing-2);
  }
  
  .range-column,
  .last-sung-column,
  .audio-column {
    display: none;
  }
  
  .actions-column {
    width: 100px;
  }
}
</style>