import React, { useEffect, useRef } from "react";
import SceneManager from "./three/SceneManager";
import TimeOfDaySlider from "./components/TimeOfDaySlider";

function App() {
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    const sceneManager = new SceneManager();
    sceneManagerRef.current = sceneManager;

    // Handle window resize
    const handleResize = () => {
      sceneManager.onWindowResize();
    };

    window.addEventListener("resize", handleResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      sceneManager.dispose();
    };
  }, []);

  const handleReset = () => {
    sceneManagerRef.current?.resetCamera();
  };

  const handleTimeChange = (time: number) => {
    sceneManagerRef.current?.setTimeOfDay(time);
  };

  return (
    <div className="fixed inset-0 bg-black">
      <canvas id="scene-canvas" className="w-full h-full block" />
      <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded text-sm">
        Use WASD to move, mouse to look around, SPACE to jump, and F to toggle
        fly mode
        {window.innerWidth > 640 && (
          <span className="ml-2">(Q/E for up/down in fly mode)</span>
        )}
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-4">
        <button
          onClick={handleReset}
          className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded transition-colors"
        >
          Reset Position
        </button>
        <TimeOfDaySlider onChange={handleTimeChange} />
      </div>
    </div>
  );
}

export default App;
