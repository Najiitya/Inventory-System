import { useState, useEffect } from 'react';
import api from './api/axiosConfig';
import ItemCard from './components/ItemCard';

export default function App() {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all parts from PostgreSQL when the app loads
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await api.get('/parts');
        setParts(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchParts();
  }, []);

  // Filter parts based on search
  const filteredParts = parts.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    part.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trigger the browser to download the Excel file
  const handleExport = () => {
    window.location.href = 'http://localhost:5000/api/parts/export';
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Export Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-gray-800">Inventory System</h1>
          <button 
            onClick={handleExport}
            className="px-6 py-3 text-xl font-bold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700"
          >
            📥 Export to Excel
          </button>
        </div>

        {/* Big Search Bar */}
        <div className="mb-8">
          <input 
            type="text" 
            placeholder="Search by part name or brand..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-6 text-2xl border-4 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Inventory List */}
        <div>
          {filteredParts.length > 0 ? (
            filteredParts.map(part => (
              <ItemCard key={part.id} initialPart={part} />
            ))
          ) : (
            <p className="text-2xl text-center text-gray-500 mt-12">No parts found matching your search.</p>
          )}
        </div>

      </div>
    </div>
  );
}