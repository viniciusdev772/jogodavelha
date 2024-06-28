import React from "react";

const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

export default function VirtualKeyboard({ onKeyPress }) {
  return (
    <div className="grid grid-cols-9 gap-2">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          className="bg-gray-300 text-black font-bold py-2 px-4 rounded"
        >
          {key}
        </button>
      ))}
    </div>
  );
}
