"use client";
import React, { useEffect, useRef } from "react";

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    // Resize handling
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Particles
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.fillStyle = "#0f172a"; // Dark blue/slate background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Starfield (Particles)
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Jupiter & Rings
      // Calculate position relative to center for parallax
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Tilt rings based on mouse
      const tiltX = (mouseX - centerX) * 0.0005;
      const tiltY = (mouseY - centerY) * 0.0005;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Draw Planet Body
      const gradient = ctx.createRadialGradient(-20, -20, 10, 0, 0, 150);
      gradient.addColorStop(0, "#d97706"); // Amber
      gradient.addColorStop(0.5, "#92400e"); // Darker Orange
      gradient.addColorStop(1, "#451a03"); // Brown
      
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 50;
      ctx.shadowColor = "#d97706";
      ctx.fill();

      // Draw Rings
      ctx.rotate(Math.PI / 4 + tiltX); // Base rotation + mouse tilt
      ctx.scale(1, 0.3 + tiltY); // Flatten circle to ellipse + mouse tilt

      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)"; // Amber ring
      ctx.lineWidth = 20;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 170, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.2)"; // Outer faint ring
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}