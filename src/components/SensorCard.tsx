import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: "optimal" | "warning" | "critical";
}

export function SensorCard({ title, value, unit, icon, status }: SensorCardProps) {
  return (
    <Card className="glass-card overflow-hidden animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium sensor-label">{title}</CardTitle>
        <div className={cn(
          "text-plant",
          status === "warning" && "text-yellow-500",
          status === "critical" && "text-red-500"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="sensor-value">
          {value}
          <span className="text-xl ml-1">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}