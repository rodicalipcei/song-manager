<!-- src/components/SongTable.vue -->
<template>
  <div class="song-table-container">
    <div v-if="!songs || songs.length === 0" class="no-songs">
      <p v-if="searchQuery">No songs match your search.</p>
      <p v-else>No songs added yet. Add your first song above!</p>
    </div>
    
    <table v-else class="song-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Range</th>
          <th>Last Sung</th>
          <th>Audio</th>
          <th>Actions</th>
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
            {{ song.musicalRange }}
          </td>
          <td>
            <div class="mobile-label">Last Sung</div>
            <span :class="getLastSungClass(song)">{{ song.formatLastSung() }}</span>
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
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
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