import { Link } from '@inertiajs/react';
import {
    LayoutGrid, Box, Users, Truck, Settings,
    FileInput, FileOutput, RotateCcw, Building2,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    { title: 'Tableau de bord',   href: dashboard(),          icon: LayoutGrid  },
    { title: 'Produits',          href: '/produits',          icon: Box         },
    { title: 'Clients',           href: '/clients',           icon: Users       },
    { title: 'Fournisseurs',      href: '/suppliers',         icon: Truck       },
    { title: "Factures d'achat",  href: '/purchase_invoices', icon: FileInput   },
    { title: 'Factures de vente', href: '/sales_invoices',    icon: FileOutput  },
    { title: 'Retours de vente',  href: '/sales_returns',     icon: RotateCcw   },
];

const footerNavItems: NavItem[] = [
    { title: "Profil d'entreprise", href: '/settings/company',  icon: Building2 },
    { title: 'Paramètres',          href: '/settings/profile',  icon: Settings  },
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
