import avatar from "../assets/avatar.png";

export const Header = ({ onBurgerClick }: { onBurgerClick?: () => void }) => {
  return (
    <header className="w-full flex justify-between items-center gap-4 px-6 pt-6 md:pt-10 md:px-12 text-white">
      <h2 className="text-2xl font-bold">AZUS</h2>

      <div className="flex items-center gap-3 rounded-full px-4 py-2 shadow-lg">
        <img
          src={avatar}
          alt="user-avatar"
          className="w-10 h-10 md:w-16 md:h-16 rounded-full"
        />
        <div className="text-sm md:text-xl font-medium">
          <span>Good Evening, </span>
          <span className="font-bold ">Chris</span>
        </div>
      </div>
      <button
        className="md:hidden flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        aria-label="Open menu"
        onClick={onBurgerClick}
      >
        <svg
          width="28"
          height="28"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </header>
  );
};
