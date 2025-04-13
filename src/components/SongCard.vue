<!-- src/components/SongCard.vue -->
<template>
  <div class="song-card">
    <div class="song-card-content">
      <div class="song-info">
        <h3 class="song-title">{{ song.title }}</h3>
        <div class="song-details">
          <div class="detail-item range">
            <span class="detail-icon">🎹</span>
            <span class="detail-text">{{ song.musicalRange }}</span>
          </div>
          <div class="detail-item last-sung">
            <span class="detail-icon">📅</span>
            <span class="detail-text">{{ song.formatLastSung() }}</span>
          </div>
        </div>
      </div>
      
      <div class="song-controls">
        <div v-if="audioUrl && audioUrl !== null" class="audio-player">
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
            📅
          </button>
          <button 
            class="icon-button edit" 
            @click="$emit('edit-song', song.id)"
            title="Edit Song"
          >
            ✏️
          </button>
          <button 
            class="icon-button remove" 
            @click="$emit('remove-song', song.id)"
            title="Remove Song"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import { Song } from '../models/Song';

const props = defineProps<{
  song: Song;
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
</script>