import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { ExampleList } from "../components/example-list";
import { ChatInput } from "../components/chat-input";
import { type ChatMessage, type Chat, chatStorage } from "../lib/chat-storage";
import { FaCopy, FaCheck, FaVolumeUp } from "react-icons/fa";
import { Tooltip } from "../components/tooltip";

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
          botMessage
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
    <div className="h-screen w-screen bg-gradient-to-b from-[#A259FF] via-[#3B2EFF] to-black flex flex-col md:flex-row">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={createNewChat}
        currentChatId={currentChat?.id}
        onSelectChat={handleSelectChat}
      />
      <div className="flex-1 flex flex-col">
        <Header onBurgerClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full overflow-y-auto">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-8 w-full">
              {messages.map((message, idx) => (
                <div key={idx}>
                  <div
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-[80%] break-words shadow-md text-white text-base md:text-lg ${
                        message.sender === "user" ? "bg-sky-500" : "bg-white/10"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                  {message.sender === "bot" && <BotTools text={message.text} />}
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

function BotTools({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 5000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleSpeak = () => {
    if (window.speechSynthesis.speaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center gap-2 pt-2 pl-2">
      <Tooltip label={copied ? "Copied!" : "Copy text"}>
        <button
          className="cursor-pointer hover:opacity-80 transition-all"
          onClick={handleCopy}
        >
          {copied ? (
            <FaCheck className="text-white/80" />
          ) : (
            <FaCopy className="text-white/80" />
          )}
        </button>
      </Tooltip>

      <Tooltip label="Play text">
        <button
          className="cursor-pointer hover:opacity-80 transition-all"
          onClick={handleSpeak}
        >
          <FaVolumeUp className="text-white/80" />
        </button>
      </Tooltip>
    </div>
  );
}
