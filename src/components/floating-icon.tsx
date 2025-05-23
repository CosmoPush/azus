import { motion } from "framer-motion";

export function FloatingIcon({
  text,
  style,
}: {
  text: string;
  style: React.CSSProperties;
}) {
  return (
    <motion.div
      className="absolute text-white text-3xl select-none"
      style={style}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      {text}
    </motion.div>
  );
}
