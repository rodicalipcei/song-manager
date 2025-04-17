// api/songs/[id]/mark-sung.js
import express from 'express';
import dbConnect from '../../utils/dbConnect.js';
import Song from '../../models/Song.js';

const app = express();
app.use(express.json());

// PATCH mark song as sung
app.patch('/api/songs/:id/mark-sung', async (req, res) => {
  try {
    await dbConnect();
    const id = req.params.id || req.query.id;
    
    console.log("Marking song as sung for ID:", id);
    
    // Find and update in one step
    const song = await Song.findByIdAndUpdate(
      id,
      { last_sung: new Date() },
      { new: true, runValidators: true }
    );
    
    // Check if song was found
    if (!song) {
      console.log("Song not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    console.log("Successfully marked song as sung:", song);
    return res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error(`Error marking song as sung:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking song as sung: ' + error.message
    });
  }
});

export default app;