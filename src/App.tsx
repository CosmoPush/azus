import { Routes, Route } from "react-router-dom";
import { StartPage } from "./pages/start.tsx";
import { ChatPage } from "./pages/chat.tsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;
