const electron = require('electron')
const { autoUpdater } = require('electron-updater')
// Module to control application life.
const appElectron = electron.app
const {ipcMain} = require('electron')
var path = require('path')
const { app, BrowserWindow } = require('electron')
const express = require("express")
//
let winIndex;
let winLogin;
let winHome;

function startLoadingApp() {
  winIndex = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    backgroundColor: "#161616",
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winIndex.loadFile('index.html')

  winIndex.once('ready-to-show', () => {
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

autoUpdater.on('error', (evt) => {
  winIndex.webContents.send('error');
});

autoUpdater.on('update-available', () => {
  winIndex.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  winIndex.webContents.send('update_downloaded');
});

autoUpdater.on('update-not-available', () => {
  winIndex.webContents.send('update_not_available');
});


ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


ipcMain.on('open_login', (evt) => {
  winLogin = new BrowserWindow({
    width: 500,
    height: 720,
    frame: false,
    backgroundColor: "#161616",
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  winLogin.loadFile('login.html')
});

ipcMain.on('open_home', (evt) => {
  winHome = new BrowserWindow({
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
  winHome.loadFile('home.html')
});

ipcMain.on('signOut', (evt) => {
  startLoadingApp();
})
