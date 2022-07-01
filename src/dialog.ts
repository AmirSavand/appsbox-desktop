import { dialog, nativeImage } from 'electron';
import { getIcon } from './icon';

export function showDialog(detail: string[], buttons: string[] = ['ok']) {
  return dialog.showMessageBox({
    title: `AppsBox`,
    message: '',
    detail: detail.join('\n'),
    buttons,
    icon: nativeImage.createFromPath(getIcon().png),
  });
}
