import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CallRoom from "./pages/CallRoom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/call/:roomId" element={<CallRoom />} />
      </Routes>
    </BrowserRouter>
  );
}