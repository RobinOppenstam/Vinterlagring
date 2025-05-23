export interface ApiVehicle {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  color: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface Vehicle extends ApiVehicle {
  x?: number;
  y?: number;
  isPlaced?: boolean;
}

export const vehicleService = {
  async fetchVehicles(): Promise<ApiVehicle[]> {
    try {
      const response = await fetch('/api/vehicles');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const vehicles = await response.json();
      return vehicles;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error('Failed to fetch vehicles from API');
    }
  }
};