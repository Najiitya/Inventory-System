import React, { useState, useEffect, useRef } from 'react';
import api from './api/axiosConfig';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newName, setNewName] = useState("");
  const [newLeft, setNewLeft] = useState("");
  const [newRight, setNewRight] = useState("");
  const [newQty, setNewQty] = useState("");
  
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
    if (!newName) return alert("Product Name is required!");

    try {
      const response = await api.post('/parts', {
        product_name: newName,
        left_qty: newLeft,
        right_qty: newRight,
        qty: newQty
      });
      setParts([...parts, response.data]);
      setNewName(""); setNewLeft(""); setNewRight(""); setNewQty("");
    } catch (error) {
      alert("Failed to add part.");
    }
  };

  const handleStockChange = async (id, currentStock, changeValue, side) => {
    if (changeValue === -1 && currentStock === 0) return; 
    
    // Optimistic UI Update
    setParts(parts.map(p => {
      if (p.id === id) {
        if (side === 'left') return { ...p, left_qty: p.left_qty + changeValue };
        if (side === 'right') return { ...p, right_qty: p.right_qty + changeValue };
        if (side === 'qty') return { ...p, qty: p.qty + changeValue };
      }
      return p;
    }));

    try {
      await api.patch(`/parts/${id}/stock`, { change: changeValue, side });
    } catch (error) {
      alert("Error updating stock!");
      fetchParts(); 
    }
  };

  const handleDeletePart = async (id) => {
    if (!window.confirm("Are you sure you want to delete this part?")) return;
    try {
      await api.delete(`/parts/${id}`);
      setParts(parts.filter(part => part.id !== id));
    } catch (error) {
      alert("Failed to delete part.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("🚨 WARNING: Are you sure you want to DELETE ALL parts?")) return;
    if (!window.confirm("FINAL WARNING: Click OK to completely wipe the database.")) return;

    try {
      await api.delete('/parts/all');
      setParts([]);
      alert("Database wiped.");
    } catch (error) {
      alert("Failed to wipe database.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <form onSubmit={handleLogin} className="w-full max-w-md p-10 bg-white shadow-2xl rounded-2xl">
          <h1 className="mb-8 text-4xl font-black text-center text-slate-800">Staff Login</h1>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 mb-4 text-xl border-2 rounded-xl border-slate-300 focus:border-blue-600 outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 mb-8 text-xl border-2 rounded-xl border-slate-300 focus:border-blue-600 outline-none" required />
          <button type="submit" className="w-full py-4 text-2xl font-bold text-white transition-colors bg-blue-600 shadow-md rounded-xl hover:bg-blue-700 active:scale-95">LOGIN</button>
        </form>
      </div>
    );
  }

  const filteredParts = parts.filter(part => part.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="p-6 bg-white shadow-md rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-black text-slate-800">Inventory Dashboard</h1>
            <div className="flex flex-wrap gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 text-sm font-bold text-slate-800 bg-emerald-300 rounded-lg hover:bg-emerald-400">⬆️ Add from CSV</button>
              <button onClick={() => window.location.href = 'http://localhost:5000/api/parts/export'} className="px-4 py-2 text-sm font-bold text-slate-800 bg-sky-300 rounded-lg hover:bg-sky-400">📥 Save to Excel</button>
              <button onClick={handleDeleteAll} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">🗑️ Wipe Data</button>
              <button onClick={() => { setIsAuthenticated(false); }} className="px-4 py-2 text-sm font-bold text-white bg-slate-700 rounded-lg hover:bg-slate-800">Logout</button>
            </div>
          </div>
          <input type="text" placeholder="🔍 Search for a product name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 text-lg font-medium border-2 bg-slate-50 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500" />
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddPart} className="flex flex-wrap items-center gap-4 p-4 bg-white shadow-md rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-600">Add Single Item:</span>
          <input type="text" placeholder="Product Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 min-w-[200px] p-2 border-2 border-slate-300 rounded-lg outline-none" />
          <input type="number" placeholder="Left Qty" value={newLeft} onChange={(e) => setNewLeft(e.target.value)} className="w-24 p-2 border-2 border-slate-300 rounded-lg bg-[#fef08a] outline-none" />
          <input type="number" placeholder="Right Qty" value={newRight} onChange={(e) => setNewRight(e.target.value)} className="w-24 p-2 border-2 border-slate-300 rounded-lg bg-[#bfdbfe] outline-none" />
          <input type="number" placeholder="Gen Qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-24 p-2 border-2 border-slate-300 rounded-lg bg-[#bbf7d0] outline-none" />
          <button type="submit" className="px-6 py-2 font-bold text-white bg-slate-800 rounded-lg hover:bg-black">Add</button>
        </form>

        {/* Data Table */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-1 p-3 bg-black text-white font-bold text-sm">
            <div className="col-span-5">PRODUCT NAME</div>
            <div className="col-span-2 text-center">LEFT QTY</div>
            <div className="col-span-2 text-center">RIGHT QTY</div>
            <div className="col-span-2 text-center">QTY (General)</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Scrollable Body */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredParts.length > 0 ? (
              filteredParts.map((part) => (
                <div key={part.id} className="grid grid-cols-12 gap-1 border-b border-slate-200 hover:bg-slate-50 text-sm items-stretch">
                  
                  <div className="col-span-5 p-3 font-bold text-slate-800 flex items-center border-r border-slate-200">{part.product_name}</div>
                  
                  {/* LEFT QTY (Yellow) */}
                  <div className="col-span-2 bg-[#fef08a] flex items-center justify-center p-2 border-r border-slate-300">
                    <button onClick={() => handleStockChange(part.id, part.left_qty, -1, 'left')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">-</button>
                    <span className="w-10 text-center font-black text-lg">{part.left_qty}</span>
                    <button onClick={() => handleStockChange(part.id, part.left_qty, 1, 'left')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">+</button>
                  </div>

                  {/* RIGHT QTY (Blue) */}
                  <div className="col-span-2 bg-[#bfdbfe] flex items-center justify-center p-2 border-r border-slate-300">
                    <button onClick={() => handleStockChange(part.id, part.right_qty, -1, 'right')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">-</button>
                    <span className="w-10 text-center font-black text-lg">{part.right_qty}</span>
                    <button onClick={() => handleStockChange(part.id, part.right_qty, 1, 'right')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">+</button>
                  </div>

                  {/* QTY General (Green) */}
                  <div className="col-span-2 bg-[#bbf7d0] flex items-center justify-center p-2 border-r border-slate-300">
                    <button onClick={() => handleStockChange(part.id, part.qty, -1, 'qty')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">-</button>
                    <span className="w-10 text-center font-black text-lg">{part.qty}</span>
                    <button onClick={() => handleStockChange(part.id, part.qty, 1, 'qty')} className="w-7 h-7 bg-white/60 rounded font-bold hover:bg-white text-lg">+</button>
                  </div>

                  {/* Delete Action */}
                  <div className="col-span-1 flex justify-center items-center p-2 bg-white">
                    <button onClick={() => handleDeletePart(part.id)} className="text-red-500 font-bold hover:underline">Del</button>
                  </div>

                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 font-bold">No parts found matching your search.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}