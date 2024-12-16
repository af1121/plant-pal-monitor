import { useEffect, useRef } from 'react';
import { SensorData } from '@/types/plant';

interface PlantVisualizationProps {
  currentData: SensorData;
  className?: string;
}

export function PlantVisualization({ currentData, className }: PlantVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate plant health (0-1)
    const health = Math.min(
      currentData.soilMoisture / 100,
      currentData.humidity / 100,
      Math.min(currentData.lightLevel, 5000) / 5000
    );

    // Draw pot
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.lineTo(140, 180);
    ctx.lineTo(120, 220);
    ctx.lineTo(80, 220);
    ctx.closePath();
    ctx.fill();

    // Draw stem
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 180);
    ctx.quadraticCurveTo(
      100 + Math.sin(Date.now() / 1000) * 10,
      140,
      100,
      100
    );
    ctx.stroke();

    // Draw leaves
    const drawLeaf = (x: number, y: number, angle: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `rgb(${76 + (1-health)*50}, ${175 + (1-health)*30}, ${80})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 15, size * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Draw multiple leaves
    const time = Date.now() / 1000;
    drawLeaf(80, 150, Math.PI / 4 + Math.sin(time) * 0.1, health);
    drawLeaf(120, 130, -Math.PI / 4 + Math.sin(time + 1) * 0.1, health);
    drawLeaf(90, 110, Math.PI / 6 + Math.sin(time + 2) * 0.1, health);
    drawLeaf(110, 90, -Math.PI / 6 + Math.sin(time + 3) * 0.1, health);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw everything
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(60, 180);
      ctx.lineTo(140, 180);
      ctx.lineTo(120, 220);
      ctx.lineTo(80, 220);
      ctx.closePath();
      ctx.fill();

      const currentTime = Date.now() / 1000;
      
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, 180);
      ctx.quadraticCurveTo(
        100 + Math.sin(currentTime) * 10,
        140,
        100,
        100
      );
      ctx.stroke();

      drawLeaf(80, 150, Math.PI / 4 + Math.sin(currentTime) * 0.1, health);
      drawLeaf(120, 130, -Math.PI / 4 + Math.sin(currentTime + 1) * 0.1, health);
      drawLeaf(90, 110, Math.PI / 6 + Math.sin(currentTime + 2) * 0.1, health);
      drawLeaf(110, 90, -Math.PI / 6 + Math.sin(currentTime + 3) * 0.1, health);
    };

    animate();
  }, [currentData]);

  return (
    <div className={`glass-card p-4 ${className}`}>
      <canvas
        ref={canvasRef}
        width={200}
        height={240}
        className="mx-auto"
      />
    </div>
  );
}