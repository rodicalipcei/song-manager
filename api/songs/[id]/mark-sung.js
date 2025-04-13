// api/songs/[id]/mark-sung.js
const express = require('express');
const dbConnect = require('../../utils/dbConnect');
const Song = require('../../models/Song');

const app = express();
app.use(express.json());

// PATCH mark song as sung
app.patch('/api/songs/:id/mark-sung', async (req, res) => {
  try {
    await dbConnect();
    
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { last_sung: new Date() },
      { new: true, runValidators: true }
    );
    
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
    console.error(`Error marking song ${req.params.id} as sung:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking song as sung'
    });
  }
});

module.exports = app;