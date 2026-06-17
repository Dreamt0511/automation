import { ConfirmationDialog } from '@tutti-os/ui-system';
import { useI18n } from '../i18n';
import type { Automation } from '../types';

type DeleteConfirmDialogProps = {
  automation: Automation;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({ automation, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <ConfirmationDialog
      open
      tone="destructive"
      title={t('delete.confirmTitle')}
      description={t('delete.confirmMessage', { name: automation.name })}
      cancelLabel={t('common.cancel')}
      confirmLabel={t('common.delete')}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
