import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home";

function NotFound() {
  return (
    <div className="h-screen overflow-hidden grid place-items-center text-center px-6">
      <div>
        <p className="font-display text-7xl text-spot">404</p>
        <h1 className="font-display text-3xl mt-4">This date didn't show up.</h1>
        <p className="text-mute mt-2">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-block mt-8 rounded-full bg-spot px-8 py-3 font-semibold text-black hover:scale-105 transition"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}