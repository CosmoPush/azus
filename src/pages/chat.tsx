import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { ExampleList } from "../components/example-list";
import { ChatInput } from "../components/chat-input";
import { type ChatMessage, type Chat, chatStorage } from "../lib/chat-storage";
import { FaCopy, FaCheck, FaVolumeUp } from "react-icons/fa";
import { Tooltip } from "../components/ui/tooltip";

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    const userMessage: ChatMessage = {
      text: value,
      sender: "user",
      status: "waiting",
    };

    const updatedChat = chatStorage.addMessage(currentChat.id, userMessage);
    if (!updatedChat) return;

    setCurrentChat(updatedChat);
    setMessages(updatedChat.messages);
    chatStorage.notifyChange();

    setTimeout(() => {
      const failed = Math.random() < 0.3;

      if (failed) {
        const failedMessages = [...updatedChat.messages];
        failedMessages[failedMessages.length - 1].status = "failed";
        const failedChat = { ...updatedChat, messages: failedMessages };
        chatStorage.saveChat(failedChat);
        setCurrentChat(failedChat);
        setMessages(failedMessages);
        return;
      }

      const successMessages = [...updatedChat.messages];
      successMessages[successMessages.length - 1].status = "received";

      const botMessage: ChatMessage = {
        text: `echo: ${value}`,
        sender: "bot",
      };

      const newChat = {
        ...updatedChat,
        messages: [...successMessages, botMessage],
      };
      chatStorage.saveChat(newChat);
      setCurrentChat(newChat);
      setMessages(newChat.messages);
    }, 1000);
  };

  const retryMessage = (messageToRetry: ChatMessage) => {
    if (!currentChat) return;

    const updatedMessages = currentChat.messages.map((msg) =>
      msg.text === messageToRetry.text && msg.sender === "user"
        ? { ...msg, status: "waiting" }
        : msg
    );

    const updatedChat: Chat = { ...currentChat, messages: updatedMessages };
    chatStorage.saveChat(updatedChat);
    setCurrentChat(updatedChat);
    setMessages(updatedMessages);

    setTimeout(() => {
      const failed = Math.random() < 0.3;
      if (failed) {
        const failedMessages = updatedMessages.map((msg) =>
          msg.text === messageToRetry.text && msg.sender === "user"
            ? { ...msg, status: "failed" }
            : msg
        );

        const failedChat = { ...updatedChat, messages: failedMessages };
        chatStorage.saveChat(failedChat);
        setCurrentChat(failedChat);
        setMessages(failedMessages);
        return;
      }

      const successMessages = updatedMessages.map((msg) =>
        msg.text === messageToRetry.text && msg.sender === "user"
          ? { ...msg, status: "received" }
          : msg
      );

      const botMessage: ChatMessage = {
        text: `echo: ${messageToRetry.text}`,
        sender: "bot",
      };

      const chatWithBot = {
        ...updatedChat,
        messages: [...successMessages, botMessage],
      };
      chatStorage.saveChat(chatWithBot);
      setCurrentChat(chatWithBot);
      setMessages(chatWithBot.messages);
    }, 1000);
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
                    className={`flex gap-1 flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-[80%] break-words shadow-md text-white text-base md:text-lg ${
                        message.sender === "user" ? "bg-sky-500" : "bg-white/10"
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.sender === "user" && (
                      <div className="pl-2 pt-1 text-xs text-white/70 items-center gap-2 flex justify-end">
                        {message.status === "waiting" && "⌛ Waiting..."}
                        {message.status === "received" && "✅ Sent"}
                        {message.status === "failed" && (
                          <>
                            ❌ Failed
                            <button
                              className="underline text-blue-300 hover:text-blue-100"
                              onClick={() => retryMessage(message)}
                            >
                              Retry
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {message.sender === "bot" && <BotTools text={message.text} />}
                </div>
              ))}
              <div ref={bottomRef} />
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
      <p className="text-white/70 text-xs">📦 Received</p>
      <Tooltip label={copied ? "Copied!" : "Copy text"}>
        <button
          className="cursor-pointer hover:opacity-80 transition-all"
          onClick={handleCopy}
        >
          {copied ? (
            <FaCheck className="text-white/80 size-3" />
          ) : (
            <FaCopy className="text-white/80 size-3" />
          )}
        </button>
      </Tooltip>

      <Tooltip label="Play text">
        <button
          className="cursor-pointer hover:opacity-80 transition-all"
          onClick={handleSpeak}
        >
          <FaVolumeUp className="text-white/80 size-3" />
        </button>
      </Tooltip>
    </div>
  );
}
