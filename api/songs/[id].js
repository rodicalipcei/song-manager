// api/songs/[id].js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbConnect = require('../utils/dbConnect');
const Song = require('../models/Song');
const { v4: uuidv4 } = require('uuid');

// Configure multer just like in index.js
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed!'), false);
    }
    cb(null, true);
  }
});

const app = express();
app.use(express.json());

// GET a single song by ID
app.get('/api/songs/:id', async (req, res) => {
  try {
    await dbConnect();
    
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error(`Error fetching song ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching song'
    });
  }
});

// PUT update a song
app.put('/api/songs/:id', upload.single('audioFile'), async (req, res) => {
  try {
    await dbConnect();
    
    const { title, musicalRange, lastSung } = req.body;
    
    // Find the song first
    const existingSong = await Song.findById(req.params.id);
    
    if (!existingSong) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    // Prepare update data
    const updateData = {
      title,
      musical_range: musicalRange,
      last_sung: lastSung ? new Date(lastSung) : existingSong.last_sung,
    };
    
    // If there's a new file, update the path and delete old file if exists
    if (req.file) {
      // Delete old file if it exists
      if (existingSong.audio_path) {
        const oldFilePath = path.join(process.cwd(), 'public', existingSong.audio_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Set new path
      updateData.audio_path = `/uploads/${req.file.filename}`;
    }
    
    // Update song
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error(`Error updating song ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating song'
    });
  }
});

// DELETE a song
app.delete('/api/songs/:id', async (req, res) => {
  try {
    await dbConnect();
    
    // Find the song first to get the file path
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    // Delete the audio file if it exists
    if (song.audio_path) {
      const filePath = path.join(process.cwd(), 'public', song.audio_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the song from database
    await Song.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error(`Error deleting song ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting song'
    });
  }
});

module.exports = app;