import { join } from 'path';

/** Return PNG and ICO icons paths. */
export function getIcon(): Record<'ico' | 'png', string> {
  const output = {
    ico: join(__dirname, 'assets', 'icon.png'),
    png: join(__dirname, 'assets', 'icon.png'),
  };
  /** For linux, do not return ico file. */
  if (process.platform === 'linux') {
    output.ico = output.png;
  }
  return output;
}
