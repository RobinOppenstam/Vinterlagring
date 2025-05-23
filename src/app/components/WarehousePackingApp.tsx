'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Package, Square, RefreshCw, CalendarDays, Trash2, MapPin } from 'lucide-react';
import Guidelines from './Guidelines';
import { vehicleService, Vehicle, ApiVehicle } from '../../services/vehicleService';

interface Warehouse {
  width: number;
  height: number;
}


interface EntryExitPoint {
  id: string;
  x: number;
  y: number;
  type: 'entry' | 'exit';
  name: string;
}

const WarehousePackingApp = () => {
  const [warehouse, setWarehouse] = useState<Warehouse>({ width: 1000, height: 500 });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [placedVehicles, setPlacedVehicles] = useState<Vehicle[]>([]);
  const [entryExitPoints, setEntryExitPoints] = useState<EntryExitPoint[]>([]);
  const [draggedVehicle, setDraggedVehicle] = useState<Vehicle | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEntryExit, setIsAddingEntryExit] = useState<'entry' | 'exit' | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicleTitle, setNewVehicleTitle] = useState('');

  // Load vehicles from API on component mount
  useEffect(() => {
    loadVehicles();
  }, []);

  // Load vehicles from API
  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiVehicles = await vehicleService.fetchVehicles();
      const mappedVehicles: Vehicle[] = apiVehicles.map(vehicle => ({
        ...vehicle,
        isPlaced: false
      }));
      setVehicles(mappedVehicles);
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new vehicle (manual creation)
  const addVehicle = () => {
    if (!newVehicleTitle.trim()) {
      alert('Please enter a vehicle title');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const newVehicle: Vehicle = {
      id: `MAN${Date.now()}`,
      width: 80,
      height: 60,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`,
      name: newVehicleTitle.trim(),
      type: 'Manual',
      checkInDate: today,
      checkOutDate: tomorrow,
      isPlaced: false
    };
    setVehicles([...vehicles, newVehicle]);
    setNewVehicleTitle('');
    setIsAddingVehicle(false);
  };

  // Cancel adding vehicle
  const cancelAddVehicle = () => {
    setNewVehicleTitle('');
    setIsAddingVehicle(false);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, vehicle: Vehicle, isPlaced = false) => {
    e.dataTransfer.effectAllowed = 'move';
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedVehicle({ ...vehicle, isPlaced });
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // Handle drop into warehouse
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedVehicle) return;

    const warehouseRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - warehouseRect.left - dragOffset.x;
    const y = e.clientY - warehouseRect.top - dragOffset.y;

    // Check boundaries
    const maxX = warehouse.width - draggedVehicle.width;
    const maxY = warehouse.height - draggedVehicle.height;
    
    if (x >= 0 && y >= 0 && x <= maxX && y <= maxY) {
      const newPlacedVehicle: Vehicle = {
        ...draggedVehicle,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      };

      if (draggedVehicle.isPlaced) {
        // Update existing placed vehicle
        setPlacedVehicles(prev => 
          prev.map(p => p.id === draggedVehicle.id ? newPlacedVehicle : p)
        );
      } else {
        // Add new vehicle to warehouse
        setPlacedVehicles(prev => [...prev, newPlacedVehicle]);
        setVehicles(prev => prev.filter(p => p.id !== draggedVehicle.id));
      }
    }

    setDraggedVehicle(null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Remove vehicle from warehouse
  const removeVehicle = (vehicleId: string) => {
    const vehicle = placedVehicles.find(p => p.id === vehicleId);
    if (vehicle) {
      const { x, y, isPlaced, ...originalVehicle } = vehicle;
      setVehicles(prev => [...prev, { ...originalVehicle, isPlaced: false }]);
      setPlacedVehicles(prev => prev.filter(p => p.id !== vehicleId));
    }
  };

  // Update warehouse dimensions
  const updateWarehouseDimensions = (dimension: keyof Warehouse, value: string) => {
    const numValue = Math.max(100, parseInt(value) || 0);
    setWarehouse(prev => ({ ...prev, [dimension]: numValue }));
  };

  // Update vehicle dimensions
  const updateVehicleDimensions = (vehicleId: string, dimension: 'width' | 'height', value: string) => {
    const numValue = Math.max(10, parseInt(value) || 0);
    setVehicles(prev => 
      prev.map(p => p.id === vehicleId ? { ...p, [dimension]: numValue } : p)
    );
  };

  // Update vehicle dates
  const updateVehicleDate = (vehicleId: string, dateType: 'checkInDate' | 'checkOutDate', value: string) => {
    setVehicles(prev => 
      prev.map(p => p.id === vehicleId ? { ...p, [dateType]: value } : p)
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  };

  // Handle warehouse click for adding entry/exit points
  const handleWarehouseClick = (e: React.MouseEvent) => {
    if (!isAddingEntryExit) return;
    
    const warehouseRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - warehouseRect.left;
    const y = e.clientY - warehouseRect.top;
    
    // Create new entry/exit point
    const newPoint: EntryExitPoint = {
      id: `${isAddingEntryExit}-${Date.now()}`,
      x: Math.max(10, Math.min(x - 15, warehouse.width - 30)), // 30px width for the point
      y: Math.max(10, Math.min(y - 15, warehouse.height - 30)), // 30px height for the point
      type: isAddingEntryExit,
      name: `${isAddingEntryExit === 'entry' ? 'Entry' : 'Exit'} ${entryExitPoints.filter(p => p.type === isAddingEntryExit).length + 1}`
    };
    
    setEntryExitPoints(prev => [...prev, newPoint]);
    setIsAddingEntryExit(null);
  };

  // Remove entry/exit point
  const removeEntryExitPoint = (pointId: string) => {
    setEntryExitPoints(prev => prev.filter(p => p.id !== pointId));
  };

  // Handle drag over for entry/exit mode
  const handleWarehouseDragOver = (e: React.DragEvent) => {
    if (isAddingEntryExit) {
      e.preventDefault();
      return;
    }
    handleDragOver(e);
  };

  // Handle drop for entry/exit mode
  const handleWarehouseDrop = (e: React.DragEvent) => {
    if (isAddingEntryExit) {
      e.preventDefault();
      return;
    }
    handleDrop(e);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8 flex items-center gap-3">
          <Package className="text-blue-600" />
          Warehouse Packing Webapp
        </h1>

        {/* Guidelines Section */}
        <div className="mb-8">
          <Guidelines />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Warehouse Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
              <Square className="text-green-600" />
              Warehouse Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={warehouse.width}
                  onChange={(e) => updateWarehouseDimensions('width', e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                />
              </div>

            
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={warehouse.height}
                  onChange={(e) => updateWarehouseDimensions('height', e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                />
              </div>
            </div>
            {/* Entry/Exit Points Management */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Entry/Exit Points</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddingEntryExit('entry')}
                    className={`flex items-center gap-2 px-3 py-2 text-white rounded-md transition-colors ${
                      isAddingEntryExit === 'entry' 
                        ? 'bg-green-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <MapPin size={16} />
                    Add Entry
                  </button>
                  <button
                    onClick={() => setIsAddingEntryExit('exit')}
                    className={`flex items-center gap-2 px-3 py-2 text-white rounded-md transition-colors ${
                      isAddingEntryExit === 'exit' 
                        ? 'bg-red-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <MapPin size={16} />
                    Add Exit
                  </button>
                </div>
              </div>

              {isAddingEntryExit && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-800 rounded">
                  Click anywhere in the warehouse to place {isAddingEntryExit === 'entry' ? 'an entry' : 'an exit'} point.
                  <button 
                    onClick={() => setIsAddingEntryExit(null)}
                    className="ml-2 text-blue-600 underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {entryExitPoints.map((point) => (
                  <div key={point.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-4 h-4 rounded-full ${
                          point.type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-sm text-black">{point.name}</span>
                    </div>
                    <button
                      onClick={() => removeEntryExitPoint(point.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {entryExitPoints.length === 0 && (
                  <p className="text-sm text-black italic">No entry/exit points added yet.</p>
                )}
              </div>
            </div>

            {/* Available Vehicles */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Available Vehicles</h3>
                <div className="flex gap-2">
                  <button
                    onClick={loadVehicles}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Loading...' : 'Load API'}
                  </button>
                  <button
                    onClick={() => setIsAddingVehicle(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Manual
                  </button>
                </div>
              </div>

              {/* Add Vehicle Form */}
              {isAddingVehicle && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-black mb-3">Add New Vehicle</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-black mb-1">Vehicle Title</label>
                      <input
                        type="text"
                        value={newVehicleTitle}
                        onChange={(e) => setNewVehicleTitle(e.target.value)}
                        placeholder="Enter vehicle name/title"
                        className="w-full px-3 py-2 text-sm  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addVehicle();
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addVehicle}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create Vehicle
                      </button>
                      <button
                        onClick={cancelAddVehicle}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white text-sm rounded-md hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm text-black">{vehicle.name}</span>
                        <span className="text-xs text-black ml-2">({vehicle.type})</span>
                      </div>
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: vehicle.color }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-black mb-1">Width</label>
                        <input
                          type="number"
                          value={vehicle.width}
                          onChange={(e) => updateVehicleDimensions(vehicle.id, 'width', e.target.value)}
                          className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-black mb-1">Height</label>
                        <input
                          type="number"
                          value={vehicle.height}
                          onChange={(e) => updateVehicleDimensions(vehicle.id, 'height', e.target.value)}
                          className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="10"
                        />
                      </div>
                    </div>

                    {/* Date inputs */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-black mb-1 flex items-center gap-1">
                          <CalendarDays size={12} />
                          Check In
                        </label>
                        <input
                          type="date"
                          value={vehicle.checkInDate}
                          onChange={(e) => updateVehicleDate(vehicle.id, 'checkInDate', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-black mb-1 flex items-center gap-1">
                          <CalendarDays size={12} />
                          Check Out
                        </label>
                        <input
                          type="date"
                          value={vehicle.checkOutDate}
                          onChange={(e) => updateVehicleDate(vehicle.id, 'checkOutDate', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, vehicle)}
                      className="mt-2 p-2 border-2 border-dashed border-gray-300 rounded cursor-move hover:border-blue-400 transition-colors flex items-center justify-center text-black text-sm"
                      style={{
                        width: Math.min(vehicle.width, 120),
                        height: Math.min(vehicle.height, 40),
                        backgroundColor: vehicle.color + '40'
                      }}
                    >
                      Drag to warehouse
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warehouse Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Warehouse ({warehouse.width} × {warehouse.height})
            </h2>
            
            <div className="flex justify-center">
              <div
                className={`relative border-2 border-gray-800 bg-gray-100 ${
                  isAddingEntryExit ? 'cursor-crosshair' : ''
                }`}
                style={{ width: warehouse.width, height: warehouse.height }}
                onDrop={handleWarehouseDrop}
                onDragOver={handleWarehouseDragOver}
                onClick={handleWarehouseClick}
              >
                {/* Entry/Exit Points */}
                {entryExitPoints.map((point) => (
                  <div
                    key={point.id}
                    className={`absolute w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                      point.type === 'entry' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                    style={{
                      left: point.x,
                      top: point.y,
                    }}
                    title={`${point.name} - Click to remove`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEntryExitPoint(point.id);
                    }}
                  >
                    <MapPin size={16} className="text-white" />
                  </div>
                ))}

                {/* Vehicles */}
                {placedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, vehicle, true)}
                    onDoubleClick={() => removeVehicle(vehicle.id)}
                    className="absolute cursor-move border border-gray-600 flex flex-col items-center justify-center text-xs font-medium text-black shadow-sm hover:shadow-md transition-shadow p-1"
                    style={{
                      left: vehicle.x,
                      top: vehicle.y,
                      width: vehicle.width,
                      height: vehicle.height,
                      backgroundColor: vehicle.color,
                      color: '#000'
                    }}
                    title={`${vehicle.name} - Double-click to remove`}
                  >
                    <div className="text-center leading-tight">
                      <div className="font-semibold">{vehicle.name}</div>
                      <div className="text-xs opacity-90">
                        In: {formatDate(vehicle.checkInDate)}
                      </div>
                      <div className="text-xs opacity-90">
                        Out: {formatDate(vehicle.checkOutDate)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {placedVehicles.length === 0 && entryExitPoints.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-black text-lg">
                    {isAddingEntryExit 
                      ? `Click to add ${isAddingEntryExit} point` 
                      : 'Drop vehicles here or add entry/exit points'
                    }
                  </div>
                )}
              </div>
            </div>

            {(placedVehicles.length > 0 || entryExitPoints.length > 0) && (
              <div className="mt-6">
                {placedVehicles.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium mb-2 text-black">Placed Vehicles</h3>
                    <div className="text-sm text-black mb-4">
                      {placedVehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                          <div>
                            <span className="font-medium">{vehicle.name}</span>
                            <div className="text-xs">
                              Check-in: {formatDate(vehicle.checkInDate)} | Check-out: {formatDate(vehicle.checkOutDate)}
                            </div>
                          </div>
                          <span className="text-xs">({vehicle.x}, {vehicle.y})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {entryExitPoints.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium mb-2 text-black">Entry/Exit Points</h3>
                    <div className="text-sm text-black mb-4">
                      {entryExitPoints.map((point) => (
                        <div key={point.id} className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                point.type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                            <span>{point.name}</span>
                          </div>
                          <span className="text-xs">({point.x}, {point.y})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <p className="text-sm text-black mt-2">
                  Double-click any vehicle to remove it from the warehouse. Click any entry/exit point to remove it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehousePackingApp;