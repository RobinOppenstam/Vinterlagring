import React from 'react';
import { Info } from 'lucide-react';

const Guidelines = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-800">
        <Info className="text-blue-600" />
        How to Use
      </h2>
      
      <ol className="space-y-3 text-gray-700">
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            1
          </span>
          <div>
            <strong>Set Box Dimensions:</strong> Use the input fields to define your Warehouse size
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            2
          </span>
          <div>
            <strong>Add Custom Vehicle:</strong> Click "Add Vehicle" and customize dimensions
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            3
          </span>
          <div>
            <strong>Drag to Place:</strong> Drag Vehicles from the sidebar into the Warehouse
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            4
          </span>
          <div>
            <strong>Rearrange:</strong> Drag Vehicles within the Warehouse to reposition them
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            5
          </span>
          <div>
            <strong>Remove:</strong> Double-click any placed Vehicle to remove it
          </div>
        </li>
      </ol>
    </div>
  );
};

export default Guidelines;