const electron = require('electron')
const { autoUpdater } = require('electron-updater')
// Module to control application life.
const appElectron = electron.app
const {ipcMain} = require('electron')
var path = require('path')
const { app, BrowserWindow } = require('electron')
const express = require("express")
//

function startLoadingApp() {
  const winLoading = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    backgroundColor: "#161616",
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winLoading.loadFile('index.html')
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

ipcMain.on('open_login', (evt) => {
  console.log(evt);
  const winLoading = new BrowserWindow({
    width: 500,
    height: 720,
    frame: false,
    backgroundColor: "#161616",
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winLoading.loadFile('login.html')
});

let winApp;
ipcMain.on('open_home', (evt) => {
  winApp = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    backgroundColor: "#161616",
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false,
    }
  });
  winApp.loadFile('home.html')

  winApp.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
});

ipcMain.on('signOut', (evt) => {
  startLoadingApp();
})

autoUpdater.on('update-available', () => {
  winApp.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  winApp.webContents.send('update_downloaded');
});
