import { Head, Link, usePage } from '@inertiajs/react';
import {
    FileText, Package, Users, Truck, RotateCcw, CreditCard,
    BarChart3, Shield, Zap, Globe, ArrowRight, CheckCircle2, Star,
} from 'lucide-react';

interface Auth { user?: { name: string } }

export default function Welcome() {
    const { auth } = usePage().props as { auth: Auth };

    const features = [
        { icon: FileText, title: 'Facturation intelligente', desc: "Créez et gérez vos factures d'achat et de vente en quelques secondes avec numérotation automatique.", color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Package, title: 'Gestion des stocks', desc: 'Suivez votre inventaire en temps réel avec alertes de stock faible et historique des mouvements.', color: 'text-amber-500', bg: 'bg-amber-50' },
        { icon: Users, title: 'Gestion clients', desc: 'Centralisez vos données clients avec historique complet des factures, paiements et retours.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { icon: Truck, title: 'Gestion fournisseurs', desc: 'Gérez vos fournisseurs et leurs factures avec suivi des paiements et des soldes.', color: 'text-violet-500', bg: 'bg-violet-50' },
        { icon: RotateCcw, title: 'Retours de vente', desc: 'Traitez les retours clients facilement avec restitution automatique au stock.', color: 'text-rose-500', bg: 'bg-rose-50' },
        { icon: BarChart3, title: 'Tableau de bord', desc: "Vue d'ensemble en temps réel de vos revenus, dépenses, stock et activité récente.", color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    const advantages = [
        { icon: Zap, label: 'Rapide et léger' },
        { icon: Shield, label: 'Sécurisé' },
        { icon: Globe, label: 'Accessible partout' },
        { icon: CreditCard, label: 'MAD intégré' },
    ];

    return (
        <>
            <Head title="Screeno — Gestion d'entreprise moderne" />

            <div className="min-h-screen bg-white font-sans">

                {/* ─── NAV ──────────────────────────────────────────── */}
                <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/80 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                            <span className="text-white font-black text-sm">S</span>
                        </div>
                        <span className="font-black text-slate-900 text-lg tracking-tight">Screeno</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
                        <a href="#modules" className="hover:text-slate-900 transition-colors">Modules</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        {auth?.user ? (
                            <Link href="/dashboard"
                                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                                Tableau de bord →
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                                    Connexion
                                </Link>
                                <Link href="/register"
                                    className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                                    Commencer gratuitement
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                {/* ─── HERO ─────────────────────────────────────────── */}
                <section className="relative pt-32 pb-24 px-6 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 blur-3xl opacity-60 pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-orange-100 to-yellow-50 blur-3xl opacity-50 pointer-events-none" />

                    <div className="relative max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-semibold text-amber-700 mb-8">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            Gestion d'entreprise tout-en-un
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.08] tracking-tight mb-6">
                            Gérez votre{' '}
                            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                                entreprise
                            </span>
                            <br />avec clarté
                        </h1>

                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Screeno centralise votre facturation, vos stocks, vos clients et vos fournisseurs
                            dans une interface moderne et intuitive. Conçu pour le marché marocain.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {auth?.user ? (
                                <Link href="/dashboard"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all">
                                    Aller au tableau de bord <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all">
                                        Démarrer maintenant <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link href="/login"
                                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 px-8 py-4 text-base font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
                                        Se connecter
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-400">
                            {['Facturation MAD', 'Stock en temps réel', 'Impression PDF', 'Historique complet'].map(t => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── ADVANTAGES BAR ───────────────────────────────── */}
                <section className="border-y border-slate-100 bg-slate-50/50 py-8 px-6">
                    <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8">
                        {advantages.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2.5 text-slate-600">
                                <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <Icon className="h-4 w-4 text-orange-500" />
                                </div>
                                <span className="text-sm font-semibold">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── FEATURES ─────────────────────────────────────── */}
                <section id="features" className="py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                                Tout ce dont vous avez besoin
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Une suite complète d'outils conçus pour simplifier la gestion quotidienne de votre entreprise.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map(({ icon: Icon, title, desc, color, bg }) => (
                                <div key={title}
                                    className="group rounded-3xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── MODULES ──────────────────────────────────────── */}
                <section id="modules" className="py-24 px-6 bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-bl from-orange-500/20 to-amber-400/10 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-400/5 blur-3xl pointer-events-none" />

                    <div className="relative max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Modules intégrés</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Chaque module fonctionne ensemble de manière transparente.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: FileText, label: 'Facturation',
                                    items: ["Factures d'achat et de vente", 'Numérotation automatique FA-/FV-', 'Suivi des paiements en MAD', 'Impression PDF professionnelle'],
                                    gradient: 'from-blue-600 to-blue-400',
                                },
                                {
                                    icon: Package, label: 'Inventaire',
                                    items: ['Catalogue produits avec SKU', 'Alertes stock faible (≤5)', 'Mouvements de stock automatiques', 'Vue grille et liste'],
                                    gradient: 'from-amber-600 to-amber-400',
                                },
                                {
                                    icon: Users, label: 'Clients & Fournisseurs',
                                    items: ['Fiches complètes avec historique', 'Historique des transactions PDF', 'Statistiques de vente par client', 'Export CSV'],
                                    gradient: 'from-emerald-600 to-emerald-400',
                                },
                                {
                                    icon: RotateCcw, label: 'Retours & Paiements',
                                    items: ['Retours de vente avec restock', 'Méthodes de paiement multiples', 'Soldes en temps réel', "Profil d'entreprise personnalisable"],
                                    gradient: 'from-rose-600 to-rose-400',
                                },
                            ].map(({ icon: Icon, label, items, gradient }) => (
                                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-7 hover:bg-white/8 transition-colors">
                                    <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${gradient} px-3 py-1.5 mb-5`}>
                                        <Icon className="h-4 w-4 text-white" />
                                        <span className="text-white font-bold text-sm">{label}</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {items.map(item => (
                                            <li key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ──────────────────────────────────────────── */}
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-white pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-r from-orange-200 to-amber-200 blur-3xl opacity-40 pointer-events-none" />
                    <div className="relative max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                            Prêt à simplifier votre gestion ?
                        </h2>
                        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
                            Rejoignez Screeno et transformez la façon dont vous gérez votre entreprise — rapide, clair, professionnel.
                        </p>
                        {auth?.user ? (
                            <Link href="/dashboard"
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-10 py-5 text-lg font-bold text-white shadow-2xl hover:shadow-orange-200 transition-all">
                                Accéder à mon espace <ArrowRight className="h-5 w-5" />
                            </Link>
                        ) : (
                            <Link href="/register"
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-10 py-5 text-lg font-bold text-white shadow-2xl hover:shadow-orange-200 transition-all">
                                Créer mon compte <ArrowRight className="h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </section>

                {/* ─── FOOTER ───────────────────────────────────────── */}
                <footer className="border-t border-slate-100 py-8 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                                <span className="text-white font-black text-xs">S</span>
                            </div>
                            <span className="font-black text-slate-700">Screeno</span>
                        </div>
                        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Screeno. Tous droits réservés.</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <Link href="/login" className="hover:text-slate-600">Connexion</Link>
                            <Link href="/register" className="hover:text-slate-600">Inscription</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
