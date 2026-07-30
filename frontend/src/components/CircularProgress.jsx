import React from 'react';

export default function CircularProgress({ progress, text, subtext, isPaused, onPause, onStop }) {
    // progress is 0 to 100
    const radius = 120;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center bg-surface-container-low rounded-3xl p-8 w-full max-w-sm mx-auto shadow-inner border border-outline-variant/20">
            <div className="relative flex items-center justify-center">
                {/* Background Track */}
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    <circle
                        stroke="#222"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset: 0 }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    
                    {/* Tick marks around the circle (optional visual flair) */}
                    <g className="opacity-30">
                        {Array.from({ length: 60 }).map((_, i) => {
                            const angle = (i * 6 * Math.PI) / 180;
                            const innerRadius = normalizedRadius + 4;
                            const outerRadius = innerRadius + (i % 5 === 0 ? 8 : 4);
                            
                            const x1 = radius + innerRadius * Math.cos(angle);
                            const y1 = radius + innerRadius * Math.sin(angle);
                            const x2 = radius + outerRadius * Math.cos(angle);
                            const y2 = radius + outerRadius * Math.sin(angle);
                            
                            return (
                                <line 
                                    key={i} 
                                    x1={x1} y1={y1} x2={x2} y2={y2} 
                                    stroke="#444" 
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </g>
                    
                    {/* Progress Circle */}
                    <circle
                        stroke="#3b82f6" // blue-500
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ 
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 0.5s ease'
                        }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center text-on-surface">
                    <span className="text-5xl font-light tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {text}
                    </span>
                    {subtext && (
                        <span className="text-sm text-outline mt-2">
                            {subtext}
                        </span>
                    )}
                    {isPaused && (
                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">pause</span> Paused
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-8 mt-10">
                {/* Stop Button */}
                <button 
                    onClick={onStop}
                    className="w-16 h-16 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors shadow-lg active:scale-95"
                >
                    <div className="w-5 h-5 bg-primary rounded-sm"></div>
                </button>
                
                {/* Pause/Resume Button */}
                <button 
                    onClick={onPause}
                    className="w-16 h-16 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors shadow-lg active:scale-95"
                >
                    {isPaused ? (
                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-primary border-b-[10px] border-b-transparent ml-1"></div>
                    ) : (
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-5 bg-primary rounded-sm"></div>
                            <div className="w-1.5 h-5 bg-primary rounded-sm"></div>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
