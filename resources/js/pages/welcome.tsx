'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import AppLogo from '@/components/app-logo';
import { motion } from 'framer-motion';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Screeno" />

            <div className="min-h-screen bg-white dark:bg-[#0b0b0b] text-black dark:text-white">

                {/* NAVBAR (Preview removed) */}
                <header className="fixed top-0 left-0 w-full z-50">
                    <div className="backdrop-blur-xl bg-white/70 dark:bg-black/60 border-b border-black/5 dark:border-white/10">
                        <div className="max-w-6xl mx-auto px-6 h-16 grid grid-cols-3 items-center">

                            {/* LEFT - LOGO */}
                            <div className="flex items-center">
                                <AppLogo />
                            </div>

                            {/* CENTER - NAV (SAAS PILL STYLE) */}
                            <nav className="hidden md:flex justify-center">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">

                                    <a
                                        href="#features"
                                        className="px-4 py-1.5 text-sm rounded-full text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition"
                                    >
                                        Features
                                    </a>

                                    <a
                                        href="#modules"
                                        className="px-4 py-1.5 text-sm rounded-full text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition"
                                    >
                                        Modules
                                    </a>

                                </div>
                            </nav>

                            {/* RIGHT - ACTION */}
                            <div className="flex justify-end">
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="px-4 py-2 rounded-full bg-black text-white text-sm hover:scale-[1.03] active:scale-95 transition shadow-sm"
                                >
                                    {auth.user ? 'Dashboard' : 'Login'}
                                </Link>
                            </div>

                        </div>
                    </div>
                </header>

                {/* HERO (TRUE CENTER FIXED) */}
                <main className="flex items-center justify-center min-h-screen px-6 pt-24 relative overflow-hidden bg-white dark:bg-[#0b0b0b]">

                    {/* BACKGROUND GLOW (FIXED STACKING) */}
                    <div className="absolute inset-0 pointer-events-none">

                        {/* base soft layer */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-white dark:from-[#0b0b0b] dark:via-[#0b0b0b] dark:to-[#0b0b0b]" />

                        {/* ORANGE MAIN GLOW */}
                        <div className="absolute top-[-200px] left-1/2 w-[700px] h-[700px] -translate-x-1/2 bg-orange-500/30 blur-[180px] rounded-full" />

                        {/* AMBER SECOND GLOW */}
                        <div className="absolute bottom-[-220px] right-[-120px] w-[500px] h-[500px] bg-amber-400/20 blur-[160px] rounded-full" />

                    </div>

                    {/* CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl relative z-10"
                    >

                        {/* ICON */}
                        <div className="flex justify-center mb-8">
                            <div className="p-5 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border shadow-sm">
                                <svg
                                    className="w-10 h-10 text-orange-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 6v12" />
                                    <path d="M17.196 9 6.804 15" />
                                    <path d="m6.804 9 10.392 6" />
                                </svg>
                            </div>
                        </div>

                        {/* TITLE */}
                        <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
                            Run your business <br />
                            <span className="text-orange-600">
                                with clarity, not complexity
                            </span>
                        </h1>

                        {/* SUBTITLE */}
                        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Screeno is a complete invoice management system for sales,
                            purchases, clients, suppliers and stock — all in one place.
                        </p>

                        {/* CTA */}
                        <div className="mt-10 flex justify-center gap-3">
                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="px-6 py-3 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition"
                            >
                                {auth.user ? 'Open Dashboard' : 'Get Started'}
                            </Link>

                            <a
                                href="#features"
                                className="px-6 py-3 rounded-md border hover:bg-orange-50 dark:hover:bg-white/10 transition"
                            >
                                Explore Features
                            </a>
                        </div>

                        {/* TRUST LINE */}
                        <div className="mt-8 text-sm text-gray-500">
                            Trusted by modern businesses for fast invoice management
                        </div>

                    </motion.div>

                </main>

                {/* FEATURES */}
                <section id="features" className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">

                        <h2 className="text-2xl font-semibold mb-8">
                            Everything you need to run your business
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">

                            {[
                                {
                                    title: 'Smart Invoicing',
                                    desc: 'Create sales & purchase invoices in seconds.',
                                },
                                {
                                    title: 'Inventory Control',
                                    desc: 'Track stock in real-time with accuracy.',
                                },
                                {
                                    title: 'Clients & Suppliers',
                                    desc: 'Organize relationships in one place.',
                                },
                                {
                                    title: 'Returns System',
                                    desc: 'Handle returns without confusion.',
                                },
                                {
                                    title: 'Reports',
                                    desc: 'Understand your business performance.',
                                },
                                {
                                    title: 'Secure System',
                                    desc: 'Your data is protected and reliable.',
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="p-5 rounded-lg border bg-white dark:bg-[#111] hover:border-orange-400 transition"
                                >
                                    <h3 className="font-medium mb-2 text-orange-600">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}

                        </div>
                    </div>
                </section>

                {/* MODULES */}
                <section id="modules" className="py-16 px-6 bg-orange-50 dark:bg-[#0b0b0b]">
                    <div className="max-w-6xl mx-auto">

                        <h2 className="text-2xl font-semibold mb-8">
                            Core Modules
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">

                            {[
                                'Sales Invoices',
                                'Purchase Invoices',
                                'Products',
                                'Clients',
                                'Suppliers',
                                'Sales Returns',
                            ].map((m, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 rounded-md border bg-white dark:bg-[#111]"
                                >
                                    <span>{m}</span>
                                    <span className="text-orange-500">→</span>
                                </div>
                            ))}

                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 px-6 text-center">
                    <h2 className="text-3xl font-semibold mb-4">
                        Start managing your business better
                    </h2>

                    <Link
                        href={auth.user ? dashboard() : login()}
                        className="px-6 py-3 rounded-md bg-orange-600 text-white hover:bg-orange-700"
                    >
                        {auth.user ? 'Open Dashboard' : 'Login'}
                    </Link>
                </section>

                {/* FOOTER */}
                <footer className="border-t py-10 px-6">
                    <div className="max-w-6xl mx-auto flex justify-between text-sm text-gray-500">

                        <AppLogo />

                        <span>© {new Date().getFullYear()} Screeno</span>

                    </div>
                </footer>

            </div>
        </>
    );
}