import React, { useEffect, useState } from "react";

interface SongTitleProps {
  title: string;
  isVisible: boolean;
  isMuted: boolean;
}

const SongTitle: React.FC<SongTitleProps> = ({ title, isVisible, isMuted }) => {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.9);

  useEffect(() => {
    if (isVisible) {
      // Fade in and scale up
      setOpacity(1);
      setScale(1);
      // Fade out and scale down after 3 seconds
      const timeout = setTimeout(() => {
        setOpacity(0);
        setScale(0.9);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, title]);

  return (
    <>
      {/* Permanent top display - only show when not muted */}
      {!isMuted && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-2 rounded-xl shadow-2xl border border-white/10">
          <div className="text-center">
            <div className="text-xs mb-1 text-blue-300 font-medium tracking-wider uppercase">
              Now Playing
            </div>
            <div className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
              {title}
            </div>
          </div>
        </div>
      )}

      {/* Original centered popup */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-8 py-4 rounded-xl shadow-2xl border border-white/10 transition-all duration-500"
        style={{
          opacity,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div className="text-center">
          <div className="text-sm mb-2 text-blue-300 font-medium tracking-wider uppercase">
            Now Playing
          </div>
          <div className="text-3xl mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
            {title}
          </div>
          <div className="text-sm text-gray-300/80 flex items-center justify-center gap-3">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Press P to mute/unmute
            </span>
            <span className="text-gray-500">•</span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Press N to skip
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SongTitle;
