<!-- src/components/SongCard.vue -->
<template>
  <div class="song-card">
    <div class="song-card-content">
      <div class="song-number">{{ number }}</div>
      <div class="song-header">
        <h3 class="song-title">{{ song.title }}</h3>
        <div class="song-badge" :class="getLastSungClass(song)">
          {{ song.lastSung ? song.formatLastSung() : 'Never sung' }}
        </div>
      </div>
      
      <div class="song-details">
        <div class="detail-item range">
          <span class="detail-icon">🎹</span>
          <span class="detail-text">{{ song.musicalRange }}</span>
        </div>
        <div class="detail-item created">
          <span class="detail-icon">✨</span>
          <span class="detail-text">Added {{ formatDate(song.createdAt) }}</span>
        </div>
      </div>
      
      <div v-if="audioUrl" class="audio-player">
        <div class="audio-label">
          <span class="audio-icon">🎧</span>
          <span>Practice Audio</span>
        </div>
        <audio controls>
          <source :src="audioUrl" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      </div>
      
      <div class="song-actions">
        <button 
          class="icon-button mark-sung" 
          @click="$emit('mark-sung', song.id)"
          title="Mark as Sung Today"
        >
          <span class="action-icon">📅</span>
          <span class="action-text">Sung</span>
        </button>
        <button 
          class="icon-button edit" 
          @click="$emit('edit-song', song.id)"
          title="Edit Song"
        >
          <span class="action-icon">✏️</span>
          <span class="action-text">Edit</span>
        </button>
        <button 
          class="icon-button remove" 
          @click="$emit('remove-song', song.id)"
          title="Remove Song"
        >
          <span class="action-icon">🗑️</span>
          <span class="action-text">Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Song } from '../models/Song';

const props = defineProps<{
  song: Song;
  number: number;  // Added number prop
}>();

defineEmits<{
  'mark-sung': [id: string];
  'edit-song': [id: string];
  'remove-song': [id: string];
}>();

// Get the correct audio URL, handling both API paths and local files
const audioUrl = computed(() => {
  if (!props.song) return null;
  
  // Use the getAudioUrl method if it exists
  if (props.song.getAudioUrl && typeof props.song.getAudioUrl === 'function') {
    return props.song.getAudioUrl();
  }
  
  // Fallback to audioPath directly
  return props.song.audioPath || null;
});

const getLastSungClass = (song: Song): string => {
  if (!song.lastSung) return 'never-sung';
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - song.lastSung.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'recently-sung';
  if (diffDays <= 30) return 'moderately-sung';
  return 'long-ago-sung';
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return 'today';
  if (diffDays <= 2) return 'yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};
</script>

<style scoped>
.song-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  height: 100%;
  position: relative;
}

.song-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.song-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-6);
}

.song-number {
  position: absolute;
  top: var(--spacing-3);
  left: var(--spacing-3);
  background-color: var(--color-primary);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-sm);
}

.song-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
  margin-left: var(--spacing-6);
}

.song-title {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-dark);
  flex: 1;
}

.song-badge {
  font-size: var(--font-size-sm);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  font-weight: 500;
  white-space: nowrap;
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

.song-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
}

.detail-icon {
  font-size: 1.2em;
}

.audio-player {
  margin-top: auto;
  margin-bottom: var(--spacing-4);
  background-color: rgba(243, 244, 246, 0.5);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
}

.audio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-dark);
}

.audio-icon {
  color: var(--color-primary);
}

audio {
  width: 100%;
  height: 36px;
  border-radius: var(--radius-md);
}

.song-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-4);
}

.icon-button {
  flex: 1;
  background-color: rgba(243, 244, 246, 0.5);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.action-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
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

@media (max-width: 768px) {
  .action-text {
    display: none;
  }
  
  .icon-button {
    padding: var(--spacing-2);
  }
  
  .song-card-content {
    padding: var(--spacing-4);
  }
  
  .song-number {
    top: var(--spacing-2);
    left: var(--spacing-2);
    width: 24px;
    height: 24px;
    font-size: calc(var(--font-size-sm) - 1px);
  }
  
  .song-header {
    margin-left: var(--spacing-4);
  }
}

@media (prefers-color-scheme: dark) {
  .audio-player {
    background-color: rgba(31, 41, 55, 0.5);
  }
  
  .icon-button {
    background-color: rgba(31, 41, 55, 0.5);
  }
}
</style>