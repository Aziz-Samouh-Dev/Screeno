import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Building2, MapPin, Phone, Mail, Hash, Save } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const schema = z.object({
    name:    z.string().min(1, 'Company name is required'),
    address: z.string().optional(),
    city:    z.string().optional(),
    country: z.string().optional(),
    phone:   z.string().optional(),
    email:   z.string().email().optional().or(z.literal('')),
    tax_id:  z.string().optional(),
    ice:     z.string().optional(),
    notes:   z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Company Profile', href: '/settings/company' },
];

export default function CompanyPage() {
    const { company } = usePage().props as any;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            name:    company?.name    ?? '',
            address: company?.address ?? '',
            city:    company?.city    ?? '',
            country: company?.country ?? '',
            phone:   company?.phone   ?? '',
            email:   company?.email   ?? '',
            tax_id:  company?.tax_id  ?? '',
            ice:     company?.ice     ?? '',
            notes:   company?.notes   ?? '',
        },
    });

    const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

    function onSubmit(values: FormValues) {
        router.put('/settings/company', values, {
            onSuccess: () => toast.success('Company profile saved.'),
            onError: () => toast.error('Failed to save.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Profile" />

            <div className="flex flex-col gap-6 p-6 max-w-3xl">

                <div>
                    <h1 className="text-xl font-bold text-slate-900">Company Profile</h1>
                    <p className="text-sm text-slate-400 mt-0.5">This data appears on all printed invoices.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Identity */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" /> Company Identity
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Company Name *</label>
                                <Input {...register('name')} className="rounded-xl" placeholder="Screeno Inc." />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tax ID (IF / RC)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input {...register('tax_id')} className="rounded-xl pl-9" placeholder="123456789" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ICE</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input {...register('ice')} className="rounded-xl pl-9" placeholder="000000000000000" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" /> Contact
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input {...register('phone')} className="rounded-xl pl-9" placeholder="+212 6xx xxx xxx" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input {...register('email')} type="email" className="rounded-xl pl-9" placeholder="contact@company.ma" />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" /> Address
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Street Address</label>
                                <Input {...register('address')} className="rounded-xl" placeholder="123 Avenue Hassan II" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">City</label>
                                <Input {...register('city')} className="rounded-xl" placeholder="Casablanca" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Country</label>
                                <Input {...register('country')} className="rounded-xl" placeholder="Morocco" />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800">Notes (appears on invoices)</h3>
                        <Textarea
                            {...register('notes')}
                            className="rounded-xl resize-none h-24"
                            placeholder="Payment terms, bank details, etc."
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" className="rounded-xl px-6" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> Save Profile
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
