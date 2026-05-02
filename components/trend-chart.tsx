"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TrendDataPoint {
  date: string
  visibility: number
  ranking: number
  recommendation: number
  shareOfVoice: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
}

const METRICS = [
  { key: "all", label: "All Metrics" },
  { key: "visibility", label: "Visibility", color: "#3B5BDB" },
  { key: "ranking", label: "Average Ranking", color: "#10B981" },
  { key: "recommendation", label: "Recommendation Rate", color: "#F59E0B" },
  { key: "shareOfVoice", label: "Share of Voice", color: "#64748B" },
]

export function TrendChart({ data }: TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("all")

  const getVisibleMetrics = () => {
    if (selectedMetric === "all") {
      return METRICS.filter((m) => m.key !== "all")
    }
    return METRICS.filter((m) => m.key === selectedMetric)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-card-foreground">
          Performance Trends
        </h3>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E5E5" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E5E5" }}
              domain={selectedMetric === "ranking" ? [0, 10] : [0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              labelStyle={{ color: "#0F0F0F", fontWeight: 500 }}
            />
            <Legend />
            {getVisibleMetrics().map((metric) => (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
