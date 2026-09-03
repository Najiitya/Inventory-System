import { useState, useEffect } from 'react';
import api from './api/axiosConfig';
import ItemCard from './components/ItemCard';

export default function App() {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for the Add New Part form
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newStock, setNewStock] = useState("");

  const fetchParts = async () => {
    try {
      const response = await api.get('/parts');
      setParts(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch all parts from PostgreSQL when the app loads
  useEffect(() => {
    fetchParts();
  }, []);

  // Function to handle Adding a Part
  const handleAddPart = async (e) => {
    e.preventDefault(); // Prevent page refresh
    if (!newName || !newBrand) return alert("Name and Brand are required!");

    try {
      const response = await api.post('/parts', {
        name: newName,
        brand_name: newBrand,
        stock_items: newStock
      });
      
      // Add the new part directly to the screen so it updates instantly
      setParts([...parts, response.data]);
      
      // Clear the form fields
      setNewName("");
      setNewBrand("");
      setNewStock("");
    } catch (error) {
      console.error("Error adding part", error);
      alert("Failed to add part.");
    }
  };

  // Function to handle Deleting a Part
  const handleDeletePart = async (id) => {
    // Add a simple safety check so users don't delete by accident
    if (!window.confirm("Are you sure you want to delete this part forever?")) return;

    try {
      await api.delete(`/parts/${id}`);
      // Remove it from the screen instantly
      setParts(parts.filter(part => part.id !== id));
    } catch (error) {
      console.error("Error deleting part", error);
      alert("Failed to delete part.");
    }
  };

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
      <div className="max-w-5xl mx-auto">
        
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

        {/* Add New Part Form */}
        <form onSubmit={handleAddPart} className="flex gap-4 p-6 mb-8 bg-white border-2 border-gray-200 shadow-sm rounded-2xl">
          <input 
            type="text" 
            placeholder="Part Name (e.g. Brake Pad)" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
          />
          <input 
            type="text" 
            placeholder="Brand (e.g. Toyota)" 
            value={newBrand} 
            onChange={(e) => setNewBrand(e.target.value)}
            className="flex-1 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
          />
          <input 
            type="number" 
            placeholder="Start Stock (0)" 
            value={newStock} 
            onChange={(e) => setNewStock(e.target.value)}
            className="w-40 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
          />
          <button type="submit" className="px-8 text-xl font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-sm">
            Add Part
          </button>
        </form>

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
              <ItemCard 
                key={part.id} 
                initialPart={part} 
                onDelete={() => handleDeletePart(part.id)} 
              />
            ))
          ) : (
            <p className="text-2xl text-center text-gray-500 mt-12">No parts found matching your search.</p>
          )}
        </div>

      </div>
    </div>
  );
}