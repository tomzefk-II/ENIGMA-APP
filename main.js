const electron = require('electron')
const { autoUpdater } = require('electron-updater')
// Module to control application life.
const appElectron = electron.app
const {ipcMain} = require('electron')
var path = require('path')
const { app, BrowserWindow } = require('electron')

// var jsdom = require('jsdom');
// const { JSDOM } = jsdom;
// const { window } = new JSDOM();
// const { document } = (new JSDOM('')).window;
// global.document = document;
//
// var $, jQuery;
// $ = jQuery = require('jquery');

function startLoadingApp() {
  const winLoading = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winLoading.loadFile('index.html')
  setTimeout(function(){
    startApp();
  },500)
}

let winApp;
function startApp() {
  winApp = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winApp.loadFile('home.html')
  winApp.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(startLoadingApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startLoadingApp();
  }
})

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


autoUpdater.on('update-available', () => {
  winApp.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  winApp.webContents.send('update_downloaded');
});
