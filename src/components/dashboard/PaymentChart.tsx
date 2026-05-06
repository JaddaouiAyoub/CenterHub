"use client";
import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PaymentChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-slate-900 text-2xl font-bold tracking-tight">
            {payload[0].value.toLocaleString()}
          </span>
          <span className="text-slate-400 text-xs font-semibold">DHS</span>
        </div>
      </div>
    );
  }
  return null;
};

export function PaymentChart({ data }: PaymentChartProps) {
  // Calcul dynamique de la croissance par rapport au mois précédent
  const growth = useMemo(() => {
    if (data.length < 2) return null;
    const current = data[data.length - 1].total;
    const previous = data[data.length - 2].total;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }, [data]);

  return (
    <div className="h-[420px] w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] group transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h3 className="text-slate-900 font-bold text-2xl tracking-tight">Activité Financière</h3>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Analyse des flux mensuels</p>
        </div>
        
        {growth !== null && (
          <div className={`px-4 py-2 rounded-2xl border flex flex-col items-end ${
            growth >= 0 
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' 
              : 'bg-rose-50/50 border-rose-100 text-rose-600'
          }`}>
            <span className="text-xs font-black tracking-tighter">
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-[10px] opacity-70 font-bold uppercase tracking-tighter text-slate-400">vs mois dernier</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height="70%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 4 }}>
          <defs>
            <linearGradient id="colorLightEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="0" 
            vertical={false} 
            stroke="#f1f5f9" 
          />

          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            dy={15}
          />

          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
          />

          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '6 6' }} 
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLightEmerald)"
            animationDuration={1500}
            activeDot={{ 
              r: 6, 
              fill: '#10b981', 
              stroke: '#ffffff', 
              strokeWidth: 4,
              className: "shadow-2xl" 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}