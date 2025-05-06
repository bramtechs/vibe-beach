import { useEffect, useRef, useState } from "react";
import SceneManager from "./three/SceneManager";
import FogDensitySlider from "./components/FogDensitySlider";
import FPSCounter from "./components/FPSCounter";
import BuildDate from "./components/BuildDate";
import SongTitle from "./components/SongTitle";
import { SongChangeEvent } from "./three/Jukebox";

function App() {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isGuiVisible, setIsGuiVisible] = useState(true);
  const [currentSong, setCurrentSong] = useState<string>("");
  const [showSongTitle, setShowSongTitle] = useState(false);

  useEffect(() => {
    const sceneManager = new SceneManager();
    sceneManagerRef.current = sceneManager;

    // Handle window resize
    const handleResize = () => {
      sceneManager.onWindowResize();
    };

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyH") {
        setIsGuiVisible((prev) => !prev);
      }
    };

    // Handle song change events
    const handleSongChange = (event: Event) => {
      const songEvent = event as SongChangeEvent;
      setCurrentSong(songEvent.songTitle);
      setShowSongTitle(true);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("songchange", handleSongChange);

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("songchange", handleSongChange);
      sceneManager.dispose();
    };
  }, []);

  const handleReset = () => {
    sceneManagerRef.current?.resetCamera();
  };

  const handleFogDensityChange = (density: number) => {
    sceneManagerRef.current?.setFogDensity(density);
  };

  return (
    <div className="fixed inset-0 bg-black">
      <canvas id="scene-canvas" className="w-full h-full block" />
      {isGuiVisible && <FPSCounter />}
      {isGuiVisible && (
        <div className="absolute bottom-4 left-4 text-white bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Use WASD to move, mouse to look around</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>SPACE to jump, F to toggle fly mode</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
              <span>T to toggle wireframe mode, H to toggle GUI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Press P to mute/unmute music and N to skip songs</span>
            </div>
            {window.innerWidth > 640 && (
              <div className="flex items-center gap-2 mt-2 text-gray-300">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Q/E for up/down in fly mode</span>
              </div>
            )}
          </div>
        </div>
      )}
      {isGuiVisible && (
        <div className="absolute top-4 right-4 flex flex-col gap-4">
          <BuildDate />
          <a
            href="https://github.com/bramtechs/vibe-beach"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm hover:from-black/80 hover:to-black/60 text-white px-6 py-3 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Fork on GitHub!
          </a>
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm hover:from-black/80 hover:to-black/60 text-white px-6 py-3 rounded-xl shadow-2xl border border-white/10 transition-all duration-300"
          >
            Reset Position
          </button>
          <FogDensitySlider onChange={handleFogDensityChange} />
        </div>
      )}
      <SongTitle title={currentSong} isVisible={showSongTitle} />
    </div>
  );
}

export default App;
