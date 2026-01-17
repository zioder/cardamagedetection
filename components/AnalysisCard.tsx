'use client';

import { motion } from 'framer-motion';
import { BadgeAlert, CheckCircle2, Wrench, Banknote, Car } from 'lucide-react';
interface AnalysisCardProps {
    analysis: any;
    currencySymbol: string;
}

export default function AnalysisCard({ analysis, currencySymbol }: AnalysisCardProps) {
    if (!analysis) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 sm:p-10 space-y-10 border border-white/10"
        >
            <div className="flex items-center gap-4 mb-2">
                <div className="p-4 rounded-2xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30">
                    <Banknote className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">Detailed Cost Analysis</h3>
                    <p className="text-gray-400 font-medium">AI-Estimated repairs based on current market data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Vehicle & Damages */}
                <div className="space-y-8">
                    {/* Vehicle Info */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/5">
                                <Car className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Identified Vehicle</p>
                                <p className="text-xl font-bold text-white">
                                    {analysis.carModel?.year} {analysis.carModel?.make} {analysis.carModel?.model}
                                </p>
                            </div>
                        </div>
                        <BadgeAlert className="w-6 h-6 text-yellow-500/80 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Damage List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                            <Wrench className="w-4 h-4 text-violet-400" /> Detected Damages
                        </h4>
                        <div className="space-y-3">
                            {analysis.damages?.map((damage: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-violet-500/30 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-gray-200">{damage.type}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${damage.severity === 'severe' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' :
                                            damage.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30' :
                                                'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                                            }`}>
                                            {damage.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{damage.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Costs & Sources */}
                <div className="space-y-8">
                    {/* Cost Breakdown */}
                    {analysis.costEstimate && (
                        <div className="rounded-3xl bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent border border-violet-500/20 p-8 space-y-6 shadow-2xl shadow-violet-900/10">
                            {/* Parts */}
                            {analysis.costEstimate.parts?.length > 0 && (
                                <div className="space-y-3 pb-6 border-b border-white/5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Estimate Breakdown</p>
                                    <div className="space-y-2">
                                        {analysis.costEstimate.parts.map((part: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm group">
                                                <span className="text-gray-400 group-hover:text-gray-200 transition-colors">
                                                    {part.name}
                                                </span>
                                                <span className="font-mono text-white font-bold">
                                                    {currencySymbol}{part.cost.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Labor */}
                            <div className="flex justify-between items-center py-2">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-sm">Labor Intensity</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{analysis.costEstimate.laborHours} Work Hours</span>
                                </div>
                                <span className="font-mono text-white font-bold">
                                    {currencySymbol}{analysis.costEstimate.laborTotal.toLocaleString()}
                                </span>
                            </div>

                            {/* Total */}
                            <div className="pt-6 flex items-center justify-between border-t-2 border-dashed border-white/10">
                                <div>
                                    <p className="text-sm font-bold text-violet-400 uppercase tracking-wider">Total Estimate</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Estimated tax/fees included</p>
                                </div>
                                <div className="text-4xl font-black text-white drop-shadow-glow">
                                    {currencySymbol}{analysis.costEstimate.grandTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* Recommended Action */}
            {analysis.repairRecommendation && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-4 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm italic items-start"
                >
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-blue-400" />
                    <div className="space-y-1">
                        <p className="font-bold text-blue-300 uppercase text-[10px] tracking-widest">Expert Recommendation</p>
                        <p className="leading-relaxed font-medium">{analysis.repairRecommendation}</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
