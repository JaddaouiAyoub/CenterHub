"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingBag, BookOpen, Star, Users, BarChart2 } from "lucide-react";
import type { PaidResourceAnalytics } from "@/types/paid-resources";
import { cn } from "@/lib/utils";

interface Props {
  data: PaidResourceAnalytics;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const TYPE_LABELS: Record<string, string> = { PDF: "PDF", IMAGE: "Images", VIDEO: "Vidéos" };

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-4")}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Format month label "2025-01" → "Janv 25"
const MONTHS_SHORT = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
function fmtMonth(key: string) {
  const [year, month] = key.split("-");
  return `${MONTHS_SHORT[parseInt(month) - 1]} ${year.slice(2)}`;
}

export function AnalyticsDashboard({ data }: Props) {
  const monthlyData = data.monthlyRevenue.map((m) => ({
    ...m,
    month: fmtMonth(m.month),
    revenue: Math.round(m.revenue),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus totaux"
          value={`${data.totalRevenue.toLocaleString("fr-MA")} MAD`}
          sub="Toutes périodes"
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <KpiCard
          label="Total des achats"
          value={String(data.totalPurchases)}
          sub="Transactions complétées"
          icon={ShoppingBag}
          color="bg-purple-500"
        />
        <KpiCard
          label="Ressources publiées"
          value={`${data.publishedResources} / ${data.totalResources}`}
          sub="Disponibles aux étudiants"
          icon={BookOpen}
          color="bg-green-500"
        />
        <KpiCard
          label="Prix moyen"
          value={`${data.averagePrice.toFixed(0)} MAD`}
          sub="Toutes ressources"
          icon={BarChart2}
          color="bg-amber-500"
        />
      </div>

      {/* Monthly revenue chart */}
      <ChartCard title="Revenus & Achats par mois (12 derniers mois)">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} MAD`} width={70} />
            <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(value: any, name: any) =>
                name === "revenue" ? [`${value} MAD`, "Revenus"] : [value, "Achats"]
              }
            />
            <Legend formatter={(v) => (v === "revenue" ? "Revenus (MAD)" : "Achats")} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
            <Bar yAxisId="cnt" dataKey="purchases" fill="#8b5cf6" opacity={0.8} radius={[3, 3, 0, 0]} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top resources */}
        <ChartCard title="Top 5 ressources (revenus)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topResources} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
              <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={130} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: any) => [`${v} MAD`, "Revenus"]}
              />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {data.topResources.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by type */}
        <ChartCard title="Revenus par type de fichier">
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.revenueByType}
                  dataKey="revenue"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => {
                    const label = name ? (TYPE_LABELS[name as string] ?? name) : "Inconnu";
                    const pct = typeof percent === "number" ? (percent * 100).toFixed(0) : "0";
                    return `${label} ${pct}%`;
                  }}
                  labelLine={false}
                >
                  {data.revenueByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [`${v} MAD`, TYPE_LABELS[name] ?? name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top subjects */}
        <ChartCard title="Top 5 matières (revenus)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topSubjects} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: any) => [`${v} MAD`, "Revenus"]} />
              <Bar dataKey="totalRevenue" fill="#10b981" radius={[0, 4, 4, 0]}>
                {data.topSubjects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top teachers */}
        <ChartCard title="Top 5 professeurs (revenus)">
          <div className="space-y-3 pt-1">
            {data.topTeachers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              data.topTeachers.map((t, i) => {
                const max = data.topTeachers[0]?.totalRevenue || 1;
                const pct = Math.round((t.totalRevenue / max) * 100);
                return (
                  <div key={t.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        {t.name}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {t.totalRevenue.toLocaleString("fr-MA")} MAD
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
