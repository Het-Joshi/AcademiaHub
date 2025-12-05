import React, { useEffect, useRef } from "react";

export default function ZenKnowledgeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Track mouse position
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    // Config
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 25 : 50;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- 1. Cleaner Color System ---
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const palette = {
      petalLight: "#fbcfe8", // Pink-200
      petalDark: "#f472b6",  // Pink-400
      leafLight: "#bbf7d0",  // Green-200
      leafDark: "#4ade80",   // Green-400
      cream: "#fffbeb",      // Amber-50 (Warm white)
      beige: "#fef3c7",      // Amber-100
    };

    // --- 2. Base Particle Class ---
    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      angle: number;
      spin: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = 0;
        this.speedY = 0;
        this.speedX = 0;
        this.angle = 0;
        this.spin = 0;
        this.opacity = 0;
      }

      updatePhysics() {
        this.y += this.speedY;
        // Natural ambient sway (sine wave)
        this.x += this.speedX + Math.sin(time * 0.5 + this.y * 0.005) * 0.3;
        this.angle += this.spin;

        // --- 3. Subtler Mouse Interaction (Water Displacement) ---
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 200; // Larger radius, softer falloff

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          // Gently push away
          this.x += Math.cos(angle) * force * 1.5; 
          this.y += Math.sin(angle) * force * 1.5;
        }

        // Screen Wrap
        if (this.y > canvas!.height + 50) {
          this.y = -50;
          this.x = Math.random() * canvas!.width;
        }
        if (this.x > canvas!.width + 50) this.x = -50;
        if (this.x < -50) this.x = canvas!.width + 50;
      }
    }

    class BambooLeaf extends Particle {
      constructor() {
        super();
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 8 + 6;
        this.speedY = Math.random() * 0.2 + 0.1; // Slower, more zen
        this.speedX = Math.random() * 0.2 - 0.1;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.01;
        this.opacity = Math.random() * 0.3 + 0.1;
      }

      update() {
        this.updatePhysics();
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;

        ctx.fillStyle = hexToRgba(palette.leafLight, 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = hexToRgba(palette.leafDark, 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();

        ctx.restore();
      }
    }

    class LotusPetal extends Particle {
      color: string;

      constructor() {
        super();
        this.reset();
        this.color = Math.random() > 0.5 ? palette.petalLight : palette.petalDark;
      }

      reset() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 10 + 4;
        this.speedY = Math.random() * 0.3 + 0.1;
        this.speedX = Math.random() * 0.2 - 0.1;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.015;
        this.opacity = Math.random() * 0.4 + 0.1;
      }

      update() {
        this.updatePhysics();
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, hexToRgba(this.color, 0.8));
        gradient.addColorStop(1, hexToRgba(this.color, 0.1));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.bezierCurveTo(this.size, -this.size, this.size, this.size, 0, this.size);
        ctx.bezierCurveTo(-this.size, this.size, -this.size, -this.size, 0, -this.size);
        ctx.fill();

        ctx.restore();
      }
    }

    // --- 4. Refined Central Lotus (Matches Theme) ---
    const drawCentralLotus = () => {
      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;
      const baseRadius = Math.min(canvas!.width, canvas!.height) * 0.35;
      
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(time * 0.02); // Slower rotation
      ctx!.translate(-cx, -cy);
      
      // Outer Glow
      ctx!.globalAlpha = 0.15;
      const outerGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.5);
      outerGlow.addColorStop(0, hexToRgba(palette.petalLight, 0.4));
      outerGlow.addColorStop(1, "transparent");
      ctx!.fillStyle = outerGlow;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius * 1.5, 0, Math.PI * 2);
      ctx!.fill();
      
      // Petals
      const petalCount = 12;
      ctx!.globalAlpha = 0.2; // Subtle watermark feel
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        // Independent breathing for organic feel
        const breathingScale = 1 + Math.sin(time * 0.5 + i) * 0.02; 
        
        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.rotate(angle);
        ctx!.scale(breathingScale, breathingScale);
        
        // Use Palette Colors
        const pGrad = ctx!.createLinearGradient(0, 0, 0, -baseRadius);
        pGrad.addColorStop(0, hexToRgba(palette.petalLight, 0.1));
        pGrad.addColorStop(0.5, hexToRgba(palette.petalDark, 0.3)); 
        pGrad.addColorStop(1, hexToRgba(palette.petalDark, 0.5));
        
        ctx!.fillStyle = pGrad;
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.quadraticCurveTo(baseRadius * 0.4, -baseRadius * 0.5, 0, -baseRadius);
        ctx!.quadraticCurveTo(-baseRadius * 0.4, -baseRadius * 0.5, 0, 0);
        ctx!.fill();
        
        ctx!.restore();
      }
      ctx!.restore();
    };

    const particles: (LotusPetal | BambooLeaf)[] = [];
    for (let i = 0; i < particleCount; i++) {
      if (Math.random() > 0.4) {
        particles.push(new LotusPetal());
      } else {
        particles.push(new BambooLeaf());
      }
    }

    const draw = () => {
      time += 0.01;
      
      // Cream/Beige Background
      const bgGradient = ctx!.createLinearGradient(0, 0, 0, canvas!.height);
      bgGradient.addColorStop(0, palette.cream);
      bgGradient.addColorStop(1, palette.beige);
      ctx!.fillStyle = bgGradient;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      drawCentralLotus();

      particles.forEach(p => {
        p.update();
        p.draw();
      });

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
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}