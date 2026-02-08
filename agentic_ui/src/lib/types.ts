export interface Shipment {
  id: string;
  status: 'In-Transit' | 'Delayed' | 'Stuck' | 'Delivered' | 'Mitigated';
  mode?: 'Truck' | 'Sea' | 'Rail' | 'Air';
  origin_id?: string;
  current_location: string;
  destination: string;
  coordinates?: { lat: number; lng: number };
  value?: number;
  priority?: string;
  contents?: string[];
}

export interface Disruption {
  id: string;
  type: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  radius_km?: number;
  coordinates?: { lat: number; lng: number };
}

export interface Node {
  id: string;
  name: string;
  type: string;
  coordinates?: { lat: number; lng: number };
}

export interface SupplySnapshotData {
  shipments: Shipment[];
  disruptions: Disruption[];
  nodes?: Node[];
  timestamp: string;
  insights?: string;
}

export interface ADKSessionResponse {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: unknown[];
  lastUpdateTime: number;
}

export interface ADKAgentRequest {
  app_name: string;
  user_id: string;
  session_id: string;
  new_message: {
    role: string;
    parts: Array<{ text: string }>;
  };
  streaming: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isError?: boolean;
}
