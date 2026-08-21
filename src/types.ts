export interface Task {
  id: string;
  label: string;
  completed: boolean;
  category: "physical" | "intellectual" | "spiritual";
  rationale?: string; // AI explanation for *why* this is needed
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
  attachments?: {
    name: string;
    type: "image" | "doc";
    mimeType: string;
    content: string;
  }[];
}

export interface UserState {
  name: string;
  goal: string;
  integrity: number; // 0-100
  image_url: string; // URL to the generation
}
