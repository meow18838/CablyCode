// Add this at the very top of main.js, before any other code
if (require('electron-squirrel-startup')) {
    app.quit();
    return;
}

// Handle Squirrel events
if (process.platform === 'win32') {
    const setupEvents = require('./installers/setupEvents');
    if (setupEvents.handleSquirrelEvent()) {
        return;
    }
}

const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store');
const store = new Store();

// Store the file path if app is launched with a file
let fileToOpen = null;
if (process.argv.length >= 2) {
    const arg = process.argv[1];
    if (arg === '.') {
        fileToOpen = process.cwd();
    } else if (!arg.startsWith('--')) {
        fileToOpen = path.resolve(arg);
    }
}

function createWindow(filePath = null) {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            enableRemoteModule: true
        },
        icon: app.isPackaged 
            ? path.join(process.resourcesPath, 'image.png')
            : path.join(__dirname, 'image.png'),
        title: 'CablyCode',
        frame: false,
        backgroundColor: '#1e1e1e'
    })

    win.loadFile('index.html')

    // Wait for the window to be ready before sending the file path
    if (filePath) {
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('open-file', filePath);
        });
    }
}

// Add this event listener for new windows
app.on('create-new-window', () => {
    createWindow();
});

app.whenReady().then(() => {
    // If a file was passed on launch, open it
    if (fileToOpen && fileToOpen !== '.') {
        createWindow(fileToOpen);
    } else {
        createWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
