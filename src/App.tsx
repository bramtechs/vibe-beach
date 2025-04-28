import React, { useEffect } from 'react';
import SceneManager from './three/SceneManager';

function App() {
  useEffect(() => {
    const sceneManager = new SceneManager();
    
    // Handle window resize
    const handleResize = () => {
      sceneManager.onWindowResize();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      sceneManager.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <canvas id="scene-canvas" className="w-full h-full block" />
      <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded text-sm">
        Use WASD to move, mouse to look around, and SPACE to jump
      </div>
    </div>
  );
}

export default App;