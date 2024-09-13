// ##### index.js


const { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage, dialog, ipcRenderer, ipcMain } = require('electron')
const os = require('os');
const path = require('path');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
// const { autoUpdater } = require('electron-updater');
const { exec } = require('child_process');
const util = require('util');
// const fetch = require('node-fetch'); // Use node-fetch for server-side requests
const dnstls = require('dns-over-tls');
const dns = require('dns');

let log_file_path;
if (os.platform() === 'darwin') {
  let userDataPath = path.join(os.homedir(), '.swiftllm');
  log_file_path = path.join(userDataPath, 'debug.log');
} else {
  log_file_path = path.join(__dirname, '../../debug.log');
}

// Log console.log() calls to a file
const log_file = fs.createWriteStream(log_file_path, {flags : 'w'});
const log_stdout = process.stdout;
const log_stderr = process.stderr;

// Override console.log() globally
console.log = function(...args) {
  const currentDate = new Date();
  const currentTime = currentDate.toLocaleString();
  log_file.write(currentTime + ' ::: ' + util.format(...args) + '\n\n');
  log_stdout.write(util.format(...args) + '\n\n');
};
// Override console.error() globally
console.error = function(...args) {
  const currentDate = new Date();
  const currentTime = currentDate.toLocaleString();
  log_file.write(currentTime + ' :X: ' + util.format(...args) + '\n\n');
  log_stderr.write(util.format(...args) + '\n\n');
}



// // Configure autoUpdater
// autoUpdater.autoDownload = true;
// autoUpdater.autoInstallOnAppQuit = true;

// function checkForUpdates() {
//   autoUpdater.checkForUpdates();
// }



// Initial creation of the blocker
let blocker;
let intervalId;
// URL for Hagezi's blocklist (choose the appropriate one for your needs)
let HAGEZI_LIST_URL = 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt';
let ONEHOSTS_LIST_URL = 'https://raw.githubusercontent.com/badmojr/1Hosts/master/Lite/hosts.txt';
let OISD_LIST_URL = 'https://big.oisd.nl/';
let ADGUARD_DNS_LIST_URL = 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_15_DnsFilter/filter.txt';
let ADGUARD_TRACKING_LIST_URL = 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_3_Spyware/filter.txt';
let EASYLIST_LIST_URL = 'https://easylist.to/easylist/easylist.txt';
let EASYPRIVACY_LIST_URL = 'https://easylist.to/easylist/easyprivacy.txt';
let STEVEN_BLACK_LIST_URL = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';



// Function to create and update the blocker
async function createAndUpdateBlocker(session) {
  try {
    let cachePath;
    if (os.platform() === 'darwin') {
      let userDataPath = path.join(os.homedir(), '.swiftllm');
      cachePath = path.join(userDataPath, 'adblocker_cache.bin');
    } else {
      cachePath = path.join(__dirname, '../../adblocker_cache.bin');
    }
    
    if (blocker) {
      await blocker.updateFromLists(fetch, [HAGEZI_LIST_URL], {
        path: cachePath,
        read: fs.readFile,
        write: fs.writeFile,
      });
      console.log('Adblocker updated');
    } else {
      blocker = await ElectronBlocker.fromLists(fetch, [HAGEZI_LIST_URL], {
        path: cachePath,
        read: fs.readFile,
        write: fs.writeFile,
      });
      const sessions = BrowserWindow.getAllWindows().map(window => window.webContents.session);
      sessions.forEach(session => {
        blocker.enableBlockingInSession(session);
      });
      console.log('Adblocker created and enabled');
    }
    return blocker;
  } catch (error) {
    console.error('Failed to update adblocker:', error);
  }
}

// Function to disable the adblocker
function disableAdblocker() {
  if (blocker) {
    const sessions = BrowserWindow.getAllWindows().map(window => window.webContents.session);
    sessions.forEach(session => {
      blocker.disableBlockingInSession(session);
    });
    console.log('Adblocker disabled');
  }
}











