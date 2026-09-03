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

  const handleDeleteAll = async () => {
    if (!window.confirm("🚨 WARNING: Are you absolutely sure you want to DELETE ALL parts?")) return;
    if (!window.confirm("FINAL WARNING: This cannot be undone. Click OK to completely wipe the database.")) return;

    try {
      await api.delete('/parts/all');
      setParts([]);
      alert("Database wiped successfully.");
    } catch (error) {
      console.error("Error deleting all parts", error);
      alert("Failed to wipe database.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <form onSubmit={handleLogin} className="w-full max-w-md p-10 bg-white shadow-2xl rounded-2xl">
          <h1 className="mb-8 text-4xl font-black text-center text-slate-800">Staff Login</h1>
          <input 
            type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-4 text-xl border-2 rounded-xl border-slate-300 focus:border-blue-600 outline-none" required 
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-8 text-xl border-2 rounded-xl border-slate-300 focus:border-blue-600 outline-none" required 
          />
          <button type="submit" className="w-full py-4 text-2xl font-bold text-white transition-colors bg-blue-600 shadow-md rounded-xl hover:bg-blue-700 active:scale-95">
            LOGIN
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
    <div className="min-h-screen p-4 md:p-8 bg-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Compact Header & Controls */}
        <div className="p-6 bg-white shadow-md rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-black text-slate-800">Inventory Dashboard</h1>
            
            <div className="flex flex-wrap gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 text-sm font-bold text-slate-800 bg-emerald-300 rounded-lg hover:bg-emerald-400 transition-colors">
                ⬆️ Add from CSV
              </button>
              <button onClick={() => window.location.href = 'http://localhost:5000/api/parts/export'} className="px-4 py-2 text-sm font-bold text-slate-800 bg-sky-300 rounded-lg hover:bg-sky-400 transition-colors">
                📥 Save to Excel
              </button>
              <button onClick={handleDeleteAll} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                🗑️ Delete All
              </button>
              <button onClick={() => { setIsAuthenticated(false); setEmail(""); setPassword(""); }} className="px-4 py-2 text-sm font-bold text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                Logout
              </button>
            </div>
          </div>

          <input 
            type="text" placeholder="🔍 Search for a part or brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 text-lg font-medium border-2 bg-slate-50 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Compact Add Item Bar */}
        <form onSubmit={handleAddPart} className="flex flex-wrap items-center gap-4 p-4 bg-white shadow-md rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-600">Add Item:</span>
          <input 
            type="text" placeholder="Part Name" value={newName} onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[150px] p-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
          <input 
            type="text" placeholder="Brand" value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
            className="w-40 p-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
          <input 
            type="number" placeholder="Stock" value={newStock} onChange={(e) => setNewStock(e.target.value)}
            className="w-24 p-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
          <button type="submit" className="px-6 py-2 font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-transform">
            Add
          </button>
        </form>

        {/* Compact Data Table with Scroll */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 bg-slate-800 text-white font-bold text-sm">
            <div className="col-span-4">Part Name</div>
            <div className="col-span-3">Brand</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-center">Manage Stock</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Scrollable Table Body */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredParts.length > 0 ? (
              filteredParts.map((part) => {
                let statusBorder = "border-l-emerald-500";
                let statusBadge = "bg-emerald-100 text-emerald-800";
                let statusText = "IN STOCK";

                if (part.stock_items === 0) {
                  statusBorder = "border-l-red-500";
                  statusBadge = "bg-red-100 text-red-800";
                  statusText = "OUT OF STOCK";
                } else if (part.stock_items <= 2) {
                  statusBorder = "border-l-amber-400";
                  statusBadge = "bg-amber-100 text-amber-900";
                  statusText = "LOW";
                }

                return (
                  <div key={part.id} className={`grid grid-cols-12 gap-2 items-center p-3 border-b border-slate-100 border-l-[8px] ${statusBorder} hover:bg-slate-50 transition-colors`}>
                    
                    <div className="col-span-4 font-bold text-slate-800 truncate pr-2" title={part.name}>{part.name}</div>
                    <div className="col-span-3 text-slate-500 text-sm truncate pr-2" title={part.brand_name}>{part.brand_name}</div>
                    
                    <div className="col-span-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md whitespace-nowrap ${statusBadge}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button onClick={() => handleStockChange(part.id, part.stock_items, -1)} disabled={part.stock_items === 0} className="w-8 h-8 text-xl font-bold text-white bg-red-500 rounded disabled:bg-slate-300 hover:bg-red-600 flex items-center justify-center pb-1">-</button>
                        <span className="w-10 text-center font-bold text-slate-800">{part.stock_items}</span>
                        <button onClick={() => handleStockChange(part.id, part.stock_items, 1)} className="w-8 h-8 text-xl font-bold text-white bg-emerald-500 rounded hover:bg-emerald-600 flex items-center justify-center pb-1">+</button>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => handleDeletePart(part.id)} className="text-red-400 hover:text-red-600 font-bold text-sm underline">
                        Del
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400 font-bold">No parts found matching your search.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}