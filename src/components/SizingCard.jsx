import React from "react";

const SizingCard = ({ title, children, isIncluded, onToggle, bgColor, borderColor }) => {
  return (
    <div
      className={`p-6 m-2 rounded-2xl shadow-xl transition-all duration-300 ${
        isIncluded
          ? `${bgColor} ${borderColor} border-4`
          : "bg-gray-100 border-2 border-transparent opacity-70"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isIncluded}
              onChange={onToggle}
            />
            <div
              className={`block w-12 h-6 rounded-full transition-all duration-300 ${
                isIncluded ? "bg-indigo-500" : "bg-gray-500"
              }`}
            ></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 transform ${
                isIncluded ? "translate-x-6" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>
      {children}
    </div>
  );
};

export default SizingCard;
