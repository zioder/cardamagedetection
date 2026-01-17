'use client';

import { motion } from 'framer-motion';
import { Facebook, Linkedin, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const XIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.486 3.24H4.298l13.31 17.41z"></path>
    </svg>
);

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/5 py-12 px-6">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <Link href="/" className="flex items-center gap-3 text-white group">
                            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                                <Image 
                                    src="/PS-LOGO.png" 
                                    alt="Pixemantic Logo" 
                                    fill
                                    className="object-contain brightness-0 invert"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tight">
                                Pixemantic
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} Pixemantic. All rights reserved to Pixemantic.
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-6">
                        <div className="flex items-center gap-6">
                            <a 
                                href="https://pixemantic.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Website"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                            <a 
                                href="https://www.linkedin.com/company/pixemantic" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                title="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a 
                                href="https://www.facebook.com/pixemantic/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a 
                                href="https://x.com/pixemantic" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                title="X"
                            >
                                <XIcon />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
