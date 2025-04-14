<!-- src/components/SongTable.vue -->
<template>
  <div class="song-table-container">
    <div v-if="!songs || songs.length === 0" class="no-songs">
      <div class="empty-state">
        <div class="empty-state-icon">🎵</div>
        <p v-if="searchQuery">No songs match your search.</p>
        <p v-else>No songs added yet. Add your first song above!</p>
      </div>
    </div>
    
    <table v-else class="song-table">
      <thead>
        <tr>
          <th class="col-title">Title</th>
          <th class="col-range">Range</th>
          <th class="col-last-sung">Last Sung</th>
          <th class="col-audio">Audio</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="song in songs" :key="song.id" class="song-row">
          <td class="song-title">
            <div class="mobile-label">Title</div>
            {{ song.title }}
          </td>
          <td>
            <div class="mobile-label">Range</div>
            <div class="range-display">
              <span class="range-icon">🎹</span>
              {{ song.musicalRange }}
            </div>
          </td>
          <td>
            <div class="mobile-label">Last Sung</div>
            <div class="last-sung-display">
              <span :class="['last-sung-badge', getLastSungClass(song)]">
                {{ song.formatLastSung() }}
              </span>
            </div>
          </td>
          <td>
            <div class="mobile-label">Audio</div>
            <div v-if="song.getAudioUrl()" class="audio-player">
              <audio controls>
                <source :src="song.getAudioUrl()" type="audio/mpeg">
                Your browser does not support the audio element.
              </audio>
            </div>
            <span v-else class="no-audio">No audio</span>
          </td>
          <td class="song-actions">
            <div class="mobile-label">Actions</div>
            <div class="action-buttons">
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

defineProps<{
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
</script>

<style scoped>
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

.range-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.range-icon {
  color: var(--color-primary);
}

.last-sung-display {
  display: flex;
  align-items: center;
}

.last-sung-badge {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

.no-audio {
  color: var(--color-text-lighter);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

/* Column widths */
.col-title {
  width: 25%;
}

.col-range {
  width: 15%;
}

.col-last-sung {
  width: 15%;
}

.col-audio {
  width: 30%;
}

.col-actions {
  width: 15%;
}

@media (max-width: 768px) {
  .action-buttons {
    justify-content: flex-start;
  }
}
</style>