ipcMain.handle('call-isLaunchAtStartupEnabled', () => {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
});


ipcMain.on('call-createAndUpdateaAblocker', (eventß) => {
  createAndUpdateBlocker().then(result => {
    blocker = result;
  });
  // Set up automatic updates (e.g., every 1 hour)
  if (!intervalId) {
    const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    intervalId = setInterval(() => {
      createAndUpdateBlocker().then(result => {
        if (result) {
          blocker = result;
        }
      });
    }, UPDATE_INTERVAL);
  }
});

ipcMain.on('call-disableAdblocker', (event) => {
  disableAdblocker();
  clearInterval(intervalId);
});


ipcMain.on('call-enableLaunchAtStartup', (event) => {
  setLaunchAtStartup(true);
});

ipcMain.on('call-disableLaunchAtStartup', (event) => {
  setLaunchAtStartup(false);
});





// ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
//   path: 'engine.bin',
//   read: fs.readFile,
//   write: fs.writeFile,
// }).then((blocker) => {
//   blocker.enableBlockingInSession(session.defaultSession);
// });




let tray = null
let mainWindow;






// Setup main window and all basic elements


if (os.platform() === 'win32') {
  app.setUserTasks([
    {
      program: process.execPath,
      arguments: '--new-window',
      iconPath: process.execPath,
      iconIndex: 0,
      title: 'SwiftLLM',
      description: 'SwiftLLM'
    }
  ]);

  // Assuming you have a way to capture the user's preference, call this function with true to enable or false to disable
  // setLaunchAtStartup(true); // To enable
  // setLaunchAtStartup(false); // To disable
}


// Example function to set the app to launch at startup
function setLaunchAtStartup(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    // For macOS, you can also control if the app is hidden on launch
    openAsHidden: enable, // This is optional and macOS only
    // For Windows, you can specify arguments to launch the app with
    // args: [
    //   '--your-argument-here'
    // ]
  });
}


function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      icon: path.join(__dirname, 'assets/icon.ico'),
      webviewTag: true,  // Enable the use of <webview> tag
      contextIsolation: false,
      nodeIntegration: true,

      // contextIsolation: true,
      // nodeIntegration: false, 
      // sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      safeDialogs: true,
    }
  });

  mainWindow.webContents.on('did-attach-webview', (_, contents) => {
    contents.setWindowOpenHandler((details) => {
      mainWindow.webContents.send('open-url', details.url);
      return { action: 'deny' }
    })
  })

  

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  app.on('before-quit', (event) => {
    process.exit(0);
  });

  
}

// Prevent a second instance from running
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  process.exit(0);
}

// Show currently open app if a second instance run is attempted
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should show and focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    if (!mainWindow.isFocused()) mainWindow.focus();
  }
});





let toggleShortcut = 'Ctrl+Space';
let shortcutLock = 'Ctrl+Alt+L';



let shortcutsRegistered = false;
let currentTimestampShortcut = Date.now();
// Register a single global shortcut to toggle the window
const registerToggleShortcut = () => {
  globalShortcut.register(toggleShortcut, () => {
    if (Date.now() - currentTimestampShortcut < 100) return;

    if (mainWindow.isVisible()) {
      if (mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.focus();
      }
    } else {
      mainWindow.show();
    }
    currentTimestampShortcut = Date.now();
  });
  shortcutsRegistered = true;
};

function unregisterToggleShortcut() {
  globalShortcut.unregister(toggleShortcut);
  shortcutsRegistered = false;
}



let toggleLocked = false;
let currentTimestampShortcutLock = Date.now();
// Register shortcut lock
const registerShortcutLock = () => {
  globalShortcut.register(shortcutLock, () => {
    if (Date.now() - currentTimestampShortcutLock < 100) return;

    if (toggleLocked) {
      toggleLocked = false;
      registerToggleShortcut();
    } else {
      toggleLocked = true;
      unregisterToggleShortcut();
    }

    currentTimestampShortcutLock = Date.now();
  });
};


let dns_server = '663533.dns.nextdns.io'
let dns_ip = '45.90.28.15'

