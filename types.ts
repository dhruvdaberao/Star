export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  blockedUsers: string[]; // Array of user IDs
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: { id: string }[];
  messages: Message[];
  lastMessage: string;
}

export interface TribeMessage {
  id: string;
  sender: User;
  text: string;
  timestamp: string;
}

export interface Tribe {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string;
  owner: string; // User ID
  members: string[]; // Array of user IDs
  messages: TribeMessage[];
}
