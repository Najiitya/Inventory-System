import React, { useState, useEffect, useRef } from 'react';
import api from './api/axiosConfig';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newStock, setNewStock] = useState("");
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchParts();
  }, [isAuthenticated]);

  const fetchParts = async () => {
    try {
      const response = await api.get('/parts');
      setParts(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parts/login', { email, password });
      setIsAuthenticated(true);
    } catch (error) {
      alert("Invalid email or password!");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/parts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("CSV Imported Successfully!");
      fetchParts();
    } catch (error) {
      alert("Failed to import CSV.");
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!newName || !newBrand) return alert("Name and Brand are required!");

    try {
      const response = await api.post('/parts', {
        name: newName,
        brand_name: newBrand,
        stock_items: newStock
      });
      setParts([...parts, response.data]);
      setNewName("");
      setNewBrand("");
      setNewStock("");
    } catch (error) {
      alert("Failed to add part.");
    }
  };

  const handleStockChange = async (id, currentStock, changeValue) => {
    if (changeValue === -1 && currentStock === 0) return;
    setParts(parts.map(p => p.id === id ? { ...p, stock_items: p.stock_items + changeValue } : p));
    try {
      await api.patch(`/parts/${id}/stock`, { change: changeValue });
    } catch (error) {
      alert("Error updating stock!");
      fetchParts();
    }
  };

  const handleDeletePart = async (id) => {
    if (!window.confirm("Are you sure you want to delete this part forever?")) return;
    try {
      await api.delete(`/parts/${id}`);
      setParts(parts.filter(part => part.id !== id));
    } catch (error) {
      alert("Failed to delete part.");
    }
  };

  // --- Delete All Handler (With Double Confirmation) ---
  const handleDeleteAll = async () => {
    // First warning
    if (!window.confirm("🚨 WARNING: Are you absolutely sure you want to DELETE ALL parts?")) return;
    
    // Second safety warning for low-IT users
    if (!window.confirm("FINAL WARNING: This cannot be undone. Click OK to completely wipe the database.")) return;

    try {
      await api.delete('/parts/all');
      setParts([]); // Instantly clear the screen
      alert("Database wiped successfully.");
    } catch (error) {
      console.error("Error deleting all parts", error);
      alert("Failed to wipe database.");
    }
  };

  // --- 1. SUPER SIMPLE LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <form onSubmit={handleLogin} className="w-full max-w-lg p-12 bg-white shadow-2xl rounded-3xl">
          <h1 className="mb-10 text-5xl font-black text-center text-slate-800">Staff Login</h1>
          <input 
            type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-6 mb-6 text-2xl border-4 rounded-2xl border-slate-300 focus:border-blue-600 outline-none" required 
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-6 mb-10 text-2xl border-4 rounded-2xl border-slate-300 focus:border-blue-600 outline-none" required 
          />
          <button type="submit" className="w-full py-6 text-3xl font-black text-white transition-colors bg-blue-600 shadow-lg rounded-2xl hover:bg-blue-700 active:scale-95">
            LOGIN TO SYSTEM
          </button>
        </form>
      </div>
    );
  }

  const filteredParts = parts.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    part.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- 2. MASSIVE CONTROL PANEL --- */}
        <div className="p-8 bg-white shadow-xl rounded-3xl border-4 border-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
            <h1 className="text-5xl font-black text-slate-800 tracking-tight">Inventory Dashboard</h1>
            
            <div className="flex flex-wrap gap-4">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="px-8 py-4 text-2xl font-bold text-slate-800 bg-emerald-300 rounded-2xl shadow-sm hover:bg-emerald-400 active:scale-95 transition-transform">
                ⬆️ Add from CSV
              </button>
              <button onClick={() => window.location.href = 'http://localhost:5000/api/parts/export'} className="px-8 py-4 text-2xl font-bold text-slate-800 bg-sky-300 rounded-2xl shadow-sm hover:bg-sky-400 active:scale-95 transition-transform">
                📥 Save to Excel
              </button>
              <button onClick={handleDeleteAll} className="px-8 py-4 text-2xl font-bold text-white bg-red-600 rounded-2xl shadow-sm hover:bg-red-700 active:scale-95 transition-transform">
                🗑️ Delete All Parts
              </button>
              <button onClick={() => { setIsAuthenticated(false); setEmail(""); setPassword(""); }} className="px-8 py-4 text-2xl font-bold text-white bg-slate-700 rounded-2xl shadow-sm hover:bg-slate-800 active:scale-95 transition-transform">
                Logout
              </button>
            </div>
          </div>

          {/* GIANT SEARCH BAR */}
          <input 
            type="text" placeholder="🔍 Search for a part or brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-8 text-3xl font-medium border-4 bg-slate-50 border-slate-300 rounded-3xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400"
          />
        </div>

        {/* --- 3. ADD SINGLE ITEM ACCORDION --- */}
        <form onSubmit={handleAddPart} className="flex flex-wrap items-center gap-6 p-8 bg-white shadow-lg rounded-3xl border-4 border-slate-200">
          <h2 className="w-full mb-2 text-2xl font-black text-slate-600 uppercase tracking-widest">Add A Single Part</h2>
          <input 
            type="text" placeholder="Part Name (e.g. Oil Filter)" value={newName} onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[250px] p-5 text-2xl border-4 border-slate-300 rounded-2xl focus:border-blue-500 outline-none"
          />
          <input 
            type="text" placeholder="Brand Name" value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
            className="flex-1 min-w-[200px] p-5 text-2xl border-4 border-slate-300 rounded-2xl focus:border-blue-500 outline-none"
          />
          <input 
            type="number" placeholder="Stock" value={newStock} onChange={(e) => setNewStock(e.target.value)}
            className="w-40 p-5 text-2xl border-4 border-slate-300 rounded-2xl focus:border-blue-500 outline-none"
          />
          <button type="submit" className="px-10 py-5 text-2xl font-black text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 active:scale-95 shadow-md transition-transform">
            ADD ITEM
          </button>
        </form>

        {/* --- 4. THICK ROW INVENTORY LIST --- */}
        <div className="space-y-6">
          {filteredParts.length > 0 ? (
            filteredParts.map((part) => {
              // Determine the color coding for the left border and badge
              let statusBorder = "border-l-emerald-500";
              let statusBadge = "bg-emerald-100 text-emerald-800";
              let statusText = "IN STOCK";

              if (part.stock_items === 0) {
                statusBorder = "border-l-red-500";
                statusBadge = "bg-red-100 text-red-800";
                statusText = "OUT OF STOCK";
              } else if (part.stock_items <= 1) {
                statusBorder = "border-l-amber-400";
                statusBadge = "bg-amber-100 text-amber-900";
                statusText = "LOW STOCK";
              }

              return (
                <div key={part.id} className={`flex flex-col md:flex-row md:items-center justify-between p-8 bg-white shadow-xl rounded-3xl border-l-[24px] border-y-4 border-r-4 border-y-slate-200 border-r-slate-200 ${statusBorder} transition-all hover:shadow-2xl`}>
                  
                  {/* Item Details */}
                  <div className="mb-6 md:mb-0">
                    <h3 className="text-4xl font-black text-slate-800 mb-2">{part.name}</h3>
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-bold text-slate-500">{part.brand_name}</span>
                      <span className={`px-4 py-2 text-xl font-black rounded-xl ${statusBadge}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Massive Action Buttons */}
                  <div className="flex items-center gap-10">
                    
                    {/* The Big Counter */}
                    <div className="flex items-center bg-slate-100 p-3 rounded-3xl border-4 border-slate-200">
                      <button 
                        onClick={() => handleStockChange(part.id, part.stock_items, -1)} 
                        disabled={part.stock_items === 0} 
                        className="flex items-center justify-center w-20 h-20 text-6xl font-black text-white bg-red-500 rounded-2xl disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-red-600 active:scale-90 transition-transform shadow-md"
                      >
                        -
                      </button>
                      
                      <span className="w-28 text-6xl font-black text-center text-slate-800">
                        {part.stock_items}
                      </span>
                      
                      <button 
                        onClick={() => handleStockChange(part.id, part.stock_items, 1)} 
                        className="flex items-center justify-center w-20 h-20 text-6xl font-black text-white bg-emerald-500 rounded-2xl hover:bg-emerald-600 active:scale-90 transition-transform shadow-md"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button 
                      onClick={() => handleDeletePart(part.id)} 
                      className="px-6 py-6 text-xl font-bold text-red-400 bg-red-50 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-20 text-center bg-white border-4 border-slate-200 rounded-3xl">
              <p className="text-4xl font-bold text-slate-400">No parts found matching your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}