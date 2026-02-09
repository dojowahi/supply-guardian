import React from 'react';
import { GoogleShipmentMap } from './GoogleShipmentMap';
import type { SupplySnapshotData } from '../../lib/types';

interface SnapshotRendererProps {
  data: SupplySnapshotData | null;
  mapView: { center: { lat: number; lng: number }; zoom: number } | null;
}

export const SnapshotRenderer: React.FC<SnapshotRendererProps> = ({ data, mapView }) => {
  // Calculate summary stats
  const activeShipments = data?.shipments?.length || 0;
  const delayedCount = data?.shipments?.filter(s => s.status === 'Delayed' || s.status === 'Stuck').length || 0;
  const totalValue = data?.shipments?.reduce((acc, s) => {
    if (s.status === 'Delayed' || s.status === 'Stuck') {
      return acc + (s.value || 0);
    }
    return acc;
  }, 0) || 0;

  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(totalValue);

  return (
    <div className="h-full w-full bg-zinc-950 flex font-mono border border-zinc-900 rounded-xl overflow-hidden shadow-2xl">

      {/* Left Panel - Stats & Header */}
      <div className="w-80 flex-none bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800 flex flex-col z-20 shadow-2xl relative">

        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <h1 className="text-zinc-100 font-semibold tracking-wide text-sm font-sans">Supply Guardian</h1>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium flex justify-between items-center px-1">
            <span>System Status</span>
            <span className="text-emerald-500 font-mono">OPERATIONAL</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* Stat Card 1 */}
          <div className="bg-zinc-800/40 border border-zinc-700/50 p-5 rounded-lg hover:bg-zinc-800/60 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Active Shipments</p>
              <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
            </div>
            <p className="text-3xl font-light text-zinc-100 tracking-tight">{activeShipments}</p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-zinc-800/40 border border-zinc-700/50 p-5 rounded-lg hover:bg-zinc-800/60 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Delay Impact</p>
              <div className={`w-2 h-2 rounded-full ${delayedCount > 0 ? 'bg-orange-500/80 animate-pulse' : 'bg-zinc-600/30'}`}></div>
            </div>
            <p className="text-3xl font-light text-zinc-100 tracking-tight">{delayedCount}</p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-zinc-800/40 border border-zinc-700/50 p-5 rounded-lg hover:bg-zinc-800/60 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Value at Risk due to Delay/Stuck Status</p>
              <div className={`w-2 h-2 rounded-full ${totalValue > 0 ? 'bg-emerald-500/50' : 'bg-zinc-600/30'}`}></div>
            </div>
            <p className="text-3xl font-light text-zinc-100 tracking-tight font-mono">{formattedValue}</p>
          </div>

          {/* Agent Status / Log placeholder could go here */}


        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-600 text-center uppercase tracking-wider">
          P88 Supply Network v2.4
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-black">
        <GoogleShipmentMap
          shipments={data?.shipments || []}
          disruptions={data?.disruptions || []}
          nodes={data?.nodes || []}
          center={mapView?.center}
          zoom={mapView?.zoom}
        />

        {/* Loading Overlay */}
        {!data && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-30">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_#dc2626]"></div>
              <p className="text-red-500/80 text-sm tracking-widest animate-pulse">ESTABLISHING LINK...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
