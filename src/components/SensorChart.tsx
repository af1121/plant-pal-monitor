import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { SensorData, PlantSettings } from "@/types/plant";

interface SensorChartProps {
  data: SensorData[];
  dataKey: keyof Omit<SensorData, "timestamp">;
  title: string;
  unit: string;
  settings: PlantSettings;
}

export function SensorChart({ data, dataKey, title, unit, settings }: SensorChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }));
  }, [data]);

  const capitalizedKey = dataKey.charAt(0).toUpperCase() + dataKey.slice(1);
  const minValue = settings[`min${capitalizedKey}`] ?? settings[`min${dataKey.toLowerCase()}`];
  const maxValue = settings[`max${capitalizedKey}`] ?? settings[`max${dataKey.toLowerCase()}`];

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <XAxis 
              dataKey="time" 
              reversed={true}
              height={40}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              width={40}
              tick={{ fontSize: 12 }}
            />
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
            {minValue !== undefined && (
              <ReferenceLine 
                y={minValue} 
                stroke="#FF6B6B" 
                strokeDasharray="3 3" 
                label={{ value: `Min: ${minValue}${unit}`, position: 'center' }}
              />
            )}
            {maxValue !== undefined && (
              <ReferenceLine 
                y={maxValue} 
                stroke="#FF6B6B" 
                strokeDasharray="3 3" 
                label={{ value: `Max: ${maxValue}${unit}`, position: 'center' }}
              />
            )}
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