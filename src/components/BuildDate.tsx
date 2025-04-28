import React from "react";

const BuildDate: React.FC = () => {
  const buildDate = import.meta.env.BUILD_DATE;
  return (
    <div className="text-white bg-black/50 px-4 py-2 rounded text-sm">
      Build: {buildDate}
    </div>
  );
};

export default BuildDate;
