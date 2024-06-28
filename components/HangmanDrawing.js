import React from "react";

const HangmanDrawing = ({ incorrectGuesses }) => {
  const stages = [
    // add more stages as needed
    <div key="base" className="flex justify-center">
      <div className="h-1 bg-black w-32"></div>
    </div>,
    <div key="vertical" className="flex justify-center">
      <div className="h-32 w-1 bg-black"></div>
    </div>,
    <div key="horizontal" className="flex justify-center">
      <div className="h-1 bg-black w-24"></div>
    </div>,
    <div key="rope" className="flex justify-center">
      <div className="h-10 w-1 bg-black"></div>
    </div>,
    <div key="head" className="flex justify-center">
      <div className="rounded-full h-8 w-8 border-4 border-black"></div>
    </div>,
    <div key="body" className="flex justify-center">
      <div className="h-16 w-1 bg-black"></div>
    </div>,
    <div key="left-arm" className="flex justify-center">
      <div className="h-1 w-12 bg-black transform -rotate-45 origin-top-right"></div>
    </div>,
    <div key="right-arm" className="flex justify-center">
      <div className="h-1 w-12 bg-black transform rotate-45 origin-top-left"></div>
    </div>,
    <div key="left-leg" className="flex justify-center">
      <div className="h-1 w-12 bg-black transform rotate-45 origin-top-left"></div>
    </div>,
    <div key="right-leg" className="flex justify-center">
      <div className="h-1 w-12 bg-black transform -rotate-45 origin-top-right"></div>
    </div>,
  ];

  return (
    <div className="flex flex-col items-center mt-8">
      {stages.slice(0, incorrectGuesses + 1)}
    </div>
  );
};

export default HangmanDrawing;
