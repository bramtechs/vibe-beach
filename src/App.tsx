import React, { useEffect, useRef } from "react";
import SceneManager from "./three/SceneManager";
import TimeOfDaySlider from "./components/TimeOfDaySlider";
import FogDensitySlider from "./components/FogDensitySlider";
import FPSCounter from "./components/FPSCounter";

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

  const handleFogDensityChange = (density: number) => {
    sceneManagerRef.current?.setFogDensity(density);
  };

  return (
    <div className="fixed inset-0 bg-black">
      <canvas id="scene-canvas" className="w-full h-full block" />
      <FPSCounter />
      <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded text-sm">
        Use WASD to move, mouse to look around, SPACE to jump, F to toggle fly
        mode, and T to toggle wireframe mode
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
        <FogDensitySlider onChange={handleFogDensityChange} />
      </div>
    </div>
  );
}

export default App;
