import { useEffect, useRef, useState } from "react";
import SceneManager from "./three/SceneManager";
import FogDensitySlider from "./components/FogDensitySlider";
import FPSCounter from "./components/FPSCounter";

function App() {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isGuiVisible, setIsGuiVisible] = useState(true);

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

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      sceneManager.dispose();
    };
  }, []);

  const handleReset = () => {
    sceneManagerRef.current?.resetCamera();
  };

  const handleTimeChange = (time: number) => {
    sceneManagerRef.current?.setTimeOfDay(time);
  };

  const handleFogDensityChange = (density: number) => {
    sceneManagerRef.current?.setFogDensity(density);
  };

  return (
    <div className="fixed inset-0 bg-black">
      <canvas id="scene-canvas" className="w-full h-full block" />
      {isGuiVisible && <FPSCounter />}
      {isGuiVisible && (
        <div className="absolute bottom-4 left-4 text-white bg-black/50 px-4 py-2 rounded text-sm">
          Use WASD to move, mouse to look around, SPACE to jump, F to toggle fly
          mode, T to toggle wireframe mode, and H to toggle GUI
          {window.innerWidth > 640 && (
            <span className="ml-2">(Q/E for up/down in fly mode)</span>
          )}
        </div>
      )}
      {isGuiVisible && (
        <div className="absolute top-4 right-4 flex flex-col gap-4">
          <a
            href="https://github.com/bramtechs/vibe-beach"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
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
            className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded transition-colors"
          >
            Reset Position
          </button>
          {/* <TimeOfDaySlider onChange={handleTimeChange} /> */}
          <FogDensitySlider onChange={handleFogDensityChange} />
        </div>
      )}
    </div>
  );
}

export default App;
