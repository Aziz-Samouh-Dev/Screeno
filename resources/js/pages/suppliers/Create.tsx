import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Suppliers', href: '/suppliers' },
  { title: 'Create new supplier', href: '/suppliers/create' },
];

const formSchema = z.object({
  nom: z.string().min(1, { message: 'Supplier name is required' }),
  email: z.string().email().optional(),
  telephone: z
    .string()
    .min(1, { message: 'Phone is required' })
    .regex(/^[0-9]+$/, { message: 'Phone must contain only numbers' }),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSupplier() {
  const [processing, setProcessing] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      notes: '',
      status: 'active',
    },
  });

  function onSubmit(values: FormValues) {
    router.post('/suppliers', values, {
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
      onError: (errors) => setServerErrors(errors),
    });
  }

  function onReset() {
    form.reset();
    form.clearErrors();
    setServerErrors({});
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Supplier" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative overflow-hidden rounded-xl border p-6">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onReset={onReset}
            className="space-y-8 @container"
          >
            <div className="grid grid-cols-12 gap-4">

              {/* Header */}
              <div className="col-span-12">
                <p className="leading-7">
                  <span className="text-lg font-semibold">Supplier Information</span><br />
                  <span className="text-sm text-muted-foreground">
                    Add a new supplier to your system.
                  </span>
                </p>
              </div>

              {/* Name */}
              <Controller
                control={form.control}
                name="nom"
                render={({ field, fieldState }) => (
                  <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2" data-invalid={fieldState.invalid}>
                    <FieldLabel>Full Name *</FieldLabel>
                    <Input placeholder="Supplier Name" {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2" data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" placeholder="supplier@email.com" {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Phone */}
              <Controller
                control={form.control}
                name="telephone"
                render={({ field, fieldState }) => (
                  <Field
                    className="col-span-12 lg:col-span-6 flex flex-col gap-2"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>Phone *</FieldLabel>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      {...field}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/\D/g, '');
                        field.onChange(target.value);
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Status */}
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <FieldLabel>Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {/* Address */}
              <Controller
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <Field className="col-span-12 flex flex-col gap-2">
                    <FieldLabel>Address</FieldLabel>
                    <Textarea className="h-20" placeholder="Street, building..." {...field} />
                  </Field>
                )}
              />

              {/* City */}
              <Controller
                control={form.control}
                name="ville"
                render={({ field }) => (
                  <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <FieldLabel>City</FieldLabel>
                    <Input placeholder="Casablanca" {...field} />
                  </Field>
                )}
              />

              {/* Notes */}
              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <Field className="col-span-12 flex flex-col gap-2">
                    <FieldLabel>Notes</FieldLabel>
                    <Textarea className="h-28" placeholder="Internal notes..." {...field} />
                  </Field>
                )}
              />

              <hr className="col-span-12 my-4" />

              {/* Actions */}
              <div className="col-span-12 border-t pt-6 mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={processing}
                  className="w-full sm:w-40"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-40"
                >
                  {processing ? 'Creating...' : 'Create Supplier'}
                </Button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}