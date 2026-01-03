
import React, { useState, useEffect } from 'react';
import { X, Check, Lock, CreditCard, Sparkles, Shield, User, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import costDashboard from '../data/costs-dashboard.json';
import { CREDITS_PACK_PRICE, CREDITS_PER_PACK } from '../constants';

const triggerImpulse = (type: 'click' | 'hover' | 'type', intensity: number = 1.0) => {
    const event = new CustomEvent('ui-interaction', { detail: { type, intensity } });
    window.dispatchEvent(event);
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        if (isOpen) triggerImpulse('click', 0.8);
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { triggerImpulse('click', 0.5); onClose(); }} />
            <div className="relative bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-zoom-out overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                    <button 
                        onClick={() => { triggerImpulse('click', 0.5); onClose(); }} 
                        className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

type CostDashboard = typeof costDashboard;

const StatCard: React.FC<{ label: string; value: string; helper?: string }> = ({ label, value, helper }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wide text-white/60 font-semibold">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
        {helper && <div className="text-[10px] text-white/40">{helper}</div>}
    </div>
);

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: () => void }> = ({ isOpen, onClose, onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        triggerImpulse('click', 1.2);
        setIsLoading(true);
        // Simulate OAuth delay
        setTimeout(() => {
            onLogin();
            setIsLoading(false);
        }, 1500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Account">
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto text-brand-400 border border-brand-500/30 shadow-lg">
                    <User size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-white mb-2">Save Your Masterpiece</h4>
                    <p className="text-gray-400 text-sm">Sign in to save your generated videos and claim your <span className="text-brand-300 font-bold">Free Credit</span>.</p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        onMouseEnter={() => triggerImpulse('hover', 0.2)}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-[1.02]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>
                    <button 
                        onMouseEnter={() => triggerImpulse('hover', 0.2)}
                        className="w-full bg-gray-800 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors border border-white/5"
                    >
                        Continue with Email
                    </button>
                </div>
                <p className="text-[10px] text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
        </Modal>
    );
};

export const PaymentModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'form' | 'success'>('form');

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        triggerImpulse('click', 1.5); // Payment Trigger
        
        // Simulate Stripe Processing
        setTimeout(() => {
            setIsProcessing(false);
            setStep('success');
            triggerImpulse('click', 3.0); // Massive success impulse
            
            // Close after success
            setTimeout(() => {
                onSuccess();
                onClose();
                setStep('form');
            }, 1500);
        }, 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 'form' ? 'Add Credits' : 'Success'}>
            {step === 'form' ? (
                <form onSubmit={handlePay} className="space-y-4">
                    <div className="bg-gradient-to-br from-brand-900/50 to-purple-900/50 p-4 rounded-xl border border-brand-500/30 flex justify-between items-center mb-6 shadow-inner">
                        <div>
                            <p className="text-white font-bold">Creative Pack</p>
                            <p className="text-brand-300 text-sm">{CREDITS_PER_PACK} Generations</p>
                        </div>
                        <div className="text-xl font-bold text-white text-shadow-sm">${CREDITS_PACK_PRICE}.00</div>
                    </div>

                    <div className="space-y-3">
                        <div onMouseEnter={() => triggerImpulse('hover', 0.1)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Card Information</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="0000 0000 0000 0000" 
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-brand-500 outline-none transition-colors" 
                                    onChange={() => triggerImpulse('type', 0.2)}
                                    required 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div onMouseEnter={() => triggerImpulse('hover', 0.1)}>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Expiry</label>
                                <input 
                                    type="text" 
                                    placeholder="MM/YY" 
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:border-brand-500 outline-none transition-colors" 
                                    onChange={() => triggerImpulse('type', 0.2)}
                                    required 
                                />
                            </div>
                            <div onMouseEnter={() => triggerImpulse('hover', 0.1)}>
                                <label className="block text-xs font-medium text-gray-400 mb-1">CVC</label>
                                <input 
                                    type="text" 
                                    placeholder="123" 
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:border-brand-500 outline-none transition-colors" 
                                    onChange={() => triggerImpulse('type', 0.2)}
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isProcessing}
                            onMouseEnter={() => triggerImpulse('hover', 0.3)}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/20 hover:shadow-brand-600/40 hover:scale-[1.02]"
                        >
                            {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles size={16} /> Pay Securely</>}
                        </button>
                        <div className="flex justify-center items-center gap-1 mt-3 text-[10px] text-gray-500">
                            <Shield size={10} />
                            <span>Payments secured by Stripe (Mock)</span>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                        <Check size={32} className="text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">Payment Successful!</h4>
                    <p className="text-gray-400">Credits have been added to your account.</p>
                </div>
            )}
        </Modal>
    );
};

