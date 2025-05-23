import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { ExampleList } from "../components/example-list";
import { ChatInput } from "../components/chat-input";
import { type ChatMessage, type Chat, chatStorage } from "../lib/chat-storage";

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  useEffect(() => {
    const chats = chatStorage.getChats();

    if (chats.length > 0) {
      const mostRecentChat = chats.sort((a, b) => b.createdAt - a.createdAt)[0];
      setCurrentChat(mostRecentChat);
      setMessages(mostRecentChat.messages);
    } else {
      createNewChat();
    }
  }, []);

  const createNewChat = () => {
    const newChat = chatStorage.createChat();
    setCurrentChat(newChat);
    setMessages([]);

    chatStorage.notifyChange();
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chatStorage.getChat(chatId);
    if (selectedChat) {
      setCurrentChat(selectedChat);
      setMessages(selectedChat.messages);
    } else {
      createNewChat();
    }
  };

  const handleSubmit = (value: string) => {
    if (!currentChat) return;

    const userMessage: ChatMessage = { text: value, sender: "user" };
    const updatedChat = chatStorage.addMessage(currentChat.id, userMessage);

    if (updatedChat) {
      setCurrentChat(updatedChat);
      setMessages(updatedChat.messages);
      chatStorage.notifyChange();
      setTimeout(() => {
        const botMessage: ChatMessage = {
          text: `echo: ${value}`,
          sender: "bot",
        };
        const chatWithBotResponse = chatStorage.addMessage(
          currentChat.id,
          botMessage,
        );

        if (chatWithBotResponse) {
          setCurrentChat(chatWithBotResponse);
          setMessages(chatWithBotResponse.messages);
          chatStorage.notifyChange();
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-[#A259FF] via-[#3B2EFF] to-black flex flex-col md:flex-row">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={createNewChat}
        currentChatId={currentChat?.id}
        onSelectChat={handleSelectChat}
      />
      <div className="flex-1 flex flex-col">
        <Header onBurgerClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4 w-full">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[80%] break-words shadow-md text-white text-base md:text-lg ${
                      message.sender === "user" ? "bg-sky-500" : "bg-white/10"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ExampleList handleSubmit={handleSubmit} />
          )}
        </main>
        <ChatInput handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
