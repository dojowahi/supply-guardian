
import type { SupplySnapshotData } from '../lib/types';

const BASE_URL = '/backend';

export class BackendClient {
  private static instance: BackendClient;

  private constructor() { }

  public static getInstance(): BackendClient {
    if (!BackendClient.instance) {
      BackendClient.instance = new BackendClient();
    }
    return BackendClient.instance;
  }

  async getSnapshot(): Promise<SupplySnapshotData> {
    try {
      console.log('[Backend] Fetching fresh snapshot data...');

      // Execute all 3 requests in parallel for maximum speed
      const [shipmentsRes, disruptionsRes, nodesRes] = await Promise.all([
        fetch(`${BASE_URL}/shipments`),
        fetch(`${BASE_URL}/network/disruptions`),
        fetch(`${BASE_URL}/network/nodes`)
      ]);

      if (!shipmentsRes.ok) throw new Error(`Failed to fetch shipments: ${shipmentsRes.status}`);
      if (!disruptionsRes.ok) throw new Error(`Failed to fetch disruptions: ${disruptionsRes.status}`);
      if (!nodesRes.ok) throw new Error(`Failed to fetch nodes: ${nodesRes.status}`);

      const shipmentsRaw = await shipmentsRes.json();
      const disruptionsRaw = await disruptionsRes.json();
      const nodesRaw = await nodesRes.json();

      // Transform Data for UI (Backend uses 'lon', Maps uses 'lng')
      const shipments = shipmentsRaw.map((s: any) => ({
        ...s,
        coordinates: s.current_location && typeof s.current_location === 'object'
          ? { lat: s.current_location.lat, lng: s.current_location.lon }
          : null,
        value: s.total_value_at_risk, // Map backend field to frontend prop
        mode: s.transport_mode, // Map backend field to frontend prop
        destination: s.destination_id // Map to destination so it appears in UI
      }));

      const nodes = nodesRaw.map((n: any) => ({
        ...n,
        coordinates: n.location // Backend sends 'location'
          ? { lat: n.location.lat, lng: n.location.lon }
          : null
      }));

      const disruptions = disruptionsRaw.map((d: any) => ({
        ...d,
        coordinates: d.location // Backend sends 'location'
          ? { lat: d.location.lat, lng: d.location.lon }
          : null,
        radius_meters: (d.radius_km || 0) * 1000 // Convert km to meters for circle drawing
      }));

      return {
        shipments,
        disruptions,
        nodes,
        timestamp: new Date().toISOString(),
        insights: "Live data from backend"
      };
    } catch (error) {
      console.error('[Backend] Snapshot Fetch Failed:', error);
      throw error;
    }
  }
}
