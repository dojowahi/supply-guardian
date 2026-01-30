export interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-[#171717]/90 border border-white/10 p-4 rounded-lg backdrop-blur-sm shadow-lg">
      <div className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{label}</div>
      <div className="text-2xl font-bold text-white mt-1 font-sans">{value}</div>
    </div>
  );
}
