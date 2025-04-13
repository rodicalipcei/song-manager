// src/models/Song.ts
export class Song {
  id: string;
  title: string;
  musicalRange: string;
  audioFile: File | null;
  audioPath: string | null;
  lastSung: Date | null;
  createdAt: Date;
  // Track if this is a newly uploaded file or an existing path
  private isLocalAudioFile: boolean;

  constructor(
    title: string,
    musicalRange: string,
    audioPathOrFile: string | File | null = null,
    lastSung: Date | null = null,
    id: string = crypto.randomUUID(),
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.title = title;
    this.musicalRange = musicalRange;
    this.isLocalAudioFile = false;
    
    // Handle both File objects and string paths
    if (audioPathOrFile instanceof File) {
      this.audioFile = audioPathOrFile;
      this.audioPath = null; // Will be set by the server after upload
      this.isLocalAudioFile = true;
      console.log(`Created Song with local File: ${audioPathOrFile.name} (${audioPathOrFile.size} bytes)`);
    } else if (typeof audioPathOrFile === 'string' && audioPathOrFile) {
      this.audioFile = null;
      this.audioPath = audioPathOrFile;
      console.log(`Created Song with server path: ${audioPathOrFile}`);
    } else {
      this.audioFile = null;
      this.audioPath = null;
      console.log('Created Song with no audio');
    }
    
    this.lastSung = lastSung;
    this.createdAt = createdAt;
  }

  updateLastSung(): void {
    this.lastSung = new Date();
  }

  formatLastSung(): string {
    if (!this.lastSung) return 'Never';
    
    // Format as relative time if within the last month
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastSung.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return this.lastSung.toLocaleDateString();
    }
  }
  
  // Get days since last sung
  daysSinceLastSung(): number | null {
    if (!this.lastSung) return null;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastSung.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // For display priority (never sung or sung long ago should be at top)
  getSungPriority(): number {
    const days = this.daysSinceLastSung();
    if (days === null) return 1000; // Never sung gets highest priority
    return days; // Higher number of days = higher priority
  }
  
  // Get the full audio URL
  getAudioUrl(): string | null {
    console.log("getAudioUrl called for song:", this.title);
    console.log("audioPath value:", this.audioPath);
    
    if (this.audioFile instanceof File) {
      console.log("Using File object URL");
      return URL.createObjectURL(this.audioFile);
    }
    
    if (this.audioPath) {
      // For deployment on Vercel, use relative paths
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';
      const fullUrl = `${baseUrl}${this.audioPath}`;
      console.log("Returning full URL:", fullUrl);
      return fullUrl;
    }
    
    console.log("No audio path available");
    return null;
  }
  
  // For debugging: print all details of this song
  debugInfo(): string {
    return `Song(id=${this.id}, title="${this.title}", musicalRange="${this.musicalRange}", 
      audioFile=${this.audioFile ? this.audioFile.name : 'null'}, 
      audioPath=${this.audioPath}, 
      lastSung=${this.lastSung}, 
      isLocalAudioFile=${this.isLocalAudioFile})`;
  }
}