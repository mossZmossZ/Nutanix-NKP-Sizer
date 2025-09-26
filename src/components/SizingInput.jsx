import React from "react";

const SizingInput = ({ label, value, onChange, disabled, widthClass = "w-16", type = "number" }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between my-2 gap-1">
    <label className="text-sm text-gray-600 md:min-w-40">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full md:${widthClass} p-2 rounded-md text-sm text-center border transition-colors duration-200 ${
        disabled
          ? "bg-gray-200 cursor-not-allowed"
          : "bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      }`}
      disabled={disabled}
    />
  </div>
);

export default SizingInput;
