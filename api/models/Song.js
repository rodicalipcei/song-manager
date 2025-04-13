// api/models/Song.js
const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a song title'],
    trim: true
  },
  musical_range: {
    type: String,
    required: [true, 'Please provide the musical range'],
    trim: true
  },
  audio_path: {
    type: String,
    default: null
  },
  last_sung: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Check if the model is already defined to prevent overwriting
module.exports = mongoose.models.Song || mongoose.model('Song', SongSchema);