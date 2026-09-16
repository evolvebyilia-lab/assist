export type AvatarState = 'IDLE' | 'LISTENING' | 'THINKING' | 'ACTING' | 'SUCCESS' | 'ERROR';

export type HelperState = 'IDLE' | 'FLYING_TO_TARGET' | 'INTERACTING' | 'RETURNING';

export type TargetWidget = 'calendar' | 'tasks' | 'notes' | null;

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'work' | 'personal' | 'health' | 'study';
}

export interface TaskItem {
  id: string;
  title: string;
  due_time: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface NoteCard {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: string;
  targetWidget?: TargetWidget;
}

export interface AssistantApiResponse {
  spokenResponse: string;
  action: string;
  targetWidget?: TargetWidget;
  payload?: {
    calendarEvent?: {
      title: string;
      date?: string;
      time?: string;
      category?: 'work' | 'personal' | 'health' | 'study';
    };
    task?: {
      title: string;
      due_time?: string;
      priority?: 'high' | 'medium' | 'low';
    };
    note?: {
      title: string;
      content: string;
      category?: string;
    };
  };
  mood?: string;
}
