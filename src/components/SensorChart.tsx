import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SensorData } from "@/types/plant";

interface SensorChartProps {
  data: SensorData[];
  dataKey: keyof Omit<SensorData, "timestamp">;
  title: string;
  unit: string;
}

export function SensorChart({ data, dataKey, title, unit }: SensorChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString(),
    }));
  }, [data]);

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value;
                  const displayValue = typeof value === 'number' 
                    ? value.toFixed(1) 
                    : value;
                  return (
                    <div className="glass-card p-2">
                      <p className="text-sm font-medium">
                        {displayValue} {unit}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#4CAF50"
              fill="#4CAF50"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}