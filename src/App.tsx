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
