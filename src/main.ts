import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { Stats } from 'fs';
import { lstatSync, readdirSync } from 'fs-extra';
import { join, parse, ParsedPath } from 'path';
import { DataGroup, DataItem, DataValue } from './storage';

/** For readability. */
type IpcEvent = Electron.IpcMainEvent;
type IpcInvokeEvent = Electron.IpcMainInvokeEvent;

/** Shortcuts storage. */
const shortcuts = new DataGroup('Shortcuts');

/** Configs storage. */
const configs = new DataGroup('Configs');
const user = new DataItem(configs, 'user');

/** Instance detection. */
const requestSingleInstanceLock = app.requestSingleInstanceLock();
if (!requestSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (): void => {
    if (browserWindow) {
      browserWindow.maximize();
    }
  });
}

/** Primary window instance. */
let browserWindow: BrowserWindow | undefined;

/** Initialize data. */
function initData(): void {
  if (!user.load().initiated) {
    user.save({ initiated: true });
    const desktopPath: string = app.getPath('desktop');
    for (const item of readdirSync(desktopPath)) {
      const itemPath: string = join(desktopPath, item);
      const itemParsed: ParsedPath = parse(item);
      const itemStats: Stats = lstatSync(itemPath);
      if (itemStats.isFile() && !['.ini'].includes(itemParsed.ext)) {
        const shortcut = new DataItem(shortcuts);
        shortcut.save({
          id: shortcut.id,
          label: itemParsed.name,
          path: itemPath,
          category: 'Desktop',
        });
        // image_search({ query: value.label }).then((data: DuckDuckGoImage[]): void => {
        //   if (data[0]) {
        //     value.icon = data[0].thumbnail;
        //     shortcut.save(value);
        //   }
        // });
      }
    }
  }
}

/** Create and show window. */
function createWindow(): void {
  /** Create the browser window. */
  browserWindow = new BrowserWindow({
    movable: false,
    transparent: true,
    resizable: false,
    fullscreen: true,
    titleBarStyle: 'hidden',
    title: 'AppsBox',
    show: requestSingleInstanceLock,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });
  /** Load the index.html of the app. */
  browserWindow.loadFile(join(__dirname, 'web', 'index.html'));
  /** Open the DevTools. */
  // browserWindow.webContents.openDevTools();
}

/** Watch event to hide the window. */
ipcMain.on('window:hide', (event: IpcEvent, after: number): void => {
  setTimeout((): void => {
    browserWindow?.minimize();
  }, after);
});

/**
 * Watch event to launch a shortcut.
 * Works in production mode only.
 */
ipcMain.on('shortcut:launch', (event: IpcEvent, shortcut: DataValue): void => {
  if (shortcut.path && app.isPackaged) {
    shell.openExternal(shortcut.path);
  }
});

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', (): void => {
  /** Watch event to list shortcuts. */
  ipcMain.handle('shortcut:list', async (): Promise<DataValue[]> => {
    return shortcuts.loadItems();
  });
  /** Watch event to retrieve shortcut. */
  ipcMain.handle('shortcut:retrieve', async (event: IpcInvokeEvent, id: string): Promise<DataValue | undefined> => {
    return shortcuts.items.get(id)?.load();
  });
  /** Watch event to destroy shortcut. */
  ipcMain.handle('shortcut:destroy', async (event: IpcInvokeEvent, id: string): Promise<boolean> => {
    const shortcut: DataItem | undefined = shortcuts.items.get(id);
    if (shortcut) {
      shortcut.destroy();
    }
    return Boolean(shortcut);
  });
  /** Watch event to update shortcut. */
  ipcMain.handle('shortcut:update', async (
    event: IpcInvokeEvent,
    id: string,
    data: DataValue,
  ): Promise<DataValue | undefined> => {
    const shortcut: DataItem | undefined = shortcuts.items.get(id);
    if (shortcut) {
      return shortcut.save(data);
    }
    return;
  });
  /** Watch event to create shortcut. */
  ipcMain.handle('shortcut:create', async (event: IpcInvokeEvent, data: DataValue): Promise<DataValue> => {
    return new DataItem(shortcuts).save(data);
  });
  /** Initialize data. */
  initData();
  /** Create app window. */
  createWindow();
  /** Check for update. */
  // checkForUpdate();
  /** Watch activate event. */
  app.on('activate', (): void => {
    /**
     * On macOS, it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     */
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
