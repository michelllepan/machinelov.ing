"use client";

import { useState, useEffect } from "react";

interface Valentine {
  id: number;
  message: string;
}

export default function Home() {
  const [valentines, setValentines] = useState<Valentine[]>([]);
  const [currentValentine, setCurrentValentine] = useState<Valentine | null>(null);

  useEffect(() => {
    fetch("/valentines.json")
      .then((res) => res.json())
      .then((data) => {
        setValentines(data);
        if (data.length > 0) {
          setCurrentValentine(data[Math.floor(Math.random() * data.length)]);
        }
      });
  }, []);

  const getNewValentine = () => {
    if (valentines.length === 0) return;

    let newValentine;
    do {
      newValentine = valentines[Math.floor(Math.random() * valentines.length)];
    } while (valentines.length > 1 && newValentine.id === currentValentine?.id);

    setCurrentValentine(newValentine);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          {currentValentine ? (
            <p>{currentValentine.message}</p>
          ) : (
            <p>Loading valentines...</p>
          )}
        </div>
      </div>
      {currentValentine && (
        <div className="pb-12 text-center">
          <button onClick={getNewValentine} className="px-2.5 py-1 border-2 border-current rounded-lg">
            new valentine
          </button>
        </div>
      )}
    </div>
  );
}
