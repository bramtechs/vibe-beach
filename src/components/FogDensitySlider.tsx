import React from "react";

interface FogDensitySliderProps {
  onChange: (density: number) => void;
}

const FogDensitySlider: React.FC<FogDensitySliderProps> = ({ onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-white text-sm">Fog Density</label>
      <input
        type="range"
        min="0"
        max="0.1"
        step="0.001"
        defaultValue="0.01"
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default FogDensitySlider;
