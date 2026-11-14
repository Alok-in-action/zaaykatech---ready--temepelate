"use client";
import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

interface FeatureWithImageComparisonProps {
    badge?: string;
    title?: string;
    description?: string;
    beforeImage: { src: string; alt: string };
    afterImage: { src: string; alt: string };
    beforeLabel?: string;
    afterLabel?: string;
}

function FeatureWithImageComparison({
    badge = "Platform",
    title = "See the Difference",
    description = "Drag the slider to compare traditional vs digital menus.",
    beforeImage,
    afterImage,
    beforeLabel = "Before",
    afterLabel = "After",
}: FeatureWithImageComparisonProps) {
    const [inset, setInset] = useState<number>(50);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const calcPercent = useCallback((clientX: number) => {
        if (!containerRef.current) return 50;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return 50;
        const percentage = ((clientX - rect.left) / rect.width) * 100;
        return Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));
    }, []);

    const startDrag = useCallback(
        (clientX: number, pointerId?: number, currentTarget?: HTMLDivElement) => {
            isDraggingRef.current = true;
            setIsDragging(true);
            setInset(calcPercent(clientX));

            if (pointerId !== undefined && currentTarget && typeof currentTarget.setPointerCapture === 'function') {
                try {
                    currentTarget.setPointerCapture(pointerId);
                } catch {
                    // Ignore pointer capture failures on platforms without capture support
                }
            }
        },
        [calcPercent]
    );

    const endDrag = useCallback(
        (pointerId?: number, currentTarget?: HTMLDivElement) => {
            isDraggingRef.current = false;
            setIsDragging(false);

            if (pointerId !== undefined && currentTarget && typeof currentTarget.releasePointerCapture === 'function') {
                try {
                    currentTarget.releasePointerCapture(pointerId);
                } catch {
                    // Ignore release errors
                }
            }
        },
        []
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            startDrag(e.clientX, e.pointerId, e.currentTarget);
        },
        [startDrag]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current) return;
            setInset(calcPercent(e.clientX));
        },
        [calcPercent]
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            endDrag(e.pointerId, e.currentTarget);
        },
        [endDrag]
    );

    // Keyboard navigation for accessibility
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const step = e.shiftKey ? 10 : 5;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            setInset((prev) => Math.max(0, prev - step));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            setInset((prev) => Math.min(100, prev + step));
        } else if (e.key === 'Home') {
            e.preventDefault();
            setInset(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            setInset(100);
        } else if (e.key === 'PageDown') {
            e.preventDefault();
            setInset((prev) => Math.max(0, prev - 20));
        } else if (e.key === 'PageUp') {
            e.preventDefault();
            setInset((prev) => Math.min(100, prev + 20));
        }
    }, []);

    return (
        <div className="w-full">
            <div className="flex flex-col gap-4">
                <div>
                    <Badge variant="outline">{badge}</Badge>
                </div>
                <div className="flex gap-2 flex-col">
                    <h3 className="text-2xl md:text-3xl tracking-tighter font-bold">{title}</h3>
                    <p className="text-base leading-relaxed tracking-tight text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="pt-4 w-full">
                    {/* Comparison image area with touch-pan-y so vertical page scroll is preserved */}
                    <div
                        ref={containerRef}
                        role="slider"
                        tabIndex={0}
                        aria-label="Comparison slider: Traditional Paper vs ZaaykaTech QR"
                        aria-valuenow={Math.round(inset)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuetext={`${Math.round(inset)}% ${beforeLabel}, ${100 - Math.round(inset)}% ${afterLabel}`}
                        onKeyDown={handleKeyDown}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={`relative aspect-video w-full overflow-hidden rounded-2xl select-none cursor-ew-resize touch-pan-y focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isDragging ? 'cursor-grabbing' : ''
                        }`}
                    >
                        {/* Corner labels */}
                        <div className="absolute top-3 left-3 z-30 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md pointer-events-none font-medium shadow-sm">
                            {beforeLabel}
                        </div>
                        <div className="absolute top-3 right-3 z-30 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md pointer-events-none font-medium shadow-sm">
                            {afterLabel}
                        </div>

                        {/* Divider line & Drag Handle */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
                            style={{ left: `${inset}%`, transition: isDragging ? 'none' : 'left 80ms ease-out' }}
                        >
                            {/* Handle button */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-neutral-800 rounded-full shadow-2xl w-10 h-10 flex items-center justify-center border-2 border-primary/20 pointer-events-none">
                                <GripVertical className="h-5 w-5 text-neutral-600" />
                            </div>
                        </div>

                        {/* After image — always visible underneath */}
                        <Image
                            src={afterImage.src}
                            alt={afterImage.alt}
                            fill
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl select-none pointer-events-none"
                        />

                        {/* Before image — clipped to left side */}
                        <Image
                            src={beforeImage.src}
                            alt={beforeImage.alt}
                            fill
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl select-none pointer-events-none z-10"
                            style={{
                                clipPath: `inset(0 ${100 - inset}% 0 0)`,
                                transition: isDragging ? 'none' : 'clip-path 80ms ease-out',
                            }}
                        />
                    </div>

                    {/* Accessible Range Slider Control (Available on all screen sizes) */}
                    <div className="mt-4 px-1">
                        <label htmlFor="comparison-range-slider" className="sr-only">
                            Traditional Paper vs ZaaykaTech QR comparison position
                        </label>
                        <input
                            id="comparison-range-slider"
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(inset)}
                            onChange={(e) => setInset(Number(e.target.value))}
                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Comparison slider position"
                        />
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground mt-2 px-1">
                            <span className="flex items-center gap-1">← {beforeLabel} ({Math.round(inset)}%)</span>
                            <span className="flex items-center gap-1">({100 - Math.round(inset)}%) {afterLabel} →</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { FeatureWithImageComparison };