// // Attempt 1
// async function resolveDnsOverTls(hostname, rrtype = 'A') {
//   const options = {
//       name: hostname,
//       host: dns_ip, // Cloudflare DNS server
//       servername: dns_server,
//       type: rrtype,
//   };
//   try {
//       const response = await dnstls.query(options);
//       console.log(response);
//       return response.answers.map(answer => answer.data);
//   } catch (error) {
//       console.error('DNS-over-TLS query failed:', error);
//       throw error;
//   }
// }

// // Override the default dns.lookup method
// dns.lookup = (hostname, options, callback) => {
//   if (typeof options === 'function') {
//       callback = options;
//       options = {};
//   }
//   const rrtype = options.family === 6 ? 'AAAA' : 'A';
//   resolveDnsOverTls(hostname, rrtype)
//       .then(addresses => {
//           if (options.all) {
//               callback(null, addresses.map(address => ({ address, family: rrtype === 'AAAA' ? 6 : 4 })));
//           } else {
//               callback(null, addresses[0], rrtype === 'AAAA' ? 6 : 4);
//           }
//           console.log(addresses);
//       })
//       .catch(callback);
// };

// // Attempt 2
// const options = {
//   host: dns_ip,
//   servername: dns_server,
//   port: 853,
// };

// const sessions = BrowserWindow.getAllWindows().map(window => window.webContents.session);
// sessions.forEach(session => {
//   session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
//     const url = details.url;
//     const hostname = url.split(':')[0];
  
//     dnstls.query(hostname, options).then((dnsResponse) => {
//       const ip = dnsResponse.answers[0].data;
//       callback({ cancel: true, redirectURL: `http://${ip}:80` });
//     });
//   });
// });



app.whenReady().then(() => {


  createMainWindow();

  

  // Check for app updates
  // checkForUpdates();

  // blocker.enableBlockingInSession(mainWindow.webContents.session);



  registerToggleShortcut();
  registerShortcutLock();


  app.setName('SwiftLLM');




  // Create tray icon for the windows system tray / macos tray
  // Define the icon path based on the platform
  let iconPath = path.join(__dirname, 'assets/icon');
  if (os.platform() === 'win32') {
    iconPath += '.ico';  // Use .ico format for Windows
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);
  } else {
    iconPath += '.png';  // Use .png format for macOS
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon.resize({ width: 22, height: 22 }));
  }

  mainWindow.webContents.on('did-attach-webview', (_, contents) => {
    const contextMenuRightClick = Menu.buildFromTemplate([
      {
      label: 'Copy',
      role: 'copy'
      },
      {
      label: 'Paste',
      role: 'paste'
      },
      {
      label: 'Search / Open',
      click: () => {
          let searchText = contents.executeJavaScript('window.getSelection().toString().trim()');
          searchText.then((result) => {
            if (result.startsWith('http://') || result.startsWith('https://')) {
              mainWindow.webContents.send('open-url', result);
            } else {
              let searchParams = new URLSearchParams();
              searchParams.append('q', result);
              let url = `https://www.google.com/search?${searchParams.toString()}`;
              mainWindow.webContents.send('open-url', url);
            }
        }).catch((error) => { console.error(error); });
      }}
    ]);



    contents.on('context-menu', (_, params) => {
      contextMenuRightClick.popup({
        window: mainWindow,
        x: params.x,
        y: params.y
      });
    });
  });

  const contextMenuTrayIcon = Menu.buildFromTemplate([
    {
      label: 'SwiftLLM',
      enabled: true, // Set enabled to true to make the option clickable
      click: (event) => {
        // Do nothing
      }
    },
    {
      label: 'Close', 
      click: () => {
        process.exit(0);
      }
    }
  ]);

  tray.setToolTip('SwiftLLM');
  tray.setContextMenu(contextMenuTrayIcon);

  // if (os.platform() === 'darwin') {
  //   // macOS specific code
  //   app.dock.hide();
  // }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  mainWindow.focus();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});



