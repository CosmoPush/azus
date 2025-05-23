import React from "react";
import { motion } from "framer-motion";

interface ExampleList {
  handleSubmit: (value: string) => void;
}

const examples = [
  "I have error code 404 on the Netflix Profile HBC",
  'iPhone stuck on "Preparing Update" screen',
  "Blue screen on startup",
];

export const ExampleList: React.FC<ExampleList> = ({ handleSubmit }) => {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto px-2 md:gap-4">
      <div className="text-white/80 text-center text-sm md:text-lg mb-1 md:mb-2">
        Try one of these examples
      </div>

      {examples.slice(0, 2).map((example, idx) => (
        <motion.button
          key={idx}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => handleSubmit(example)}
          className="bg-white/10 text-white rounded-lg px-2 py-2 w-full text-xs md:text-base hover:bg-white/20 transition"
        >
          {example}
        </motion.button>
      ))}

      <div className="flex w-full gap-1 md:gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => handleSubmit(examples[2])}
          className="bg-white/10 text-white rounded-lg px-2 py-2 flex-1 text-xs md:text-base hover:bg-white/20 transition"
        >
          {examples[2]}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => alert("Show more examples...")}
          className="bg-sky-400 text-white rounded-lg px-2 py-2 flex-none text-xs md:text-base hover:bg-sky-500 transition"
        >
          See More
        </motion.button>
      </div>
    </div>
  );
};
