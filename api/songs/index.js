// api/songs/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbConnect = require('../utils/dbConnect');
const Song = require('../models/Song');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    // Accept audio files only
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed!'), false);
    }
    cb(null, true);
  }
});

const app = express();
app.use(express.json());

// GET all songs
app.get('/api/songs', async (req, res) => {
  try {
    await dbConnect();
    const songs = await Song.find({}).sort({ created_at: -1 });
    
    return res.status(200).json({
      success: true,
      data: songs
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching songs'
    });
  }
});

// POST create a new song
app.post('/api/songs', upload.single('audioFile'), async (req, res) => {
  try {
    await dbConnect();
    
    const { title, musicalRange, lastSung } = req.body;
    
    // Prepare song data
    const songData = {
      title,
      musical_range: musicalRange,
      last_sung: lastSung ? new Date(lastSung) : null,
    };
    
    // If there's an uploaded file, add the path
    if (req.file) {
      songData.audio_path = `/uploads/${req.file.filename}`;
    }
    
    const song = await Song.create(songData);
    
    return res.status(201).json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error('Error creating song:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating song'
    });
  }
});

// Export handler for Vercel serverless deployment
module.exports = app;