export const CostInsightsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const dashboard: CostDashboard = costDashboard;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ops Cost Dashboard">
            <div className="space-y-4 text-white">
                <div className="flex items-start gap-2 text-sm text-white/60">
                    <AlertTriangle size={16} className="text-amber-300 mt-0.5" />
                    <p>
                        Live assumptions pulled from <span className="font-semibold text-white">data/cost-assumptions.json</span>.
                        Run <code className="px-2 py-1 bg-white/5 border border-white/10 rounded">npm run costs:generate</code> when pricing updates.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard
                        label="Default Model"
                        value={dashboard.defaultProvider.model}
                        helper={`${dashboard.defaultProvider.provider} · $${dashboard.defaultProvider.imageGenCost.toFixed(4)} per image generation`}
                    />
                    <StatCard
                        label="Cost per Generation"
                        value={`$${dashboard.perGenerationCost.toFixed(4)}`}
                        helper={`Includes tokens, ${dashboard.assumptions.assetSizeMB}MB storage/egress, Firestore reads & writes`}
                    />
                    <StatCard
                        label="Per-user Monthly @ 5/day"
                        value={`$${dashboard.perUserMonthlyCost.toFixed(2)}`}
                        helper={`${dashboard.monthlyGenerationsPerUser} generations / user / month`}
                    />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <DollarSign size={16} className="text-emerald-300" />
                            Margin by price point
                        </div>
                        <span className="text-[11px] text-white/40">Break-even assumes ${dashboard.assumptions.monthlyFixedPlatformCost} monthly fixed</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {dashboard.marginByPrice.map((item) => (
                            <div key={item.price} className="bg-black/40 border border-white/10 rounded-lg p-3 space-y-1">
                                <div className="text-xs text-white/60">${item.price.toFixed(2)}/gen</div>
                                <div className="text-xl font-bold text-white">${item.marginPerGen.toFixed(3)} margin</div>
                                <div className="text-[11px] text-emerald-300">{item.grossMarginPct.toFixed(1)}% gross</div>
                                <div className="text-[11px] text-white/40">Break-even: {item.breakEvenGenerations === Infinity ? 'N/A' : `${Math.ceil(item.breakEvenGenerations).toLocaleString()} gens/mo`}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <TrendingUp size={16} className="text-sky-300" />
                        Sensitivity: low / med / high
                    </div>
                    <div className="space-y-2">
                        {dashboard.scenarios.map((scenario) => (
                            <div key={scenario.label} className="flex flex-col md:flex-row md:items-center md:justify-between bg-black/30 border border-white/5 rounded-lg p-3">
                                <div className="text-sm font-semibold text-white">{scenario.label}</div>
                                <div className="text-[13px] text-white/70">Cost: ${scenario.monthlyCost.toFixed(2)}</div>
                                <div className="text-[13px] text-emerald-300">Revenue @ $0.50: ${scenario.monthlyRevenue.toFixed(2)}</div>
                                <div className="text-[12px] text-white/50">Gross margin: {scenario.grossMarginPct.toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-amber-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                        <AlertTriangle size={16} />
                        Watchouts
                    </div>
                    <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                        <li>Raise alert if cost/gen exceeds ${dashboard.warningThresholds.perGenCostWarning.toFixed(2)} (pricing drift).</li>
                        <li>Investigate storage/egress if per-user monthly cost surpasses ${dashboard.warningThresholds.perUserMonthlyWarning.toFixed(2)}.</li>
                        <li>Update <code className="px-1 py-0.5 bg-white/10 rounded">data/cost-assumptions.json</code> when providers change pricing.</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};
