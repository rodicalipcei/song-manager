<!-- src/components/SongForm.vue -->
<template>
  <div class="song-form-container">
    <div class="form-header">
      <h2>{{ isEditing ? 'Edit Song' : 'Add New Song' }}</h2>
      <div v-if="isEditing" class="form-badge">Editing</div>
    </div>
    
    <form @submit.prevent="handleSubmit" class="song-form">
      <div class="form-group">
        <label for="title">Song Title</label>
        <div class="input-wrapper">
          <span class="input-icon">🎵</span>
          <input 
            type="text" 
            id="title" 
            v-model="formData.title" 
            required
            placeholder="Enter song title"
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="musicalRange">Musical Range</label>
        <div class="input-wrapper">
          <span class="input-icon">🎹</span>
          <input 
            type="text" 
            id="musicalRange" 
            v-model="formData.musicalRange" 
            required
            placeholder="e.g., C3-G4"
          />
        </div>
      </div>
      
      <div class="form-group audio-upload">
        <label for="audioFile">
          <span>Audio File (optional)</span>
          <span v-if="audioStatus" class="audio-status">{{ audioStatus }}</span>
        </label>
        
        <div class="file-upload-container">
          <div class="file-upload-button">
            <span class="file-icon">🎧</span>
            <span>{{ fileButtonLabel }}</span>
            <input 
              type="file" 
              id="audioFile" 
              accept="audio/*" 
              @change="handleFileChange"
              class="file-input"
            />
          </div>
          
          <div v-if="audioUrl" class="audio-preview">
            <audio controls>
              <source :src="audioUrl" type="audio/mpeg">
              Your browser does not support audio.
            </audio>
          </div>
          
          <div v-if="formData.audioFile" class="file-info">
            Selected file: {{ formData.audioFile.name }} ({{ formatFileSize(formData.audioFile.size) }})
          </div>
        </div>
      </div>
      
      <div v-if="formError" class="form-error">
        {{ formError }}
      </div>
      
      <div class="form-actions">
        <button type="submit" class="button primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Song') }}
        </button>
        <button 
          v-if="isEditing" 
          type="button" 
          class="button secondary"
          @click="$emit('cancel-edit')"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onUnmounted } from 'vue';
import { Song } from '../models/Song';
import { formatFileSize } from '../utils/fileUtils';

const props = defineProps<{
  isEditing?: boolean;
  songToEdit?: Song | null;
}>();

const emit = defineEmits<{
  'add-song': [song: Song];
  'update-song': [song: Song];
  'cancel-edit': [];
}>();

// Form data
const formData = reactive({
  title: '',
  musicalRange: '',
  audioFile: null as File | null
});

// Form state
const isSubmitting = ref(false);
const formError = ref<string | null>(null);

// Audio state
const audioUrl = ref<string | null>(null);
const audioObjectUrl = ref<string | null>(null); // Track object URL separately
const hasExistingAudio = ref(false);

const audioStatus = computed(() => {
  if (formData.audioFile) return "New file selected ✓";
  if (hasExistingAudio.value) return "Using existing audio ✓";
  return "";
});

const fileButtonLabel = computed(() => {
  if (props.isEditing && hasExistingAudio.value) {
    return formData.audioFile ? "Change File Again" : "Change Audio File";
  }
  return formData.audioFile ? "Change File" : "Choose Audio File";
});

// Clean up object URLs when component is destroyed
onUnmounted(() => {
  if (audioObjectUrl.value) {
    URL.revokeObjectURL(audioObjectUrl.value);
  }
});

// Reset form to initial state
const resetForm = () => {
  formData.title = '';
  formData.musicalRange = '';
  formData.audioFile = null;
  
  // Clean up any object URL
  if (audioObjectUrl.value) {
    URL.revokeObjectURL(audioObjectUrl.value);
    audioObjectUrl.value = null;
  }
  
  audioUrl.value = null;
  hasExistingAudio.value = false;
  formError.value = null;
};

// When songToEdit changes, update the form
watch(() => props.songToEdit, (newSong) => {
  if (newSong) {
    formData.title = newSong.title;
    formData.musicalRange = newSong.musicalRange;
    formData.audioFile = null; // Don't set the file directly
    
    // Get audio URL from the song
    if (newSong.audioPath) {
      audioUrl.value = newSong.getAudioUrl();
      hasExistingAudio.value = true;
    } else {
      audioUrl.value = null;
      hasExistingAudio.value = false;
    }
  } else {
    resetForm();
  }
}, { immediate: true });

// Handle file selection
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      formError.value = "Please select an audio file";
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      formError.value = "File size exceeds maximum limit (10MB)";
      return;
    }
    
    formData.audioFile = file;
    
    // Clean up previous object URL if any
    if (audioObjectUrl.value) {
      URL.revokeObjectURL(audioObjectUrl.value);
    }
    
    // Create new object URL for preview
    audioObjectUrl.value = URL.createObjectURL(file);
    audioUrl.value = audioObjectUrl.value;
    formError.value = null;
  }
};

// Handle form submission
const handleSubmit = async () => {
  try {
    formError.value = null;
    isSubmitting.value = true;
    
    // Basic validation
    if (!formData.title.trim()) {
      formError.value = "Please enter a title";
      isSubmitting.value = false;
      return;
    }
    
    if (!formData.musicalRange.trim()) {
      formError.value = "Please enter a musical range";
      isSubmitting.value = false;
      return;
    }
    
    if (props.isEditing && props.songToEdit) {
      // Update existing song
      const updatedSong = new Song(
        formData.title,
        formData.musicalRange,
        formData.audioFile || props.songToEdit.audioPath, // Keep existing path if no new file
        props.songToEdit.lastSung,
        props.songToEdit.id,
        props.songToEdit.createdAt
      );
      
      emit('update-song', updatedSong);
    } else {
      // Create new song
      const newSong = new Song(
        formData.title,
        formData.musicalRange,
        formData.audioFile
      );
      
      emit('add-song', newSong);
    }
    
    // Reset the form after submission
    resetForm();
  } catch (error) {
    console.error("Error submitting form:", error);
    formError.value = error instanceof Error ? error.message : "An unknown error occurred";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.form-error {
  color: #ef4444;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 0.375rem;
}

.file-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}
</style>