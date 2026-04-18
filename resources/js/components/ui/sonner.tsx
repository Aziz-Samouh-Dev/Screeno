import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => (
    <Sonner
        richColors
        closeButton
        position="top-right"
        toastOptions={{
            classNames: {
                toast: 'font-sans text-sm rounded-2xl border shadow-lg',
            },
        }}
        {...props}
    />
);

export { Toaster };
