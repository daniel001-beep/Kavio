import React from 'react';
import { Bitcoin, LineChart, Landmark, TrendingUp, ShieldCheck, PieChart, Zap } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  features: string[];
  yieldRate: string;
  liquidity: string;
  icon: React.ElementType;
  accentColor: string;
}

export const products: Product[] = [
  {
    id: 'us-treasury',
    title: 'Short-Term T-Bills',
    description: 'Ultra-safe, sovereign-backed US Treasury Bills. Protect your runway from inflation.',
    category: 'Fixed Income',
    features: [
      'Sovereign-backed security',
      'Auto-rolling available',
      'Zero management fees',
      'State tax exempt',
    ],
    yieldRate: '5.25% APY',
    liquidity: 'T+1 Settlement',
    icon: Landmark,
    accentColor: '#3b82f6',
  },
  {
    id: 'crypto-staking',
    title: 'Institutional Crypto Yield',
    description: 'Regulated, over-collateralized stablecoin staking (USDC/USDT). Generate yield on idle runway.',
    category: 'Digital Assets',
    features: [
      'Over-collateralized backing',
      'Daily compounding interest',
      'Smart contract insurance',
      'Real-time proof of reserves',
    ],
    yieldRate: '8.50% APY',
    liquidity: 'Instant',
    icon: Bitcoin,
    accentColor: '#f59e0b',
  },
  {
    id: 'venture-debt',
    title: 'Founder Venture Debt',
    description: 'Non-dilutive capital to extend your runway without giving up board seats or equity.',
    category: 'Credit',
    features: [
      'Zero warrant coverage',
      'Revenue-based repayment',
      'No personal guarantees',
      'Fast 48-hour approval',
    ],
    yieldRate: 'Prime + 2%',
    liquidity: 'Drawdown',
    icon: LineChart,
    accentColor: '#8b5cf6',
  },
  {
    id: 'corporate-cash',
    title: 'Corporate High-Yield',
    description: 'A premium cash sweep account spreading funds across multiple FDIC-insured network banks.',
    category: 'Cash Management',
    features: [
      '$5M FDIC Insurance',
      'Unlimited free wires',
      'Corporate card integration',
      'Automated sweeps',
    ],
    yieldRate: '4.85% APY',
    liquidity: 'Instant',
    icon: ShieldCheck,
    accentColor: '#10b981',
  },
  {
    id: 'money-market',
    title: 'Vanguard Money Market',
    description: 'Access institutional-class money market funds directly from your Velox treasury dashboard.',
    category: 'Mutual Funds',
    features: [
      'Institutional share class',
      'Diversified commercial paper',
      'Dividend reinvestment',
      'Low expense ratio',
    ],
    yieldRate: '5.10% APY',
    liquidity: 'T+1 Settlement',
    icon: PieChart,
    accentColor: '#06b6d4',
  },
  {
    id: 'startup-fx',
    title: 'Startup FX & Hedging',
    description: 'Lock in forward contracts to protect your international payroll from sudden currency fluctuations.',
    category: 'Forex',
    features: [
      'Forward contracts',
      'Zero markup on mid-market',
      '50+ currency pairs',
      'Automated payroll routing',
    ],
    yieldRate: 'Dynamic',
    liquidity: 'Contract Based',
    icon: Zap,
    accentColor: '#ef4444',
  },
];

interface MarketplaceGridProps {
  onSelectProduct?: (productId: string) => void;
}

export default function MarketplaceGrid({ onSelectProduct }: MarketplaceGridProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-8">
        {products.map((product) => {
          const Icon = product.icon;
          
          return (
            <div
              key={product.id}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-sm p-8 hover:bg-slate-800 transition-all duration-300 flex flex-col group relative overflow-hidden w-full lg:w-[calc(33.333%-1.5rem)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {product.category}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-slate-800 border border-slate-700 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" style={{ color: product.accentColor }} />
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6 relative z-10">
                {product.description}
              </p>

              <div className="space-y-2 mb-6 relative z-10">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-slate-950/50 rounded-sm p-3 border border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Target Yield</p>
                  <p className="text-sm font-bold text-emerald-400 font-mono">{product.yieldRate}</p>
                </div>
                <div className="bg-slate-950/50 rounded-sm p-3 border border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Liquidity</p>
                  <p className="text-sm font-bold text-slate-300 font-mono">{product.liquidity}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50 mt-auto relative z-10">
                <button
                  onClick={() => onSelectProduct?.(product.id)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-sm font-bold rounded-sm transition-all duration-200"
                  aria-label={"Invest in " + product.title}
                >
                  Allocate Capital
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
