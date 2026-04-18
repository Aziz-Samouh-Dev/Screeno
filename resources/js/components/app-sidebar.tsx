import { Link } from '@inertiajs/react';
import { LayoutGrid, Box, Users, Truck, Settings, FileOutput, FileSymlink } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Produits',
        href: '/produits',
        icon: Box,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
    },
    {
        title: 'Purchase Invoices',
        href: '/purchase_invoices',
        icon: FileSymlink,
    },
    {
        title: 'Sales Invoices',
        href: '/sales_invoices',
        icon: FileOutput,
    },
    {
        title: 'Sales Returns',
        href: '/sales_returns',
        icon: FileOutput,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Parametrs',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
