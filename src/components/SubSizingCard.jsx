import React from "react";

const SubSizingCard = ({
  title,
  children,
  toggle,
  onToggle,
  isMasterToggleOn,
  showToggle = true,
}) => {
  const isChecked = isMasterToggleOn && toggle;
  return (
    <div
      className={`p-4 m-2 rounded-xl shadow transition-all duration-300 ${
        isChecked ? "bg-white border-2 border-indigo-300" : "bg-gray-200 opacity-70"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-gray-700">{title}</h4>
        {showToggle && (
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isChecked}
                onChange={onToggle}
                disabled={!isMasterToggleOn}
              />
              <div
                className={`block bg-gray-500 w-12 h-6 rounded-full transition-all duration-300 ${
                  isChecked ? "bg-indigo-500" : ""
                }`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 transform ${
                  isChecked ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </label>
        )}
      </div>
      {children}
    </div>
  );
};

export default SubSizingCard;
