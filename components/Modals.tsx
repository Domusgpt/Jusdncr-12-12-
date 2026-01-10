
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, User } from 'lucide-react';
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

export const AuthModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onGoogleLogin: () => Promise<void>;
    onEmailLogin: (email: string, password: string, mode: 'signin' | 'signup') => Promise<void>;
}> = ({ isOpen, onClose, onGoogleLogin, onEmailLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setEmail('');
        setPassword('');
        setAuthMode('signin');
        setError(null);
        setIsLoading(false);
        setIsEmailLoading(false);
    }, [isOpen]);

    const handleGoogleLogin = async () => {
        triggerImpulse('click', 1.2);
        setIsLoading(true);
        setError(null);
        try {
            await onGoogleLogin();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        triggerImpulse('click', 1.1);
        setIsEmailLoading(true);
        setError(null);
        try {
            await onEmailLogin(email, password, authMode);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in with email.');
        } finally {
            setIsEmailLoading(false);
        }
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
                    <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                        <div onMouseEnter={() => triggerImpulse('hover', 0.1)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-black/30 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:border-brand-500 outline-none transition-colors"
                                required
                            />
                        </div>
                        <div onMouseEnter={() => triggerImpulse('hover', 0.1)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/30 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:border-brand-500 outline-none transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isEmailLoading}
                            onMouseEnter={() => triggerImpulse('hover', 0.2)}
                            className="w-full bg-gray-800 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors border border-white/5 disabled:opacity-50"
                        >
                            {isEmailLoading ? 'Processing…' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMode(prev => (prev === 'signin' ? 'signup' : 'signin'))}
                            className="w-full text-xs text-brand-300 font-semibold tracking-wide"
                        >
                            {authMode === 'signin'
                                ? 'Need an account? Create one'
                                : 'Already have an account? Sign in'}
                        </button>
                    </form>
                </div>
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <p className="text-[10px] text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
        </Modal>
    );
};

export const PaymentModal: React.FC<{ isOpen: boolean; onClose: () => void; onCheckout: () => Promise<void> }> = ({
    isOpen,
    onClose,
    onCheckout,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handleCheckout = async () => {
        setIsProcessing(true);
        setError(null);
        triggerImpulse('click', 1.5);
        try {
            await onCheckout();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start checkout.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Credits">
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-brand-900/50 to-purple-900/50 p-4 rounded-xl border border-brand-500/30 flex justify-between items-center shadow-inner">
                    <div>
                        <p className="text-white font-bold">Creative Pack</p>
                        <p className="text-brand-300 text-sm">{CREDITS_PER_PACK} Generations</p>
                    </div>
                    <div className="text-xl font-bold text-white text-shadow-sm">${CREDITS_PACK_PRICE}.00</div>
                </div>

                <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    onMouseEnter={() => triggerImpulse('hover', 0.3)}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/20 hover:shadow-brand-600/40 hover:scale-[1.02]"
                >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles size={16} /> Continue to Stripe</>}
                </button>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <div className="flex justify-center items-center gap-1 text-[10px] text-gray-500">
                    <Shield size={10} />
                    <span>Payments secured by Stripe Checkout</span>
                </div>
            </div>
        </Modal>
    );
};
