import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    ArrowLeft, Package, Upload, DollarSign,
    BarChart3, Save, Eye, X, TrendingUp, Tag,
} from 'lucide-react';

const formSchema = z.object({
    nom:            z.string().min(1, { message: 'Product name is required' }),
    image:          z.any().optional(),
    description:    z.string().optional(),
    purchase_price: z.preprocess(v => Number(v), z.number().min(0)),
    sale_price:     z.preprocess(v => Number(v), z.number().min(0)),
    stock_quantity: z.preprocess(v => Number(v), z.number().min(0)),
});

type FormValues = z.infer<typeof formSchema>;

export default function Edit() {
    const { produit } = usePage().props as any;
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview]       = useState<string | null>(produit.image ? `/storage/${produit.image}` : null);
    const [removeImage, setRemoveImage] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: '/produits' },
        { title: produit.nom, href: `/produits/${produit.uuid}` },
        { title: 'Edit', href: `/produits/${produit.uuid}/edit` },
    ];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nom:            produit.nom            ?? '',
            description:    produit.description    ?? '',
            image:          null,
            purchase_price: produit.purchase_price ?? 0,
            sale_price:     produit.sale_price     ?? 0,
            stock_quantity: produit.stock_quantity ?? 0,
        },
    });

    const watchPurchase = form.watch('purchase_price');
    const watchSale     = form.watch('sale_price');
    const margin        = Number(watchSale) - Number(watchPurchase);
    const marginPct     = Number(watchPurchase) > 0 ? (margin / Number(watchPurchase)) * 100 : 0;

    function onSubmit(values: FormValues) {
        const fd = new FormData();
        fd.append('_method',        'put');
        fd.append('nom',            values.nom);
        fd.append('description',    values.description ?? '');
        fd.append('purchase_price', String(values.purchase_price));
        fd.append('sale_price',     String(values.sale_price));
        fd.append('stock_quantity', String(values.stock_quantity));

        if (values.image)  fd.append('image', values.image);
        else if (removeImage) fd.append('image', '');   // signal removal

        router.post(`/produits/${produit.uuid}`, fd, {
            forceFormData: true,
            onStart:  () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError:  (errors) => {
                const first = Object.values(errors)[0];
                toast.error(first ?? 'Please fix the errors below.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${produit.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/produits/${produit.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Edit Product</h1>
                            <p className="text-sm text-slate-400">Update {produit.nom}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl" onClick={() => router.visit(`/produits/${produit.uuid}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View Product
                    </Button>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* SIDEBAR */}
                    <div className="space-y-4">

                        {/* Image */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Upload className="h-4 w-4 text-slate-400" /> Product Image
                            </h3>
                            <Controller control={form.control} name="image" render={({ field: { onChange } }) => (
                                <label className="cursor-pointer block">
                                    <div className={`relative aspect-square rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${preview ? 'border-transparent' : 'border-slate-200 hover:border-slate-400 bg-slate-50'}`}>
                                        {preview ? (
                                            <>
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button"
                                                    className="absolute top-2 right-2 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                                                    onClick={e => { e.preventDefault(); setPreview(null); onChange(null); setRemoveImage(true); }}>
                                                    <X className="h-4 w-4 text-slate-600" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2 p-4">
                                                <Upload className="h-8 w-8 text-slate-300 mx-auto" />
                                                <p className="text-xs text-slate-400">Click to upload image</p>
                                                <p className="text-xs text-slate-300">PNG, JPG, WEBP</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) { onChange(file); setPreview(URL.createObjectURL(file)); setRemoveImage(false); }
                                    }} />
                                </label>
                            )} />
                        </div>

                        {/* SKU */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
                            <div className="rounded-lg bg-white p-2 shadow-sm">
                                <Tag className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">SKU</p>
                                <p className="font-mono font-semibold text-slate-700">{produit.sku}</p>
                            </div>
                        </div>

                        {/* Margin */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-400" /> Margin Preview
                            </h3>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Purchase</span>
                                    <span className="font-mono font-semibold">{Number(watchPurchase).toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Sale</span>
                                    <span className="font-mono font-semibold">{Number(watchSale).toFixed(2)} MAD</span>
                                </div>
                                <div className="border-t pt-1.5 flex justify-between">
                                    <span className="font-bold text-slate-700">Margin</span>
                                    <span className={`font-mono font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {margin >= 0 ? '+' : ''}{margin.toFixed(2)} MAD
                                        {Number(watchPurchase) > 0 && <span className="ml-1">({marginPct.toFixed(1)}%)</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORM */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Basic */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-400" /> Basic Information
                            </h3>
                            <Controller control={form.control} name="nom" render={({ field, fieldState }) => (
                                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                    <FieldLabel className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Name *</FieldLabel>
                                    <Input className="rounded-xl" {...field} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={form.control} name="description" render={({ field }) => (
                                <Field className="flex flex-col gap-1.5">
                                    <FieldLabel className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</FieldLabel>
                                    <Textarea className="rounded-xl resize-none h-24" {...field} />
                                </Field>
                            )} />
                        </div>

                        {/* Pricing */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-slate-400" /> Pricing
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Controller control={form.control} name="purchase_price" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-slate-500 uppercase tracking-wide">Purchase Price</FieldLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">MAD</span>
                                            <Input type="number" step="0.01" min="0" className="rounded-xl pl-12" {...field} />
                                        </div>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                                <Controller control={form.control} name="sale_price" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sale Price</FieldLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">MAD</span>
                                            <Input type="number" step="0.01" min="0" className="rounded-xl pl-12" {...field} />
                                        </div>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-slate-400" /> Inventory
                            </h3>
                            <Controller control={form.control} name="stock_quantity" render={({ field, fieldState }) => (
                                <Field className="flex flex-col gap-1.5 max-w-xs" data-invalid={fieldState.invalid}>
                                    <FieldLabel className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Quantity</FieldLabel>
                                    <Input type="number" min="0" className="rounded-xl"
                                        value={field.value} onChange={e => field.onChange(Number(e.target.value))} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" className="rounded-xl px-6"
                                onClick={() => router.visit(`/produits/${produit.uuid}`)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" className="rounded-xl px-6" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
