'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
        >
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                        <Image 
                            src="/PS-LOGO.png" 
                            alt="Pixemantic Logo" 
                            fill
                            className="object-contain brightness-0 invert"
                        />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">
                        Pixemantic
                    </span>
                </Link>
            </div>
        </motion.nav>
    );
}
