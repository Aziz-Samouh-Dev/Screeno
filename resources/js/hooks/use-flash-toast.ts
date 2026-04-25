import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export function useFlashToast() {
    useEffect(() => {
        return router.on('navigate', (event) => {
            const flash = (event.detail.page.props as any)?.flash;
            if (flash?.success) toast.success(flash.success);
            if (flash?.error)   toast.error(flash.error);
            if (flash?.warning) toast.warning(flash.warning);
            if (flash?.info)    toast.info(flash.info);
        });
    }, []);
}
