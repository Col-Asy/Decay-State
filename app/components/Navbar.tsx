"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent flex items-center justify-center font-bold text-black text-xs">INS</div>
                <span className="font-display font-bold tracking-tighter text-xl">INSANE</span>
            </div>

            <div className="hidden md:flex gap-8 text-[10px] tracking-[0.2em] font-medium text-muted-foreground uppercase">
                <a href="#manifesto" className="hover:text-accent transition-colors">Manifesto</a>
                <a href="#features" className="hover:text-accent transition-colors">/ Features</a>
                <a href="#pricing" className="hover:text-accent transition-colors">/ Pricing</a>
            </div>
        </nav>
    );
};
