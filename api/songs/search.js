// api/songs/search.js
import express from 'express';
import dbConnect from '../utils/dbConnect.js';
import Song from '../models/Song.js';

const app = express();
app.use(express.json());

// GET search songs
app.get('/api/songs/search', async (req, res) => {
  try {
    await dbConnect();
    
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search for songs matching title or musical range
    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { musical_range: { $regex: q, $options: 'i' } }
      ]
    }).sort({ created_at: -1 });
    
    return res.status(200).json({
      success: true,
      data: songs
    });
  } catch (error) {
    console.error('Error searching songs:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while searching songs'
    });
  }
});

export default app;