import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Ticket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface InviteCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void; // Optional callback to trigger after successful redemption
}

export function InviteCodeModal({ open, onOpenChange, onSuccess }: InviteCodeModalProps) {
    const { t, i18n } = useTranslation(['common']);
    const { updateUser } = useAuth();
    const [code, setCode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const redeemMutation = useMutation({
        mutationFn: async (inviteCode: string) => {
            // Backend validates and returns status 'ok' or 'already_redeemed'
            return authApi.redeemInvite({ code: inviteCode });
        },
        onSuccess: (data) => {
            if (data.can_subscribe) {
                // Optimistically update the user context
                updateUser({ can_subscribe: true, invite_channel: data.channel });
                toast.success(t('common:invite.success_redeemed', 'You have successfully unlocked subscription features!'));
                onOpenChange(false);
                setCode('');

                // Trigger further actions (like opening the subscription config modal)
                if (onSuccess) {
                    onSuccess();
                }
            }
        },
        onError: (error: any) => {
            // Map backend 400 errors to friendly messages
            let errorMsg = error.message || t('common:invite.invalid_code');
            toast.error(errorMsg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        redeemMutation.mutate(code.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md glass-card border flex flex-col items-center pt-8 pb-6">
                <DialogHeader className="flex flex-col items-center text-center space-y-3 relative z-10 w-full mb-2">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                        <Ticket className="w-8 h-8 text-primary relative z-10" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    </div>

                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        {t('common:invite.modal_title', 'Access Invite Required')}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        {t('common:invite.modal_desc', 'Please enter your invite code to unlock live trading capabilities and strategy subscriptions.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="w-full space-y-4 px-2">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="sr-only">Invite Code</Label>
                        <div className="relative">
                            <Input
                                id="code"
                                ref={inputRef}
                                placeholder={t('common:invite.placeholder', 'e.g. VTX-XXXX')}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className={`text-center text-lg tracking-widest font-mono h-12 bg-secondary/30 border-border/50 uppercase ${!code ? 'px-16' : ''}`}
                                autoComplete="off"
                            />
                            {!code && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="absolute right-1 top-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-primary"
                                    onClick={async () => {
                                        try {
                                            if (navigator.clipboard && window.isSecureContext) {
                                                const text = await navigator.clipboard.readText();
                                                if (text) {
                                                    setCode(text.toUpperCase().trim());
                                                    toast.success(t('common:paste_success', 'Pasted from clipboard'));
                                                } else {
                                                    toast.info(t('common:paste_empty', 'Clipboard is empty'));
                                                    inputRef.current?.focus();
                                                }
                                            } else {
                                                toast.error(t('common:error', 'Error') + ': ' + t('common:error_clipboard_blocked', 'Browser blocked clipboard access. Please use Ctrl+V or long-press to paste.'));
                                                inputRef.current?.focus();
                                            }
                                        } catch (err) {
                                            toast.error(t('common:error_clipboard_denied', 'Clipboard permission denied. Please paste manually.'));
                                            inputRef.current?.focus();
                                            console.error('Failed to read clipboard contents: ', err);
                                        }
                                    }}
                                >
                                    {t('common:paste', 'Paste')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-bold gradient-primary shadow-lg shadow-primary/20"
                        disabled={!code.trim() || redeemMutation.isPending}
                    >
                        {redeemMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t('common:invite.submitting', 'Verifying...')}
                            </>
                        ) : (
                            t('common:invite.submit_btn', 'Redeem Code')
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
