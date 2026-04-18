import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export function useFlashToast() {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info)    toast.info(flash.info);
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);
}
