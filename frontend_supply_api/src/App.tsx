import { useState, useEffect } from 'react';
import { getNodes, getShipments, getDisruptions } from './api';
import type { Node, Shipment, Disruption } from './types';
import { LeafletMap } from './components/map/LeafletMap';
import { StatCard } from './components/ui/StatCard';

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [n, s, d] = await Promise.all([
          getNodes(),
          getShipments(),
          getDisruptions()
        ]);
        setNodes(n);
        setShipments(s);
        setDisruptions(d);
        setLoading(false);
      } catch (e) {
        console.error("Uplink Failed:", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const delayedCount = shipments.filter(s => s.status === 'Delayed' || s.status === 'Stuck').length;
  // Use a safer check for value_at_risk in case it's missing or 0
  const valueAtRisk = shipments
    .filter(s => s.status === 'Stuck' || s.status === 'Delayed')
    .reduce((acc, s) => acc + (s.total_value_at_risk || 0), 0);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#171717] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-[#171717]/95 backdrop-blur z-50">
        <div className="text-[#cc0000] font-bold text-xl tracking-tighter flex items-center gap-2">
          <div className="w-3 h-3 bg-[#cc0000] rounded-full animate-pulse"></div>
          SUPPLY GUARDIAN
        </div>
        <div className="ml-auto flex gap-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest self-center font-mono">
            {loading ? 'INITIALIZING...' : 'SYSTEM ONLINE'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Overlay HUD */}
        <div className="absolute top-4 left-4 z-[1001] flex flex-col gap-2 w-64 pointer-events-none">
          <div className="pointer-events-auto">
            <StatCard label="Active Shipments" value={shipments.length} />
          </div>
          <div className="pointer-events-auto">
            <StatCard label="Delay Impact" value={delayedCount} />
          </div>
          <div className="pointer-events-auto">
            <StatCard
              label="Value at Risk"
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(valueAtRisk)}
            />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 h-full w-full relative z-0">
          <LeafletMap nodes={nodes} shipments={shipments} disruptions={disruptions} />
        </div>
      </div>

      {/* Scanlines & Atmosphere */}
      <div className="scanlines"></div>
    </div>
  );
}

export default App;
