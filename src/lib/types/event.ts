export interface Event {
  id: string;
  name: string;
  date: number;
  endDate: number;
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
  emailsSentAt?: number;
  status: "active" | "completed";
  archivePath?: string;
  archiveLastUpdated: string;
  archivePhotoCount?: number;
}

export interface User {
  id: string;
  updatedAt: number;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface EventParticipant {
  userId: string;
  displayName: string | null;
  email?: string | null;
  photoURL: string | null;
  photoCount: number;
  role: "organizer" | "participant";
  joinedAt: number;
}

export interface Photo {
  id: string;
  eventId: string;
  uploaderId: string | null;
  createdAt: number;
  urls: {
    original: string;
    medium: string;
    thumbnail: string;
  };
  likes: {
    count: number;
    userIds: string[];
  };
  status?: "pending" | "active" | "rejected";
  moderationResult?: {
    flagged: boolean;
    labels?: string[];
    confidences?: number[];
  };
  approvedBy?: string | null;
  approvedAt?: number | null;
}
