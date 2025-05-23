import React, { useState } from "react";
import { TbSend } from "react-icons/tb";
import { motion } from "framer-motion";

interface ChatInputProps {
  handleSubmit: (value: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ handleSubmit }) => {
  const [field, setField] = useState<string>("");

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setField(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (field.trim()) {
        handleSubmit(field);
        setField("");
      }
    }
  };

  const handleButtonClick = () => {
    if (field.trim()) {
      handleSubmit(field);
      setField("");
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full md:w-11/12 min-h-16 bg-zinc-900 md:my-4 mx-auto flex items-center justify-center p-3 px-4 gap-3 rounded-xl"
    >
      <div className="w-full bg-black rounded-full py-2 px-4 flex items-center justify-between border border-transparent hover:border-[#A259FF] focus-within:border-[#A259FF] transition-colors">
        <textarea
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={field}
          rows={1}
          placeholder="Enter message"
          className="resize-none w-full outline-none text-white bg-transparent max-h-32 overflow-auto text-sm md:text-base"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleButtonClick}
          className="bg-[#3B2EFF] p-2 rounded-full cursor-pointer"
        >
          <TbSend color="white" className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
