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
    <div className="dialog-backdrop confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="deleteConfirmTitle">
      <section className="confirm-dialog">
        <h2 id="deleteConfirmTitle">{t('delete.confirmTitle')}</h2>
        <p>{t('delete.confirmMessage', { name: automation.name })}</p>
        <div className="confirm-actions">
          <button className="ui-button ui-button-ghost ui-button-dialog" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            className="ui-button ui-button-destructive ui-button-dialog danger-submit"
            type="button"
            onClick={onConfirm}
          >
            {t('common.delete')}
          </button>
        </div>
      </section>
    </div>
  );
}
