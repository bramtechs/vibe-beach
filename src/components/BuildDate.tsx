import React from "react";

const BuildDate: React.FC = () => {
  const buildDate = import.meta.env.BUILD_DATE;
  return (
    <div className="bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10 text-white text-sm font-medium tracking-wider">
      Build: {buildDate}
    </div>
  );
};

export default BuildDate;
