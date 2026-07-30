import React, { useRef, useEffect, useState } from 'react';

export default function WheelPicker({ columns, value, onChange }) {
    return (
        <div className="wheel-picker-container flex justify-center items-center relative overflow-hidden bg-surface-container-low text-on-surface h-56 rounded-2xl w-full max-w-sm mx-auto shadow-inner border border-outline-variant/20">
            {/* Selection highlight bar */}
            <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 pointer-events-none flex justify-center gap-10 bg-primary/10 border-y border-primary/20">
                {columns.map((col) => (
                    <div key={`hl-${col.name}`} className="flex-1 max-w-[80px]"></div>
                ))}
            </div>
            
            <div className="flex w-full justify-center gap-2 px-4 relative z-10">
                {columns.map((col) => (
                    <WheelColumn 
                        key={col.name} 
                        options={col.options} 
                        value={value[col.name]} 
                        onChange={(val) => onChange(col.name, val)} 
                    />
                ))}
            </div>
            
            {/* Gradient overlays for fading effect */}
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-surface-container-low to-transparent pointer-events-none z-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none z-20"></div>
        </div>
    );
}

function WheelColumn({ options, value, onChange }) {
    const scrollRef = useRef(null);
    const itemHeight = 48; // h-12 in tailwind is 3rem = 48px
    const [isScrolling, setIsScrolling] = useState(false);
    let scrollTimeout = useRef(null);
    
    // We duplicate the options to create an infinite scroll illusion
    // Layout: [Copy 1] [Copy 2 (Center)] [Copy 3]
    const repeatedOptions = [...options, ...options, ...options];
    const centerOffset = options.length; // index offset for the middle copy

    // Initial scroll setup
    useEffect(() => {
        if (!isScrolling && scrollRef.current) {
            const valIndex = options.indexOf(value);
            if (valIndex !== -1) {
                // Scroll to the item in the middle copy
                scrollRef.current.scrollTop = (valIndex + centerOffset) * itemHeight;
            }
        }
    }, [value, options, centerOffset, isScrolling]);

    const handleScroll = (e) => {
        setIsScrolling(true);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        
        scrollTimeout.current = setTimeout(() => {
            const scrollTop = e.target.scrollTop;
            const index = Math.round(scrollTop / itemHeight);
            
            // Determine actual value from the repeated array
            const actualValue = repeatedOptions[index];
            if (actualValue !== undefined && actualValue !== value) {
                onChange(actualValue);
            }

            // Infinite loop adjustment: if we scrolled into Copy 1 or Copy 3, snap back to Copy 2 silently
            if (index < centerOffset || index >= centerOffset * 2) {
                const normalizedIndex = index % options.length;
                const targetScroll = (normalizedIndex + centerOffset) * itemHeight;
                
                // Disable smooth scroll temporarily to jump
                e.target.style.scrollBehavior = 'auto';
                e.target.scrollTop = targetScroll;
                // Restore smooth scroll behavior for snap
                setTimeout(() => {
                    e.target.style.scrollBehavior = 'smooth';
                }, 10);
            }
            
            setIsScrolling(false);
        }, 150);
    };

    return (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 h-56 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
            style={{ 
                padding: `${itemHeight * 2}px 0`,
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth'
            }}
        >
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {repeatedOptions.map((opt, i) => {
                // Determine if this exact DOM element represents the currently selected value 
                // in the active view (mostly for styling). 
                // A simpler approach: just check if opt === value.
                const isSelected = opt === value;
                return (
                    <div 
                        key={`${opt}-${i}`} 
                        className="h-12 flex justify-center items-center snap-center cursor-pointer transition-all duration-200"
                        onClick={() => {
                            onChange(opt);
                            if (scrollRef.current) {
                                const targetIndex = i; // click on specific item
                                scrollRef.current.scrollTo({
                                    top: targetIndex * itemHeight,
                                    behavior: 'smooth'
                                });
                            }
                        }}
                    >
                        <span className={`text-3xl transition-all duration-200 ${isSelected ? 'text-primary font-bold scale-110' : 'text-outline font-light scale-90'}`}>
                            {String(opt).padStart(2, '0')}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
