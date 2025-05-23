import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { FloatingIcon } from "../components/floating-icon.tsx";

export function StartPage() {
  const navigate = useNavigate();
  const [clicked, setClicked] = useState(false);

  const handleStart = () => {
    setClicked(true);
    setTimeout(() => navigate("/chat"), 2000);
  };

  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-gradient-to-b from-[#A259FF] via-[#3B2EFF] to-black flex items-center justify-center">
      <FloatingIcon style={{ top: "10%", left: "5%" }} text="⏳" />
      <FloatingIcon style={{ top: "25%", right: "10%" }} text="🤖" />
      <FloatingIcon style={{ bottom: "15%", left: "20%" }} text="🧠" />
      <FloatingIcon style={{ bottom: "10%", right: "15%" }} text="📡" />

      <motion.button
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        disabled={clicked}
        className="text-white bg-[#3B2EFF] px-8 py-4 rounded-full text-2xl shadow-xl z-10 flex items-center gap-3"
      >
        {clicked ? (
          <>
            <span className="loader animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
            Creating your journey...
          </>
        ) : (
          "Start your journey"
        )}
      </motion.button>
    </div>
  );
}
