import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiTrash2, FiSave } from "react-icons/fi";

interface ChatContextMenuProps {
  chatId: string;
  chatTitle: string;
  isPermanent?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, newTitle: string) => void;
  onSaveToLocal: (chatId: string) => void;
}

export function ChatContextMenu({
  chatId,
  chatTitle,
  isPermanent,
  position,
  onClose,
  onDelete,
  onRename,
  onSaveToLocal,
}: ChatContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chatTitle);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (isRenaming) {
      if (newTitle.trim()) {
        onRename(chatId, newTitle.trim());
      }
      setIsRenaming(false);
    } else {
      setIsRenaming(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (newTitle.trim()) {
        onRename(chatId, newTitle.trim());
      }
      setIsRenaming(false);
    } else if (e.key === "Escape") {
      setNewTitle(chatTitle);
      setIsRenaming(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-zinc-800 rounded-md shadow-lg py-1 w-48"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {isRenaming ? (
        <div className="px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#A259FF]"
            placeholder="Enter chat name"
          />
        </div>
      ) : (
        <>
          <button
            onClick={handleRename}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            <FiEdit2 size={16} />
            Rename
          </button>
          {!isPermanent && (
            <button
              onClick={() => {
                onSaveToLocal(chatId);
                onClose();
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              <FiSave size={16} />
              Save permanently
            </button>
          )}
          <button
            onClick={() => {
              onDelete(chatId);
              onClose();
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 text-red-400"
          >
            <FiTrash2 size={16} />
            Delete
          </button>
        </>
      )}
    </div>
  );
}
