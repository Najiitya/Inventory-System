import React, { useState } from 'react';
import api from '../api/axiosConfig';

export default function ItemCard({ initialPart }) {
  const [part, setPart] = useState(initialPart);

  // Calculate status visually based on the PostgreSQL stock_items integer
  let statusText = "Available";
  let statusColor = "bg-green-500 text-white";

  if (part.stock_items === 0) {
    statusText = "Out of Stock";
    statusColor = "bg-red-600 text-white";
  } else if (part.stock_items === 1) {
    statusText = "Low";
    statusColor = "bg-yellow-400 text-black";
  }

  // Handle the big buttons
  const handleStockChange = async (changeValue) => {
    // Stop them from going below 0 on the frontend
    if (changeValue === -1 && part.stock_items === 0) return;

    // 1. Optimistic Update: Change it instantly on screen so it feels fast
    setPart({ ...part, stock_items: part.stock_items + changeValue });

    // 2. Send the mathematical change to PostgreSQL
    try {
      await api.patch(`/parts/${part.id}/stock`, { change: changeValue });
    } catch (error) {
      console.error("Failed to update stock", error);
      // Revert the screen if the database blocked it
      setPart({ ...part, stock_items: part.stock_items }); 
      alert("Error updating stock!");
    }
  };

  return (
    <div className="flex items-center justify-between p-6 mb-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
      
      {/* Left Side: Info & Badge */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{part.name}</h2>
        <p className="text-xl text-gray-500 mb-3">{part.brand_name}</p>
        
        <span className={`px-4 py-2 text-lg font-bold rounded-lg ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* Right Side: Massive Buttons */}
      <div className="flex items-center space-x-6">
        <button 
          onClick={() => handleStockChange(-1)}
          disabled={part.stock_items === 0}
          className="flex items-center justify-center w-20 h-20 text-5xl font-bold text-white bg-red-500 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:bg-red-600 active:bg-red-700"
        >
          -
        </button>

        <span className="w-16 text-5xl font-black text-center text-gray-800">
          {part.stock_items}
        </span>

        <button 
          onClick={() => handleStockChange(1)}
          className="flex items-center justify-center w-20 h-20 text-5xl font-bold text-white bg-green-500 rounded-xl shadow-md hover:bg-green-600 active:bg-green-700"
        >
          +
        </button>
      </div>

    </div>
  );
}