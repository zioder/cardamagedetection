'use client';

import { useState, useCallback } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
    onImageSelect: (file: File) => void;
    selectedImage: string | null;
    onClear: () => void;
}

export default function UploadZone({ onImageSelect, selectedImage, onClear }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        }
    }, [onImageSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    }, [onImageSelect]);

    return (
        <div className="w-full">
            <AnimatePresence>
                {!selectedImage ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                            "relative group cursor-pointer transition-all duration-300 ease-out",
                            "border-2 border-dashed rounded-3xl h-80 flex flex-col items-center justify-center gap-4",
                            "bg-slate-900/40 backdrop-blur-sm",
                            isDragging
                                ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
                                : "border-slate-700 hover:border-violet-400/50 hover:bg-slate-800/50"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept="image/*"
                            onChange={handleChange}
                        />

                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center paper shadow-xl shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-10 h-10 text-white" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold text-white group-hover:text-violet-200 transition-colors">
                                Upload Vehicle Image
                            </h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                Drag & drop your customized car photo here, or click to browse
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 group"
                    >
                        <img
                            src={selectedImage}
                            alt="Selected vehicle"
                            className="w-full h-80 object-contain bg-grid"
                        />

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button
                                onClick={onClear}
                                className="bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transform hover:scale-105 transition-all"
                            >
                                <X className="w-5 h-5" />
                                Remove Image
                            </button>
                        </div>

                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                            <FileImage className="w-4 h-4 text-violet-400" />
                            <span className="text-xs font-medium text-gray-300">Image Loaded</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
