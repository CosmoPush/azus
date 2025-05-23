import { FiSearch, FiPlus, FiX, FiMoreVertical } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { type Chat, chatStorage } from "../lib/chat-storage";
import { ChatContextMenu } from "./chat-context-menu";

export const Sidebar = ({
  isOpen,
  onClose,
  onNewChat,
  currentChatId,
  onSelectChat,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onNewChat?: () => void;
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
}) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 z-30 h-screen w-72 bg-black/90 text-white shadow-2xl p-4 flex flex-col gap-6 md:hidden"
            >
              <SidebarContent
                onClose={onClose}
                isMobile
                onNewChat={onNewChat}
                currentChatId={currentChatId}
                onSelectChat={onSelectChat}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex md:flex-col md:w-80 md:min-h-screen bg-black/90 text-white shadow-xl p-6 pt-10">
        <SidebarContent
          onNewChat={onNewChat}
          currentChatId={currentChatId}
          onSelectChat={onSelectChat}
        />
      </aside>
    </>
  );
};

function SidebarContent({
  onClose,
  isMobile = false,
  onNewChat,
  currentChatId,
  onSelectChat,
}: {
  onClose?: () => void;
  isMobile?: boolean;
  onNewChat?: () => void;
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    chatTitle: string;
    isPermanent?: boolean;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const loadedChats = chatStorage.getChats();
    setChats(loadedChats);

    const unsubscribe = chatStorage.subscribe(() => {
      const updatedChats = chatStorage.getChats();
      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, []);

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleDeleteChat = (chatId: string) => {
    const isCurrentChat = chatId === currentChatId;

    chatStorage.deleteChat(chatId);

    const updatedChats = chatStorage.getChats();
    setChats(updatedChats);

    if (isCurrentChat && onSelectChat) {
      if (updatedChats.length > 0) {
        const mostRecentChat = updatedChats.sort(
          (a, b) => b.createdAt - a.createdAt,
        )[0];
        onSelectChat(mostRecentChat.id);
      } else if (onNewChat) {
        onNewChat();
      }
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    chatStorage.renameChat(chatId, newTitle);
  };

  const handleSaveToLocal = (chatId: string) => {
    const chat = chatStorage.getChat(chatId);
    if (chat) {
      chatStorage.saveChatToLocalStorage(chat);
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
      if (onClose && isMobile) {
        onClose();
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 192);
    const y = Math.min(e.clientY, window.innerHeight - 120);

    setContextMenu({
      chatId: chat.id,
      chatTitle: chat.title,
      isPermanent: chat.isPermanent,
      position: { x, y },
    });
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;

  const todayChats = filteredChats.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === today,
  );

  const yesterdayChats = filteredChats.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === yesterday,
  );

  const olderChats = filteredChats.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) < yesterday,
  );

  return (
    <div className="flex flex-col w-full items-stretch justify-start relative">
      {onClose && isMobile && (
        <button
          className="h-12 w-12 md:hidden bg-white/10 rounded-full p-2 hover:bg-white/20 transition z-40 flex items-center justify-center ml-auto mb-3"
          aria-label="Close menu"
          onClick={onClose}
        >
          <FiX size={22} />
        </button>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold">Chat</h3>
        <button
          className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition"
          aria-label="New Chat"
          title="New Chat"
          onClick={handleNewChat}
        >
          <FiPlus size={20} />
        </button>
      </div>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-white/10 rounded-full px-4 py-2 pr-10 text-white placeholder-white/60 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiSearch className="absolute right-3 top-3 text-white/60" size={18} />
      </div>

      {todayChats.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase text-white/40 mb-2">Today</div>
          <ChatList
            chats={todayChats}
            onContextMenu={handleContextMenu}
            onSelect={handleSelectChat}
            currentChatId={currentChatId}
          />
        </div>
      )}

      {yesterdayChats.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase text-white/40 mb-2">Yesterday</div>
          <ChatList
            chats={yesterdayChats}
            onContextMenu={handleContextMenu}
            onSelect={handleSelectChat}
            currentChatId={currentChatId}
          />
        </div>
      )}

      {olderChats.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase text-white/40 mb-2">Older</div>
          <ChatList
            chats={olderChats}
            onContextMenu={handleContextMenu}
            onSelect={handleSelectChat}
            currentChatId={currentChatId}
          />
        </div>
      )}

      {filteredChats.length === 0 && (
        <div className="text-white/60 text-sm text-center mt-4">
          {searchTerm ? "No chats found" : "No chats yet"}
        </div>
      )}

      {contextMenu && (
        <ChatContextMenu
          chatId={contextMenu.chatId}
          chatTitle={contextMenu.chatTitle}
          isPermanent={contextMenu.isPermanent}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onDelete={handleDeleteChat}
          onRename={handleRenameChat}
          onSaveToLocal={handleSaveToLocal}
        />
      )}
    </div>
  );
}

function ChatList({
  chats,
  onContextMenu,
  onSelect,
  currentChatId,
}: {
  chats: Chat[];
  onContextMenu: (e: React.MouseEvent, chat: Chat) => void;
  onSelect: (chatId: string) => void;
  currentChatId?: string;
}) {
  return (
    <ul className="space-y-1">
      {chats.map((chat) => (
        <li
          key={chat.id}
          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group hover:bg-white/10 transition-colors ${
            chat.id === currentChatId ? "bg-white/10" : ""
          }`}
          onClick={() => onSelect(chat.id)}
        >
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-2 h-2 rounded-full ${chat.isPermanent ? "bg-green-400" : "bg-[#A259FF]"}`}
            />
            <span className="truncate text-sm">{chat.title}</span>
          </div>
          <button
            className="text-white/60 hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, chat);
            }}
            aria-label="Chat options"
          >
            <FiMoreVertical size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
