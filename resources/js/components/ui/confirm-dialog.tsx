import { useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title = 'Confirmer la suppression',
    description = 'Cette action est irréversible. Voulez-vous vraiment continuer ?',
    confirmLabel = 'Supprimer',
    onConfirm,
    loading = false,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <DialogTitle className="text-base">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-slate-500 pl-13">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="destructive" className="rounded-xl" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Suppression…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function useConfirmDialog() {
    const [state, setState] = useState<{ open: boolean; onConfirm: () => void; title?: string; description?: string }>({
        open: false,
        onConfirm: () => {},
    });

    const confirm = (opts: { onConfirm: () => void; title?: string; description?: string }) => {
        setState({ open: true, ...opts });
    };

    const close = () => setState(s => ({ ...s, open: false }));

    return { confirmState: state, confirm, closeConfirm: close };
}
