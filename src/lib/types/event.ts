export interface Event {
  id: string;
  name: string;
  date: number;
  description?: string;
  coverImage: string;
  organizerId: string;
  createdAt: number;
  photoCount: number;
  participantCount: number;
  moderationSettings: {
    enabled: boolean;
    confidence: number;
    categories: string[];
  };
}

export interface Participant {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  photoCount: number;
  role: "organizer" | "participant";
  joinedAt: number;
}

export interface Photo {
  id: string;
  eventId: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: number;
  urls: {
    original: string;
    medium: string;
    thumbnail: string;
  };
  likes: number;
  // Optional metadata
  likedBy?: string[];
  status?: "pending" | "active" | "rejected";
  moderationResult?: {
    checked: boolean;
    labels?: string[];
    confidence?: number;
  };
}

export interface PhotoLike {
  photoId: string;
  userId: string;
  eventId: string;
  createdAt: number;
}
