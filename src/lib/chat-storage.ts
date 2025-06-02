export interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  status?: string; // waiting | received | failed
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  isPermanent?: boolean;
}

const STORAGE_CHANGE_EVENT = "chat-storage-change";

const SESSION_STORAGE_KEY = "chat-sessions";
const LOCAL_STORAGE_KEY = "chat-sessions-permanent";

export const chatStorage = {
  getChats: (): Chat[] => {
    if (typeof window === "undefined") return [];

    const sessionChats = chatStorage.getSessionChats();
    const localChats = chatStorage.getLocalChats();

    return [...sessionChats, ...localChats].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },

  getSessionChats: (): Chat[] => {
    if (typeof window === "undefined") return [];

    const storedChats = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedChats) return [];

    try {
      return JSON.parse(storedChats);
    } catch (error) {
      console.error("Failed to parse chats from session storage", error);
      return [];
    }
  },

  getLocalChats: (): Chat[] => {
    if (typeof window === "undefined") return [];

    const storedChats = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedChats) return [];

    try {
      return JSON.parse(storedChats).map((chat: Chat) => ({
        ...chat,
        isPermanent: true,
      }));
    } catch (error) {
      console.error("Failed to parse chats from local storage", error);
      return [];
    }
  },

  getChat: (id: string): Chat | undefined => {
    const chats = chatStorage.getChats();
    return chats.find((chat) => chat.id === id);
  },

  saveChat: (chat: Chat): void => {
    if (typeof window === "undefined") return;

    if (chat.isPermanent) {
      chatStorage.saveChatToLocalStorage(chat);
    } else {
      const chats = chatStorage.getSessionChats();
      const existingIndex = chats.findIndex((c) => c.id === chat.id);

      if (existingIndex >= 0) {
        chats[existingIndex] = chat;
      } else {
        chats.push(chat);
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(chats));
    }

    chatStorage.notifyChange();
  },

  saveChatToLocalStorage: (chat: Chat): void => {
    if (typeof window === "undefined") return;

    const sessionChats = chatStorage.getSessionChats();
    const filteredSessionChats = sessionChats.filter((c) => c.id !== chat.id);
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(filteredSessionChats),
    );

    const localChats = chatStorage.getLocalChats();
    const chatToSave = { ...chat, isPermanent: true };
    const existingIndex = localChats.findIndex((c) => c.id === chat.id);

    if (existingIndex >= 0) {
      localChats[existingIndex] = chatToSave;
    } else {
      localChats.push(chatToSave);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localChats));
    chatStorage.notifyChange();
  },

  createChat: (title = "New Chat"): Chat => {
    const newChat: Chat = {
      id: generateId(),
      title,
      messages: [],
      createdAt: Date.now(),
      isPermanent: false,
    };

    chatStorage.saveChat(newChat);
    return newChat;
  },

  deleteChat: (id: string): void => {
    if (typeof window === "undefined") return;

    const chat = chatStorage.getChat(id);
    if (!chat) return;

    if (chat.isPermanent) {
      const localChats = chatStorage.getLocalChats();
      const filteredLocalChats = localChats.filter((c) => c.id !== id);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(filteredLocalChats),
      );
    } else {
      const sessionChats = chatStorage.getSessionChats();
      const filteredSessionChats = sessionChats.filter((c) => c.id !== id);
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(filteredSessionChats),
      );
    }

    chatStorage.notifyChange();
  },

  renameChat: (id: string, newTitle: string): Chat | undefined => {
    const chat = chatStorage.getChat(id);
    if (!chat) return undefined;

    const updatedChat = {
      ...chat,
      title: newTitle,
    };

    chatStorage.saveChat(updatedChat);
    return updatedChat;
  },

  addMessage: (chatId: string, message: ChatMessage): Chat | undefined => {
    const chat = chatStorage.getChat(chatId);
    if (!chat) return undefined;

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, message],
      title:
        chat.title === "New Chat" &&
        message.sender === "user" &&
        chat.messages.length === 0
          ? message.text.slice(0, 20) + (message.text.length > 20 ? "..." : "")
          : chat.title,
    };

    chatStorage.saveChat(updatedChat);
    return updatedChat;
  },

  notifyChange: (): void => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
  },

  subscribe: (callback: () => void): (() => void) => {
    if (typeof window === "undefined") return () => {};

    const handler = () => callback();
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);

    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  },
};

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
