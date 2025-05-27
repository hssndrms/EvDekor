
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as db from './database'; // We'll create this next

// Configure logging for auto-updater
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';
log.info('App starting...');

let mainWindow: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../assets/icon.png') // Adjust path if needed
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server URL
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for updates after window is ready and shown
  mainWindow.once('ready-to-show', () => {
    log.info('Main window ready to show. Checking for updates.');
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// Basic Menu
const createMenu = () => {
  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            log.info('Manual update check triggered.');
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];
  
  if ((process as NodeJS.Process).platform === 'darwin') {
      template.unshift({
          label: app.getName(),
          submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
          ]
      });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};


app.on('ready', async () => {
  log.info('App ready event.');
  await db.initDatabase(app.getPath('userData'));
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if ((process as NodeJS.Process).platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-all-data', async (event, entity: string) => {
  log.info(`IPC: get-all-data for ${entity}`);
  return db.getAll(entity);
});
ipcMain.handle('get-by-id', async (event, entity: string, id: string) => {
  log.info(`IPC: get-by-id for ${entity} with id ${id}`);
  return db.getById(entity, id);
});
ipcMain.handle('add-data', async (event, entity: string, data: any) => {
  log.info(`IPC: add-data for ${entity}`);
  return db.add(entity, data);
});
ipcMain.handle('update-data', async (event, entity: string, data: any) => {
  log.info(`IPC: update-data for ${entity} with id ${data.id}`);
  return db.update(entity, data);
});
ipcMain.handle('delete-data', async (event, entity: string, id: string) => {
  log.info(`IPC: delete-data for ${entity} with id ${id}`);
  return db.deleteById(entity, id);
});
ipcMain.handle('get-setting', async (event, key: string) => {
  log.info(`IPC: get-setting for key ${key}`);
  return db.getSetting(key);
});
ipcMain.handle('set-setting', async (event, key: string, value: any) => {
  log.info(`IPC: set-setting for key ${key}`);
  return db.setSetting(key, value);
});

// Auto Updater Events
autoUpdater.on('update-available', (info) => {
  log.info('Update available.', info);
  if (mainWindow) {
    // Optionally send a message to renderer to notify user
    // mainWindow.webContents.send('update-available-message', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.', info);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded.', info);
  // The update will automatically be installed silently on the next app restart.
  // You can prompt the user to restart the app.
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: 'Update Ready',
  //   message: 'A new version has been downloaded. Restart the application to apply the updates.',
  //   buttons: ['Restart', 'Later']
  // }).then((buttonIndex) => {
  //   if (buttonIndex.response === 0) {
  //     autoUpdater.quitAndInstall();
  //   }
  // });
  // For now, let's log and it will install on next quit by user
  log.info('Update will be installed on next quit.');
  if (mainWindow) {
    // mainWindow.webContents.send('update-downloaded-message', info);
  }
});
