export interface Location {
  lat: number;
  lon: number;
}

export type NodeType = 'Port' | 'Warehouse' | 'Store';

export interface Node {
  id: string;
  name: string; // implied from context/example
  location: Location;
  capacity_tier: number;
  type: NodeType; // Implied from 'Roles' or explicit field? API doc says roles are Port, Warehouse, Store. I'll add a type field.
}

export interface Product {
  sku: string;
  name: string;
  unit_value: number;
  is_seasonal: boolean;
}

export interface ShipmentItem {
  sku: string;
  qty: number;
  value_usd: number; // Inferred from example code `item.value_usd`
}

export type TransportMode = 'Sea' | 'Air' | 'Truck' | 'Rail';
export type ShipmentStatus = 'In-Transit' | 'Stuck' | 'Delayed' | 'Delivered';

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  transport_mode: TransportMode;
  priority: 'Normal' | 'Critical';
  origin_id: string; // Added to match backend
  current_location: Location;
  contents: ShipmentItem[];
  total_value_at_risk: number;
  destination_id: string; // Validated from architecture doc example
}

export interface Disruption {
  id: string;
  type: 'Labor Strike' | 'Weather' | 'Geopolitical' | string;
  description: string;
  location: Location;
  radius_km: number;
  affected_modes: TransportMode[];
}
