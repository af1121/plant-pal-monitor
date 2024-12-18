import { useEffect, useRef } from 'react';
import { SensorData } from '../types/plant';
import React from 'react';

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

    // Calculate plant health based on sensor data (0-1)
    const getHealthScore = () => {
      const tempHealth = 1 - Math.abs(currentData.temperature - 23) / 15; // Optimal around 23°C
      const humidityHealth = 1 - Math.abs(currentData.humidity - 50) / 50; // Optimal around 50%
      const soilHealth = 1 - Math.abs(currentData.soilmoisture - 50) / 50; // Optimal around 50%
      const lightHealth = Math.min(currentData.light / 1000, 1); // More light is generally better up to 1000 lux

      return Math.max(0, Math.min(1, (tempHealth + humidityHealth + soilHealth + lightHealth) / 4));
    };

    const health = getHealthScore();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw soil in pot
    const drawSoil = () => {
      ctx.fillStyle = '#3D2817';
      ctx.beginPath();
      ctx.moveTo(60, 180);
      ctx.lineTo(140, 180);
      ctx.lineTo(120, 220);
      ctx.lineTo(80, 220);
      ctx.closePath();
      ctx.fill();

      // Add soil texture
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.strokeStyle = '#2A1810';
        ctx.moveTo(70 + i * 7, 190);
        ctx.lineTo(75 + i * 7, 200);
        ctx.stroke();
      }
    };

    // Draw pot with gradient
    const drawPot = () => {
      const gradient = ctx.createLinearGradient(60, 180, 140, 180);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(0.5, '#A0522D');
      gradient.addColorStop(1, '#8B4513');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(60, 180);
      ctx.lineTo(140, 180);
      ctx.lineTo(120, 220);
      ctx.lineTo(80, 220);
      ctx.closePath();
      ctx.fill();

      // Add pot highlight
      ctx.strokeStyle = '#CD853F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 180);
      ctx.lineTo(140, 180);
      ctx.stroke();
    };

    // Enhanced leaf drawing with veins
    const drawLeaf = (x: number, y: number, angle: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Create gradient for leaf
      const gradient = ctx.createLinearGradient(-15 * size, 0, 15 * size, 0);
      gradient.addColorStop(0, `rgb(${76 + (1-health)*50}, ${175 + (1-health)*30}, ${80})`);
      gradient.addColorStop(0.5, `rgb(${86 + (1-health)*50}, ${185 + (1-health)*30}, ${90})`);
      gradient.addColorStop(1, `rgb(${76 + (1-health)*50}, ${175 + (1-health)*30}, ${80})`);

      // Draw main leaf shape
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 15, size * 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw leaf veins
      ctx.strokeStyle = `rgba(${70 + (1-health)*50}, ${160 + (1-health)*30}, ${75}, 0.5)`;
      ctx.lineWidth = 1;
      
      // Main vein
      ctx.beginPath();
      ctx.moveTo(-size * 15, 0);
      ctx.lineTo(size * 15, 0);
      ctx.stroke();

      // Secondary veins
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 10 * Math.cos(i * 0.3), size * 6 * Math.sin(i * 0.3));
        ctx.stroke();
      }

      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now() / 1000;
      const windEffect = Math.sin(currentTime) * 0.1;
      
      drawPot();
      drawSoil();

      // Draw stem with gradient
      const stemGradient = ctx.createLinearGradient(100, 180, 100, 100);
      stemGradient.addColorStop(0, '#2E7D32');
      stemGradient.addColorStop(1, '#4CAF50');
      
      ctx.strokeStyle = stemGradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, 180);
      ctx.quadraticCurveTo(
        100 + Math.sin(currentTime) * 5,
        140,
        100 + Math.sin(currentTime) * 3,
        100
      );
      ctx.stroke();

      // Draw leaves with slight movement
      drawLeaf(80, 150, Math.PI / 4 + windEffect, health);
      drawLeaf(120, 130, -Math.PI / 4 + windEffect, health);
      drawLeaf(90, 110, Math.PI / 6 + windEffect, health);
      drawLeaf(110, 90, -Math.PI / 6 + windEffect, health);
    };

    animate();

    return () => {
      // Cleanup animation on unmount
      canvas.width = canvas.width;
    };
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