// Add this at the very top of main.js, before any other code
if (require('electron-squirrel-startup')) {
    app.quit();
    return;
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
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            enableRemoteModule: true,
            devTools: false
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

    // Handle window close
    win.on('closed', () => {
        app.quit(); // This will quit the entire application
    });
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
    // Force quit on all platforms
    app.quit();
    process.exit(0); // This ensures all Node.js processes are terminated
});

// Add this to handle the quit event
app.on('quit', () => {
    console.log('App quit event received');
    process.exit(0); // Force exit all processes
});
