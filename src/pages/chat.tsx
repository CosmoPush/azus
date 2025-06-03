import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { ExampleList } from "../components/example-list";
import { ChatInput } from "../components/chat-input";
import { type ChatMessage, type Chat, chatStorage } from "../lib/chat-storage";
import {
  FaCopy,
  FaCheck,
  FaVolumeUp,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { Tooltip } from "../components/ui/tooltip";
import { motion } from "framer-motion";

// TODO: fix scrollIntoView. scroll not every time the message state changes

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(
    null
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentChat) {
      const needsMigration = currentChat.messages.some(
        (msg) => !msg.messageId || (msg.sender === "bot" && !msg.scores)
      );
      if (needsMigration) {
        const updatedMessages = currentChat.messages.map((msg, idx) => ({
          ...msg,
          messageId: msg.messageId || `msg-${currentChat.id}-${idx}`,
          ...(msg.sender === "bot" && {
            scores: msg.scores || {
              pcs: Math.floor(Math.random() * 41) + 60,
              oas: Math.floor(Math.random() * 41) + 60,
              ics: Math.floor(Math.random() * 41) + 60,
            },
            reasoning:
              msg.reasoning ||
              `This response was generated based on the user's input.`,
          }),
        }));
        const updatedChat: Chat = { ...currentChat, messages: updatedMessages };
        console.log("Migrating chat:", updatedChat);
        chatStorage.saveChat(updatedChat);
        setCurrentChat(updatedChat);
        setMessages(updatedMessages);
      }
    }
  }, [currentChat]);

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
      messageId: generateId(),
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
      successMessages[successMessages.length - 1].status = "sent";

      const botMessage: ChatMessage = {
        text: `echo: ${value}`,
        sender: "bot",
      };

      const newChat = chatStorage.addMessage(currentChat.id, botMessage);
      if (!newChat) return;

      const finalChat = {
        ...newChat,
        messages: newChat.messages.map((msg, idx) =>
          idx === successMessages.length - 1 ? { ...msg, status: "sent" } : msg
        ),
      };
      chatStorage.saveChat(finalChat);
      setCurrentChat(finalChat);
      setMessages(finalChat.messages);
      chatStorage.notifyChange();
    }, 1000);
  };

  const retryMessage = (messageToRetry: ChatMessage) => {
    if (!currentChat) return;

    const updatedMessages = currentChat.messages.map((msg) =>
      msg.messageId === messageToRetry.messageId && msg.sender === "user"
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
          msg.messageId === messageToRetry.messageId && msg.sender === "user"
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
        msg.messageId === messageToRetry.messageId && msg.sender === "user"
          ? { ...msg, status: "sent" }
          : msg
      );

      const botMessage: ChatMessage = {
        text: `echo: ${messageToRetry.text}`,
        sender: "bot",
      };

      const chatWithBot = chatStorage.addMessage(currentChat.id, botMessage);
      if (!chatWithBot) return;

      const finalChat = {
        ...chatWithBot,
        messages: chatWithBot.messages.map((msg) =>
          msg.messageId === messageToRetry.messageId && msg.sender === "user"
            ? { ...msg, status: "sent" }
            : msg
        ),
      };
      chatStorage.saveChat(finalChat);
      setCurrentChat(finalChat);
      setMessages(finalChat.messages);
      chatStorage.notifyChange();
    }, 1000);
  };

  const logInteraction = (action: string, messageId?: string) => {
    console.log(`Action: ${action}, Message ID: ${messageId || "N/A"}`);
  };

  const handleReassess = (message: ChatMessage) => {
    if (!currentChat || !message.messageId || message.sender !== "bot") {
      console.error("Reassess failed: No current chat or invalid message", {
        currentChat,
        message,
      });
      return;
    }

    logInteraction("Reassess Answer", message.messageId);

    const messageIndex = currentChat.messages.findIndex(
      (msg) => msg.messageId === message.messageId
    );
    if (messageIndex === -1) return;

    const previousUserMessage = currentChat.messages
      .slice(0, messageIndex)
      .reverse()
      .find((msg) => msg.sender === "user");

    if (!previousUserMessage) {
      console.error("No previous user message found for regeneration");
      return;
    }

    let regenerationCount = 0;
    const regenMatch = message.text.match(/\(Regenerated (\d+) time(?:s)?\)/);
    if (regenMatch) {
      regenerationCount = parseInt(regenMatch[1], 10);
    }

    const updatedMessages = currentChat.messages.slice(0, messageIndex);

    const newScores = message.scores
      ? {
          pcs: Math.min(100, message.scores.pcs + 5),
          oas: Math.min(100, message.scores.oas + 3),
          ics: Math.min(100, message.scores.ics + 4),
        }
      : {
          pcs: 65,
          oas: 65,
          ics: 65,
        };

    const newRegenerationCount = regenerationCount + 1;
    const botMessage: ChatMessage = {
      text: `echo: ${
        previousUserMessage.text
      } (Regenerated ${newRegenerationCount} time${
        newRegenerationCount > 1 ? "s" : ""
      })`,
      sender: "bot",
      messageId: generateId(),
      scores: newScores,
      reasoning: `This response was generated based on the user's input: "${previousUserMessage.text}".`,
    };

    const updatedChat: Chat = {
      ...currentChat,
      messages: [...updatedMessages, botMessage],
    };

    chatStorage.saveChat(updatedChat);
    setCurrentChat(updatedChat);
    setMessages(updatedChat.messages);
    chatStorage.notifyChange();
  };

  const ScoreDisplay: React.FC<{ label: string; value: number }> = ({
    label,
    value,
  }) => {
    const color =
      value >= 80
        ? "text-green-400"
        : value >= 60
        ? "text-yellow-400"
        : "text-red-400";
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/70">{label}</span>
        <span className={`text-xs font-semibold ${color}`}>{value}%</span>
      </div>
    );
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
                <div key={message.messageId || idx}>
                  <div
                    className={`flex flex-col gap-1 ${
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
                      <div className="pl-2 pt-1 text-xs text-white/70 flex items-center gap-2 justify-end">
                        {message.status === "waiting" && "⌛ Waiting..."}
                        {message.status === "sent" && "✅ Sent"}
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
                    {message.sender === "bot" && message.scores && (
                      <div className="pl-2 pt-2 flex flex-col gap-1">
                        <div className="flex gap-4">
                          <ScoreDisplay
                            label="PCS"
                            value={message.scores.pcs}
                          />
                          <ScoreDisplay
                            label="OAS"
                            value={message.scores.oas}
                          />
                          <ScoreDisplay
                            label="ICS"
                            value={message.scores.ics}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {message.sender === "bot" && (
                    <BotTools
                      text={message.text}
                      reasoning={message.reasoning}
                      onExpandReasoning={() => {
                        setExpandedReasoning(
                          expandedReasoning === message.messageId
                            ? null
                            : message.messageId ?? null
                        );
                        logInteraction("Expand Reasoning", message.messageId);
                      }}
                      isReasoningExpanded={
                        expandedReasoning === message.messageId
                      }
                      onReassess={() => handleReassess(message)}
                    />
                  )}
                  {message.sender === "bot" &&
                    message.reasoning &&
                    expandedReasoning === message.messageId && (
                      <motion.div
                        initial={{ opacity: 0, overflow: "hidden" }}
                        animate={{
                          opacity: 1,
                          overflow: "visible",
                        }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-2 ml-2 p-3 rounded-lg bg-white/20 text-white/80 text-sm max-w-[80%]"
                      >
                        {message.reasoning}
                      </motion.div>
                    )}
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

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function BotTools({
  text,
  reasoning,
  onExpandReasoning,
  isReasoningExpanded,
  onReassess,
}: {
  text: string;
  reasoning?: string;
  onExpandReasoning: () => void;
  isReasoningExpanded: boolean;
  onReassess: () => void;
}) {
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
    window.speechSynthesis.speak(utterance);
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
      {reasoning && (
        <Tooltip
          label={isReasoningExpanded ? "Hide Reasoning" : "Show Reasoning"}
        >
          <button
            className="cursor-pointer hover:opacity-80 transition-all"
            onClick={onExpandReasoning}
          >
            <FaInfoCircle className="text-white/80 size-3" />
          </button>
        </Tooltip>
      )}
      <Tooltip label="Reassess Answer">
        <button
          className="cursor-pointer hover:opacity-80 transition-all"
          onClick={onReassess}
        >
          <FaSyncAlt className="text-white/80 size-3" />
        </button>
      </Tooltip>
    </div>
  );
}
