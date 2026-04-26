import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

/* ─── Types ─────────────────────────────────────────────── */
interface TrendPoint { label: string; sales: number; returns: number; payments: number; purchases: number }
interface TopClient  { uuid: string; nom: string; total_purchased: number }
interface RecentTxn  { uuid: string; type: string; client_uuid: string; client_nom: string; product_name: string | null; total_price: number; created_at: string }
interface LowStock   { uuid: string; nom: string; sku: string; stock_quantity: number }
interface DashProps {
    crm:        { total_f: number; total_r: number; total_p: number; balance: number; txn_count: number };
    purchases:  { paid: number; outstanding: number; count: number };
    counts:     { clients: number; active_clients: number; suppliers: number; products: number; low_stock: number; damaged_qty: number };
    trendData:  TrendPoint[];
    topClients: TopClient[];
    recentTxns: RecentTxn[];
    lowStockProducts: LowStock[];
    filters:    { period: string; date_from: string; date_to: string };
}

/* ─── Helpers ────────────────────────────────────────────── */
const safeNum = (v: unknown) => Number(v) || 0;

const fmt = (v: number, decimals = 0) => {
    const n = Math.abs(safeNum(v));
    const s = n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
            : n >= 1_000     ? (n / 1_000).toFixed(1) + 'K'
            : n.toFixed(decimals);
    return (v < 0 ? '-' : '') + s;
};

const fullFmt = (v: number) =>
    safeNum(v).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function timeAgo(iso: string | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60)    return `${s}s`;
    if (s < 3600)  return `${Math.floor(s / 60)}min`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

/* ─── Config ─────────────────────────────────────────────── */
const PERIODS = [
    { key: 'day',    label: "Aujourd'hui" },
    { key: 'week',   label: '7 jours'     },
    { key: 'month',  label: '30 jours'    },
    { key: 'year',   label: 'Année'       },
    { key: 'custom', label: 'Personnalisé'},
] as const;

const SERIES = [
    { key: 'sales',     label: 'Ventes',    color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  dash: false },
    { key: 'payments',  label: 'Encaissé',  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  dash: false },
    { key: 'purchases', label: 'Achats',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  dash: true  },
    { key: 'returns',   label: 'Retours',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   dash: true  },
] as const;

