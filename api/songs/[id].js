// api/songs/[id].js - Fixed to handle delete and update properly
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dbConnect from '../utils/dbConnect.js';
import Song from '../models/Song.js';
import { v4 as uuidv4 } from 'uuid';

// Get current directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer
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
    console.log("GET song with ID:", req.params.id);
    
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      console.log("Song not found with ID:", req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    console.log("Found song:", song);
    return res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error(`Error fetching song ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching song: ' + error.message
    });
  }
});

// PUT update a song
app.put('/api/songs/:id', upload.single('audioFile'), async (req, res) => {
  try {
    await dbConnect();
    console.log("PUT update song with ID:", req.params.id);
    console.log("Body:", req.body);
    
    const { title, musicalRange, lastSung } = req.body;
    
    // Find the song first
    const existingSong = await Song.findById(req.params.id);
    
    if (!existingSong) {
      console.log("Song not found with ID:", req.params.id);
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
      console.log("New file uploaded:", req.file.filename);
      
      // Delete old file if it exists
      if (existingSong.audio_path) {
        const oldFilePath = path.join(process.cwd(), 'public', existingSong.audio_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log("Deleted old file:", existingSong.audio_path);
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
    
    console.log("Updated song:", song);
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
    console.log("DELETE song with ID:", req.params.id);
    
    // Find the song first to get the file path
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      console.log("Song not found with ID:", req.params.id);
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
        console.log("Deleted audio file:", song.audio_path);
      }
    }
    
    // Delete the song from database
    await Song.findByIdAndDelete(req.params.id);
    
    console.log("Successfully deleted song with ID:", req.params.id);
    return res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error(`Error deleting song ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting song: ' + error.message
    });
  }
});

export default app;