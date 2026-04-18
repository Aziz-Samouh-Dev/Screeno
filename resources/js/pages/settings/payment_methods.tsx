import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

export type PaymentMethod = {
    uuid: string;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    paymentMethods: {
        data: PaymentMethod[];
        meta: any;
        links: any;
    };
};

export default function PaymentMethods({ paymentMethods }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PaymentMethod | null>(null);

    const form = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    const handleCreate = () => {
        setEditing(null);
        form.reset();
        setOpen(true);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditing(method);
        form.setData({
            name: method.name,
            code: method.code,
            description: method.description || '',
            is_active: method.is_active,
        });
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/settings/payment_methods/${editing.uuid}`, {
                onSuccess: () => setOpen(false),
            });
        } else {
            form.post('/settings/payment_methods', {
                onSuccess: () => setOpen(false),
            });
        }
    };

    const handleDelete = (uuid: string) => {
        if (confirm('Are you sure you want to delete this payment method?')) {
            router.delete(`/settings/payment_methods/${uuid}`);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Payment Methods', href: '/settings/payment_methods' }]}>
            <Head title="Payment Methods" />
            <h1 className="sr-only">Payment Methods</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Payment Methods"
                        description="Manage all payment methods available in your system"
                    />

                    <div className="flex justify-end">
                        <Button onClick={handleCreate}>+ Add Payment Method</Button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Code</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Active</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {paymentMethods.data.map((method) => (
                                    <tr key={method.uuid}>
                                        <td className="px-4 py-2">{method.name}</td>
                                        <td className="px-4 py-2">{method.code}</td>
                                        <td className="px-4 py-2">{method.is_active ? '✔' : '✖'}</td>
                                        <td className="px-4 py-2 space-x-2">
                                            <Button size="sm" onClick={() => handleEdit(method)}>Edit</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(method.uuid)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sheet for Create/Edit */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetContent side="right" className=" ">
                            <SheetHeader>
                                <SheetTitle>{editing ? 'Edit' : 'Add'} Payment Method</SheetTitle>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div>
                                    <Label>Code</Label>
                                    <Input
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        required
                                        disabled={editing !== null}
                                    />
                                    <InputError message={form.errors.code} />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                    />
                                    <InputError message={form.errors.description} />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={form.data.is_active}
                                        onCheckedChange={(value) => form.setData('is_active', value)}
                                    />
                                    <span>Active</span>
                                </div>
                                <SheetFooter className="flex justify-end space-x-2 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit">{editing ? 'Update' : 'Save'}</Button>
                                </SheetFooter>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}