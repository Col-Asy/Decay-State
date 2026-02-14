import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DecayDemo } from './components/DecayDemo';
import { AIPrompt } from './components/AIPrompt';
import { Manifesto } from './components/Manifesto';
import { Methodology } from './components/Methodology';
import { FAQ } from './components/FAQ';
import { Pricing } from './components/Pricing';
import { ShieldAlert, Github, Twitter, MapPin } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="bg-background text-foreground selection:bg-accent selection:text-black font-sans">
      <Hero />

      <div className="relative">
        {/* Decorative Grid Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 -translate-x-1/2 hidden lg:block" />

        <div id="features"><DecayDemo /></div>
        <div id="demo"><AIPrompt /></div>
        <div id="manifesto"><Manifesto /></div>
        <Methodology />
        <div id="pricing"><Pricing /></div>
        <FAQ />
      </div>

      <footer className="py-20 px-6 border-t border-white/5 bg-black relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none select-none w-full text-center">
          <span className="font-display font-black text-[15vw] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent whitespace-nowrap opacity-70">DECAYSTATE</span>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12 relative z-10">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent flex items-center justify-center font-bold text-black text-[10px]">D</div>
              <span className="font-display font-black text-xl tracking-tighter uppercase">DECAYSTATE</span>
            </div>
            <p className="text-[10px] uppercase text-muted-foreground tracking-[0.2em] leading-relaxed">
              We do not accept excuses. We do not provide comfort. We only provide the mirror to your own ambition.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System</h4>
              <ul className="text-[10px] uppercase tracking-widest text-muted-foreground space-y-2">
                <li><a href="#" className="hover:text-accent">Protocol</a></li>
                <li><a href="#" className="hover:text-accent">Logic</a></li>
                <li><a href="#" className="hover:text-accent">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Social</h4>
              <ul className="text-[10px] uppercase tracking-widest text-muted-foreground space-y-2">
                <li><a href="#" className="hover:text-accent">Twitter</a></li>
                <li><a href="#" className="hover:text-accent">Discord</a></li>
                <li><a href="#" className="hover:text-accent">Terminal</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[8px] uppercase tracking-[0.3em] text-white/20 relative z-10">
          <span>© 2026 DECAYSTATE ARCHIVE</span>
          <div className="flex gap-4 items-center">
            <ShieldAlert className="w-3 h-3" />
            <span>STRICT_PROTOCOL: ACTIVE</span>
          </div>
        </div>
      </footer>
    </main>
  );
}