/* ─── SVG Chart ──────────────────────────────────────────── */
function LineChart({ data }: { data: TrendPoint[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const VW = 900, VH = 240, PL = 54, PR = 12, PT = 12, PB = 36;
    const CW = VW - PL - PR, CH = VH - PT - PB;
    const n = data.length;

    if (n === 0) return (
        <div className="h-52 flex items-center justify-center text-slate-300 text-sm select-none">
            Aucune donnée sur cette période
        </div>
    );

    const allVals = data.flatMap(d => [d.sales, d.payments, d.purchases, d.returns]);
    const maxVal  = Math.max(...allVals, 1);
    const xAt = (i: number) => PL + (n < 2 ? CW / 2 : (i / (n - 1)) * CW);
    const yAt = (v: number) => PT + (1 - safeNum(v) / maxVal) * CH;

    const smooth = (key: keyof TrendPoint) => {
        const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(safeNum(d[key])) }));
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        let p = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cx = (pts[i].x + pts[i + 1].x) / 2;
            p += ` C ${cx} ${pts[i].y}, ${cx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
        }
        return p;
    };

    const area = (key: keyof TrendPoint) =>
        `${smooth(key)} L ${xAt(n - 1)} ${PT + CH} L ${PL} ${PT + CH} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ y: yAt(maxVal * f), v: maxVal * f }));
    const xStep  = Math.max(1, Math.ceil(n / 9));

    const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const px   = ((e.clientX - rect.left) / rect.width) * VW;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) { const d = Math.abs(xAt(i) - px); if (d < bd) { bd = d; best = i; } }
        setHover(best);
    };

    const tipRight = hover !== null && xAt(hover) / VW > 0.6;

    return (
        <div className="relative select-none">
            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="w-full"
                style={{ height: 240 }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>

                {/* grid */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PL} y1={t.y} x2={VW - PR} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x={PL - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="ui-monospace,monospace">
                            {fmt(t.v)}
                        </text>
                    </g>
                ))}

                {/* x labels */}
                {data.map((d, i) => (i % xStep === 0 || i === n - 1) && (
                    <text key={i} x={xAt(i)} y={VH - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>
                ))}

                {/* areas */}
                {[...SERIES].reverse().map(s => (
                    <path key={s.key} d={area(s.key)} fill={s.color} fillOpacity="0.07" />
                ))}

                {/* lines */}
                {SERIES.map(s => (
                    <path key={s.key} d={smooth(s.key)} fill="none" stroke={s.color} strokeWidth="2"
                        strokeDasharray={s.dash ? '6 3' : undefined}
                        strokeLinejoin="round" strokeLinecap="round" />
                ))}

                {/* crosshair */}
                {hover !== null && (
                    <g>
                        <line x1={xAt(hover)} y1={PT} x2={xAt(hover)} y2={PT + CH}
                            stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                        {SERIES.map(s => (
                            <circle key={s.key} cx={xAt(hover)} cy={yAt(safeNum(data[hover][s.key]))}
                                r="4" fill="white" stroke={s.color} strokeWidth="2" />
                        ))}
                    </g>
                )}

                {/* invisible hover strips */}
                {data.map((_, i) => {
                    const x0 = i === 0     ? PL          : (xAt(i - 1) + xAt(i)) / 2;
                    const x1 = i === n - 1 ? VW - PR     : (xAt(i) + xAt(i + 1)) / 2;
                    return <rect key={i} x={x0} y={PT} width={x1 - x0} height={CH} fill="transparent"
                        onMouseEnter={() => setHover(i)} />;
                })}
            </svg>

            {/* tooltip */}
            {hover !== null && (
                <div className="absolute top-2 z-20 pointer-events-none bg-slate-900/95 backdrop-blur text-white rounded-xl shadow-2xl px-3.5 py-3 min-w-[165px]"
                    style={tipRight
                        ? { right: `${(1 - xAt(hover) / VW) * 100}%`, marginRight: 14 }
                        : { left:  `${(xAt(hover) / VW) * 100}%`,     marginLeft:  14 }}>
                    <p className="text-[11px] text-slate-400 font-semibold mb-2 pb-1.5 border-b border-white/10">
                        {data[hover].label}
                    </p>
                    <div className="space-y-1.5">
                        {SERIES.map(s => (
                            <div key={s.key} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                    {s.label}
                                </span>
                                <span className="text-[11px] font-mono font-bold">
                                    {fullFmt(safeNum(data[hover][s.key]))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, trend, trendLabel, color, border }: {
    label: string; value: string; sub: string;
    trend?: string; trendLabel?: string;
    color: string; border: string;
}) {
    return (
        <div className={`bg-white rounded-2xl border ${border} shadow-sm p-5 flex flex-col gap-3`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <div>
                <p className={`text-3xl font-black font-mono leading-none ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>
            </div>
            {trend && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{trendLabel}</span>
                    <span className={`text-[11px] font-bold font-mono ${color}`}>{trend}</span>
                </div>
            )}
        </div>
    );
}

/* ─── Breadcrumbs ────────────────────────────────────────── */
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

/* ─── Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
    const raw  = usePage().props as unknown as Partial<DashProps>;
    const crm  = raw.crm       ?? { total_f:0, total_r:0, total_p:0, balance:0, txn_count:0 };
    const pur  = raw.purchases ?? { paid:0, outstanding:0, count:0 };
    const cnt  = raw.counts    ?? { clients:0, active_clients:0, suppliers:0, products:0, low_stock:0, damaged_qty:0 };
    const trend    = raw.trendData        ?? [];
    const tops     = raw.topClients       ?? [];
    const txns     = raw.recentTxns       ?? [];
    const lowStock = raw.lowStockProducts ?? [];
    const sf       = raw.filters          ?? { period:'month', date_from:'', date_to:'' };

    const [period,   setPeriod]   = useState(sf.period    ?? 'month');
    const [dateFrom, setDateFrom] = useState(sf.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(sf.date_to   ?? '');

    const applyFilter = (p = period, f = dateFrom, t = dateTo) =>
        router.get('/dashboard', {
            period: p,
            ...(p === 'custom' ? { date_from: f || undefined, date_to: t || undefined } : {}),
        }, { preserveState: false });

    const pickPeriod = (p: string) => { setPeriod(p); if (p !== 'custom') applyFilter(p); };

    const topMax   = Math.max(...tops.map(c => c.total_purchased), 1);
    const net      = crm.total_f - pur.paid;
    const seriesMax = Math.max(...SERIES.map(s => trend.reduce((a, d) => a + safeNum(d[s.key]), 0)), 1);

    const typeBadge = (type: string) => ({
        F: { lbl: 'Vente',    cls: 'bg-indigo-100 text-indigo-700' },
        R: { lbl: 'Retour',   cls: 'bg-red-100 text-red-700'       },
        P: { lbl: 'Paiement', cls: 'bg-emerald-100 text-emerald-700' },
    }[type] ?? { lbl: type, cls: 'bg-slate-100 text-slate-600' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-6 space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {new Date().toLocaleDateString('fr-MA', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                        </p>
                    </div>

                    {/* Period pills */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
                        {PERIODS.map(p => (
                            <button key={p.key} type="button" onClick={() => pickPeriod(p.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    period === p.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom date range */}
                {period === 'custom' && (
                    <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        <span className="text-slate-400">→</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        <button type="button" onClick={() => applyFilter()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                            Appliquer
                        </button>
                    </div>
                )}

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Ventes clients"
                        value={fmt(crm.total_f)}
                        sub={`${crm.txn_count} opérations · période`}
                        trend={`${fmt(crm.balance)} MAD`}
                        trendLabel="Solde impayé"
                        color="text-indigo-700"
                        border="border-indigo-100"
                    />
                    <KpiCard
                        label="Encaissé"
                        value={fmt(crm.total_p)}
                        sub="MAD reçu des clients"
                        trend={`- ${fmt(crm.total_r)} MAD`}
                        trendLabel="Retours"
                        color="text-emerald-700"
                        border="border-emerald-100"
                    />
                    <KpiCard
                        label="Achats fournisseurs"
                        value={fmt(pur.paid)}
                        sub={`${pur.count} factures · période`}
                        trend={`${fmt(pur.outstanding)} MAD`}
                        trendLabel="Reste à payer"
                        color="text-amber-700"
                        border="border-amber-100"
                    />
                    <KpiCard
                        label="Marge brute"
                        value={(net >= 0 ? '+' : '') + fmt(net)}
                        sub="CA clients − achats fournisseurs"
                        color={net >= 0 ? 'text-emerald-700' : 'text-red-600'}
                        border={net >= 0 ? 'border-emerald-100' : 'border-red-100'}
                    />
                </div>

                {/* ── Chart ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between px-6 pt-5 pb-3 flex-wrap gap-4">
                        <div>
                            <h2 className="font-bold text-slate-800">Évolution</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {PERIODS.find(p => p.key === period)?.label}
                                {period === 'custom' && dateFrom && dateTo ? ` · ${dateFrom} → ${dateTo}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-5 flex-wrap">
                            {SERIES.map(s => {
                                const total = trend.reduce((a, d) => a + safeNum(d[s.key]), 0);
                                return (
                                    <div key={s.key} className="flex items-center gap-1.5">
                                        <svg width="20" height="10">
                                            <line x1="0" y1="5" x2="20" y2="5"
                                                stroke={s.color} strokeWidth="2"
                                                strokeDasharray={s.dash ? '5 2' : undefined} />
                                        </svg>
                                        <span className="text-[11px] text-slate-500">{s.label}</span>
                                        <span className="text-[11px] font-bold font-mono text-slate-700">{fmt(total)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="px-3 pb-5">
                        <LineChart data={trend} />
                    </div>
                </div>

                {/* ── Middle Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Top Clients */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <h2 className="font-bold text-slate-800 text-sm">Top clients</h2>
                                <p className="text-[11px] text-slate-400">Par ventes sur la période</p>
                            </div>
                            <button type="button" onClick={() => router.visit('/clients')}
                                className="text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                                Voir tous →
                            </button>
                        </div>
                        {tops.length === 0 ? (
                            <p className="p-10 text-center text-sm text-slate-300">Aucune vente sur la période</p>
                        ) : (
                            <div className="p-4 space-y-3.5">
                                {tops.map((c, i) => (
                                    <div key={c.uuid} className="cursor-pointer group"
                                        onClick={() => router.visit(`/clients/${c.uuid}/ledger`)}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                <span className="text-base shrink-0">
                                                    {['🥇','🥈','🥉'][i] ?? `#${i+1}`}
                                                </span>
                                                <span className="truncate max-w-[130px]">{c.nom || 'N/A'}</span>
                                            </span>
                                            <span className="text-xs font-mono font-bold text-indigo-600 shrink-0 ml-2">
                                                {fmt(c.total_purchased)} MAD
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
                                                style={{ width: `${Math.round((c.total_purchased / topMax) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800 text-sm">Transactions récentes</h2>
                            <p className="text-[11px] text-slate-400">8 dernières opérations</p>
                        </div>
                        {txns.length === 0 ? (
                            <p className="p-10 text-center text-sm text-slate-300">Aucune transaction</p>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {txns.map(t => {
                                    const b = typeBadge(t.type);
                                    return (
                                        <div key={t.uuid ?? Math.random()}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => t.client_uuid && router.visit(`/clients/${t.client_uuid}/ledger`)}>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${b.cls}`}>
                                                {b.lbl}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{t.client_nom || 'N/A'}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{t.product_name || '—'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-mono font-bold text-slate-800">{fmt(t.total_price)} MAD</p>
                                                <p className="text-[10px] text-slate-400">{timeAgo(t.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Breakdown + Stats */}
                    <div className="flex flex-col gap-4">

                        {/* Series breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h2 className="font-bold text-slate-800 text-sm mb-4">Répartition · période</h2>
                            <div className="space-y-3">
                                {SERIES.map(s => {
                                    const total = trend.reduce((a, d) => a + safeNum(d[s.key]), 0);
                                    const pct   = Math.round((total / seriesMax) * 100);
                                    return (
                                        <div key={s.key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                                    {s.label}
                                                </span>
                                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                                    {fmt(total)} MAD
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: s.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Counts grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h2 className="font-bold text-slate-800 text-sm mb-3">Inventaire</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Clients',      v: cnt.active_clients, color: 'text-indigo-600',  bg: 'bg-indigo-50',  href: '/clients'   },
                                    { label: 'Fournisseurs', v: cnt.suppliers,      color: 'text-violet-600',  bg: 'bg-violet-50',  href: '/suppliers'  },
                                    { label: 'Produits',     v: cnt.products,       color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/produits'   },
                                    { label: 'Stock ↓',      v: cnt.low_stock,      color: 'text-orange-600',  bg: 'bg-orange-50',  href: '/produits'   },
                                    { label: 'Endommagés',   v: cnt.damaged_qty,    color: 'text-red-600',     bg: 'bg-red-50',     href: '/stock'      },
                                    { label: 'Factures',     v: pur.count,          color: 'text-slate-600',   bg: 'bg-slate-50',   href: '/purchase_invoices' },
                                ].map(item => (
                                    <button key={item.label} type="button"
                                        onClick={() => router.visit(item.href)}
                                        className={`rounded-xl p-2.5 text-center ${item.bg} hover:opacity-80 transition-opacity cursor-pointer`}>
                                        <p className={`text-xl font-black leading-none ${item.color}`}>{item.v ?? 0}</p>
                                        <p className="text-[9px] text-slate-500 mt-1 leading-tight">{item.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Low stock */}
                    {lowStock.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3.5 bg-orange-50 border-b border-orange-100">
                                <div>
                                    <p className="text-sm font-bold text-orange-900">⚠ Stock faible</p>
                                    <p className="text-[11px] text-orange-600">{cnt.low_stock} produit(s) à réapprovisionner</p>
                                </div>
                                <button type="button" onClick={() => router.visit('/produits')}
                                    className="text-xs text-orange-700 font-semibold hover:underline">
                                    Gérer →
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {lowStock.map(p => (
                                    <div key={p.uuid}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">{p.nom || 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{p.sku || 'N/A'}</p>
                                        </div>
                                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                            p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {p.stock_quantity ?? 0} u.
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 flex items-center gap-4">
                            <div className="text-4xl">✅</div>
                            <div>
                                <p className="font-bold text-slate-800">Stock en bonne santé</p>
                                <p className="text-xs text-slate-400 mt-1">Aucun produit sous le seuil d'alerte</p>
                            </div>
                        </div>
                    )}

                    {/* Quick access */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h2 className="font-bold text-slate-800 text-sm mb-3">Accès rapide</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { label: 'Nouveau client',    sub: 'Ajouter un client',         href: '/clients/create',          emoji: '👤' },
                                { label: 'Nouvelle facture',  sub: 'Facture de vente',           href: '/sales_invoices/create',   emoji: '🧾' },
                                { label: 'Achat fournisseur', sub: 'Facture d\'achat',           href: '/purchase_invoices/create',emoji: '🛒' },
                                { label: 'Paiements',         sub: 'Historique complet',         href: '/payments',                emoji: '💳' },
                            ] as const).map(item => (
                                <button key={item.href} type="button"
                                    onClick={() => router.visit(item.href)}
                                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition-all">
                                    <span className="text-xl shrink-0">{item.emoji}</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                                        <p className="text-[10px] text-slate-400">{item.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
