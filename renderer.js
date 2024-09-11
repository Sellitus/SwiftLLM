const { ipcRenderer, shell, Menu, globalShortcut } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

// renderer.js

let baseUrls = {
  perplexity: "https://www.perplexity.ai/",
  copilot: "https://copilot.microsoft.com/",
  gemini: "https://gemini.google.com/",
  chatgpt: "https://chatgpt.com/",
  perplexitylabs: "https://labs.perplexity.ai/",
  mistral: "https://chat.mistral.ai/chat",
  claude: "https://claude.ai/new",
  custom1: "http://127.0.0.1:7860",
  custom2: "https://www.wikipedia.org/",
  custom3: "https://scholar.google.com/",
  custom4: "https://researchrabbitapp.com/home",
  custom5: "https://www.connectedpapers.com/",
  custom6: "https://www.google.com/",
  browserHomeUrl: "https://www.google.com/"
};

let defaultLlm = 'perplexity';

let browserViewActive = false;
let sidebarExpanded = false;
let menuExpanded = false;

let fullNames = {};

// Load settings from the config file
let config = {};




// Initialize by saving all fullNames
let options = document.querySelectorAll('.dropdown-section > div');
options.forEach(option => {
  fullNames[option.id] = option.textContent;
});
setCollapsedMenuIcons(options);

// Function to hide all webviews
function hideAllWebviews(containerId) {
  let webview_containers = document.querySelectorAll(containerId);
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  webviews.forEach(webview => {
    webview.classList.remove('active');
    webview.classList.add('inactive');
    webview.style.display = 'none';
  });

  return webviews;
}

// Function to show a specific webview
function showWebview(webviewId) {
  let selectedWebview = document.getElementById(webviewId);
  if (selectedWebview) {
    selectedWebview.classList.add('active');
    selectedWebview.classList.remove('inactive');
    selectedWebview.style.display = 'flex';
  }
}

// Function to select and display a webview by ID
function selectWebview(llmId) {
  hideAllWebviews('#llm-container');
  showWebview(llmId);

  config.state.selectedLLM = llmId;
  saveSettings(config);

  focusWebview(llmId);
}

// Function to select a URL and display it in all webviews
function selectURL(url) {
  let webviews = hideAllWebviews('#browser-container');

  webviews.forEach(webview => {
    webview.src = url;
  });

  focusWebview('browser-webview');
}

// Function to navigate back in the active LLM webview
function navigateBackLLM() {
  let activeWebview = document.querySelector('.llm-browser.active');
  if (activeWebview && activeWebview.canGoBack()) {
    activeWebview.goBack();
  }
}

function expandMenu() {
  let sideBar = document.getElementById('side-bar');
  let webviewContainer = document.getElementById('llm-container');
  sideBar.classList.add('expanded');
  webviewContainer.style.width = 'calc(100% - 250px)'; // Adjust width for expanded sidebar
  sidebarExpanded = true;


  let menuIcon = document.getElementById('toggle-button');
  menuIcon.innerText = 'Settings';


  // Show buttons with full names
  options.forEach(option => {
    let divId = option.id;
    let fullName = fullNames[divId];
    if (fullName === '+ Browser View') {
      if (!browserViewActive) {
        option.textContent = '+ Browser View';
      } else {
        option.textContent = '- Browser View';
      }
    } else {
      option.textContent = fullName; // Show full name
    }
  });
  focusWebview(llmId);
}




let menuIcon = document.getElementById('toggle-button');

menuIcon.addEventListener('click', () => {
  let fullScreenMenu = document.getElementById('fullscreen-menu');
  if (!menuExpanded) {
    
    let webviewContainerWidth = '250px';
    fullScreenMenu.style.width = `${webviewContainerWidth}`; // Set the width of fullScreenMenu to match the width of side-bar
    fullScreenMenu.classList.add('slide-in'); // CSS class for sliding animation

    let closeButton = document.getElementById('close-button');
    closeButton.onclick = function() {
      fullScreenMenu.style.width = '0'; // Hide full screen menu
      menuExpanded = false;
    };
    
    menuExpanded = true;
  } else {
    fullScreenMenu.style.width = '0'; // Hide full screen menu
    menuExpanded = false;
  }
});




// // Step 3: Make gear icon clickable
// menuIcon.addEventListener('click', function() {
//   // Step 4: Slide in full screen menu
//   let fullScreenMenu = document.getElementById('full-screen-menu');
//   fullScreenMenu.style.width = '100%'; // Assuming fullScreenMenu is initially hidden or has width 0
//   fullScreenMenu.classList.add('slide-in'); // CSS class for sliding animation

//   // Optional: Close button inside full-screen menu
//   let closeButton = document.createElement('button');
//   closeButton.textContent = 'Close';
//   closeButton.onclick = function() {
//     fullScreenMenu.style.width = '0'; // Hide full screen menu
//   };
//   fullScreenMenu.appendChild(closeButton);
// });

function collapseMenu() {
  if (!sidebarExpanded) return;

  let sideBar = document.getElementById('side-bar');
  let webviewContainer = document.getElementById('llm-container');
  sideBar.classList.remove('expanded');
  webviewContainer.style.width = 'calc(100% - 50px)'; // Adjust width for collapsed sidebar
  sidebarExpanded = false;

  let menuIcon = document.getElementById('toggle-button');
  menuIcon.innerHTML = '<img src="./assets/icon.png" class="collapsed-menu-logo-swiftllm">';

  // Show buttons with full names
  let options = document.querySelectorAll('.dropdown-section > div');
  setCollapsedMenuIcons(options);
  focusWebview(llmId);
}

/**
 * Set Collapsed Menu Icons 
 * Sets the LLM and other icons in the menu on the left hand side when collapsed
 * @param options: array menu options (strings - ['opt1', 'opt2', ...])
 */
function setCollapsedMenuIcons(options) {
  options.forEach(option => {
    let divId = option.id;
    let fullName = fullNames[divId];
    if (fullName.substring(0, 4) === 'Back') {
      option.textContent = '←'; // Replace 'Back' with left arrow symbol
    } else if (fullName === 'Forward') {
      option.textContent = '→'; // Replace 'Forward' with right arrow symbol
    } else if (fullName === 'Refresh') {
      option.textContent = '↻'; // Replace 'Refresh' with refresh symbol
    } else if (fullName === 'Home') {
      option.textContent = '⌂'; // Replace 'Home' with home symbol
    } else if (fullName === 'Open Link External') {
      option.textContent = '🔗';
    } else if (fullName === '+ Browser View') {
      if (!browserViewActive) {
        option.textContent = '+';
      } else {
        option.textContent = '-';
      }
    } else if (fullName === 'Copilot'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/copilot-logo-black-and-white.png" alt="copilot" id="copilot-logo" class="collapsed-menu-logo">'
    } else if (fullName === 'Perplexity AI'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/perplexity-logo-white.png" alt="perplexity" id="perplexity-logo" class="collapsed-menu-logo">'
    } else if (fullName === 'Gemini'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/gemini-logo-black-and-white.png" alt="gemini" id="gemini-logo" class="collapsed-menu-logo">'
    } else if (fullName === 'Claude'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/claude-logo-white.png" alt="claude" id="claude-logo" class="collapsed-menu-logo">'
    } else if (fullName === 'ChatGPT'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/chatgpt-logo-white.png" alt="chatgpt" id="chatgpt-logo" class="collapsed-menu-logo">'
    }  else if (fullName === 'Perplexity Labs'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/perplexity-labs-logo-white.png" alt="perplexity labs" id="perplexity-labs-logo" class="collapsed-menu-logo-long">'
    }  else if (fullName === 'Mistral'){
      var img = new Image(); 
      option.innerHTML = '<img src="./assets/ai-logos/mistral-logo-black-and-white.png" alt="mistral" id="mistral-logo" class="collapsed-menu-logo">'
    } else {
      option.textContent = fullName.charAt(0).toUpperCase(); // Show single letter for other names
    }
  });
}


let llmId = '';

function selectLLM(llmId) {
  llmId = llmId;
  // Update the dropdown to highlight the selected option
  let options = document.querySelectorAll('.llm-dropdown-section > div');
  options.forEach(option => {
    option.classList.remove('selected');
  });
  document.getElementById(`${llmId}-option`).classList.add('selected');

  // Get all webviews and hide them
  let webview_containers = document.querySelectorAll('#llm-container'); // Use '.' for class or '#' for id
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  webviews.forEach(webview => {
    webview.classList.remove('active');
    webview.classList.add('inactive');
    webview.style.display = 'none';
  });

  // Show the selected webview
  let selectedWebview = document.getElementById(llmId);
  if (selectedWebview) {
    selectedWebview.classList.add('active');
    selectedWebview.classList.remove('inactive');
    selectedWebview.style.display = 'flex';
  }

  config.state.selectedLLM = llmId;
  saveSettings(config);

  focusWebview(llmId);
}


function selectURL(url) {
  // Get all webviews and hide them
  let webview_containers = document.querySelectorAll('#browser-container'); // Use '.' for class or '#' for id
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  // Open the passed URL in the webview
  webviews.forEach(webview => {
    webview.src = url;
  });

  focusWebview('browser-webview');

  // pauseInactiveResumeActiveLLM();
}





function navigateBackLLM() {
  let activeWebview = document.querySelector('.llm-browser.active');
  if (activeWebview && activeWebview.canGoBack()) {
    activeWebview.goBack();
  }
  focusWebview(llmId);
}

function navigateForwardLLM() {
  let activeWebview = document.querySelector('.llm-browser.active');
  if (activeWebview && activeWebview.canGoForward()) {
    activeWebview.goForward();
  }
  focusWebview(llmId);
}

function refreshPageLLM() {
  let activeWebview = document.querySelector('.llm-browser.active');
  if (activeWebview) {
    activeWebview.reload();
  }
  focusWebview(llmId);
}

function navigateHomeLLM() {
  let activeWebview = document.querySelector('.llm-browser.active');
  let llmId = activeWebview.id;

  if (activeWebview) {
    activeWebview.src = config.baseUrls[llmId];
  }

  // Create a new webview instance
  let newWebview = document.createElement('webview');
  newWebview.id = llmId;
  newWebview.classList.add('llm-browser');
  newWebview.classList.add('active');
  newWebview.classList.remove('inactive');
  newWebview.src = config.baseUrls[llmId];
  newWebview.preload = path.join(__dirname, 'preload.js');

  // Replace the last webview instance
  let browserContainer = document.getElementById('llm-container');
  browserContainer.replaceChild(newWebview, activeWebview);

  focusWebview(llmId);
}

function navigateBackBrowser() {
  // Get all webviews and go back in history
  let webview_containers = document.querySelectorAll('#browser-container');
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  webviews.forEach(webview => {
    if (webview.canGoBack()) {
      webview.goBack();
    }
  });
  focusWebview('browser-webview');
}

function navigateForwardBrowser() {
  // Get all webviews and go forward in history
  let webview_containers = document.querySelectorAll('#browser-container');
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  webviews.forEach(webview => {
    if (webview.canGoForward()) {
      webview.goForward();
    }
  });
  focusWebview('browser-webview');
}

function refreshPageBrowser() {
  // Get all webviews and refresh them
  let webview_containers = document.querySelectorAll('#browser-container');
  let webviews = [];
  webview_containers.forEach((container) => {
    let webviews_in_container = container.querySelectorAll('webview');
    webviews = [...webviews, ...webviews_in_container];
  });

  webviews.forEach(webview => {
    webview.reload();
  });
  focusWebview('browser-webview');
}

function navigateHomeBrowser() {
  // Create a new webview instance
  let newWebview = document.createElement('webview');
  newWebview.id = 'browser-webview';
  newWebview.classList.add('web-browser');
  newWebview.src = config.baseUrls['browserHomeUrl'];
  newWebview.preload = path.join(__dirname, 'preload.js');

  // Replace the last webview instance
  let browserContainer = document.getElementById('browser-container');
  let oldWebview = browserContainer.querySelector('.web-browser');
  browserContainer.replaceChild(newWebview, oldWebview);

  // Focus the new webview
  focusWebview('browser-webview');
}



// function pauseInactiveLLMs() {
//   let webviews = document.querySelectorAll('.llm-browser.inactive');
//   webviews.forEach(webview => {
//     webview.pause();
//   });
// }

// function resumeActiveLLM() {
//   let webviews = document.querySelectorAll('.llm-browser.active');
//   webviews.forEach(webview => {
//     webview.resume();
//   });
// }

// function pauseInactiveResumeActiveLLM() {
//   pauseInactiveLLMs();
//   resumeActiveLLM();
// }


















// Event listeners to handle hover and mouse leave
let sideBar = document.getElementById('side-bar');
let menuContent = document.querySelector('.menu-content');

sideBar.addEventListener('mouseleave', (event) => {
  // Check if the cursor has left the sidebar and its contents
  if (!sideBar.contains(event.relatedTarget)) {
    collapseMenu();
  }
  focusWebview(llmId);
});
menuContent.addEventListener('mouseleave', (event) => {
  // Check if the cursor has left the sidebar and its contents
  if (!sideBar.contains(event.relatedTarget)) {
    collapseMenu();
  }
  focusWebview(llmId);
});



if (!sidebarExpanded) {
  if (!browserViewActive) {
    document.getElementById('browser-view-option').textContent = '+';
  } else {
    document.getElementById('browser-view-option').textContent = '+ Browser View';
  }
} else {
  if (!browserViewActive) {
    document.getElementById('browser-view-option').textContent = '+ Browser View';
  } else {
    document.getElementById('browser-view-option').textContent = '- Browser View';
  }
}
document.getElementById('browser-container').classList.remove('active');
document.getElementById('browser-container').classList.add('inactive');
document.getElementById('llm-container').style.flex = '1';
document.getElementById('browser-container').style.flex = '0';

function toggleBrowserView(only_show=false) {
  if (browserViewActive && only_show) return;

  if (only_show) {
    browserViewActive = true;
  } else {
    browserViewActive = !browserViewActive;
  }
  
  if (browserViewActive) {
    

    if (!sidebarExpanded) {
      document.getElementById('browser-view-option').textContent = '-';
    } else {
      document.getElementById('browser-view-option').textContent = '- Browser View';
    }
    // document.getElementById('browser-container').resume();
    document.getElementById('browser-container').classList.add('active');
    document.getElementById('browser-container').classList.remove('inactive');
    document.getElementById('llm-container').style.flex = '0.5';
    document.getElementById('browser-container').style.flex = '0.5';

    document.getElementById(`browser-view-option`).classList.add('selected');
  } else {
    if (!sidebarExpanded) {
      document.getElementById('browser-view-option').textContent = '+';
    } else {
      document.getElementById('browser-view-option').textContent = '+ Browser View';
    }
    // document.getElementById('browser-container').pause();
    document.getElementById('browser-container').classList.remove('active');
    document.getElementById('browser-container').classList.add('inactive');
    document.getElementById('llm-container').style.flex = '1';
    document.getElementById('browser-container').style.flex = '0';

    document.getElementById(`browser-view-option`).classList.remove('selected');
  }
}



let openLinkExternal = false;

function toggleOpenLinkExternal() {
  openLinkExternal = !openLinkExternal;

  if (openLinkExternal) {
    document.getElementById(`open-link-external`).classList.add('selected');
  } else {
    document.getElementById(`open-link-external`).classList.remove('selected');
  }
  focusWebview(llmId);
}

// Capture any ctrl + clicked link
ipcRenderer.on('open-url', (event, url) => {
  // if (url.contains('accounts.google.com')) {
  //   let urlParams = new URLSearchParams(url.split('?')[1]);
  //   let token = urlParams.get('token');
  // if (token) {
  //   // Use the token to authenticate with Claude AI
  //   authenticateWithClaude(token);
  // }
  // } else 
  if (openLinkExternal) {
    shell.openExternal(url);
  } else {
    let secondWebview = document.getElementById('browser-webview');
    secondWebview.loadURL(url);
    toggleBrowserView(true); // Toggle browser view open to show the link
  }
});


function focusWebview(llmId) {
  selectLLMTextarea(llmId);
}

function selectLLMTextarea() {
  let activeWebview = document.querySelector('.llm-browser.active');

  // if (activeWebview && activeWebview.id === 'gemini') {

  //   activeWebview.focus();

  //   // activeWebview.getElementsByClassName('textarea')[0].focus();

  //   activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
  //   activeWebview.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', shiftKey: false }));
  //   activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
  //   activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
  //   activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
  //   activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
    
  // } else if (activeWebview && activeWebview.id === 'claude') {
    
  //   activeWebview.focus();
    
  //   for (let i = 0; i < 12; i++) {
  //     activeWebview.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));
  //     activeWebview.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', shiftKey: false }));
  //   }
  // } else 
  if (activeWebview) {
    
    activeWebview.focus();
    
    let textarea = activeWebview.querySelector('textarea');
    
    if (textarea) {
      textarea.select();
    }
  }
}

window.addEventListener('focus', () => {
  focusWebview(llmId);
});





// let activeWebview = document.querySelector('.llm-browser.active');
// let secondWebview = document.getElementById('browser-webview');

// activeWebview.on('right-click', () => {
//   tray.popUpContextMenu(contextMenu);
// });

// secondWebview.on('right-click', () => {
//   tray.popUpContextMenu(contextMenu);
// });





// Currently failing, fix later
// function printError(error) {
//   // display the debug section and error
//   let debugElement = document.getElementById('debug');
//   debugElement.innerText = JSON.stringify(error.message);
//   // debugElement.style.display = 'flex';
// }


function printDebug(message) {
  // display the debug section and debug message
  let debugElement = document.getElementById('debug');
  if (typeof message === 'string') {
    debugElement.innerText = message;
  } else if (typeof message !== 'string') {
    debugElement.innerText = JSON.stringify(message);
  } else if (typeof message === 'number') {
    debugElement.innerText = String(message);
  } else if (typeof message === 'boolean') {
    debugElement.innerText = message ? 'true' : 'false';
  } else if (typeof message === 'object') {
    debugElement.innerText = JSON.stringify(message);
  } else if (typeof message === 'function') {
    debugElement.innerText = message.toString();
  } else if (typeof message === 'undefined') {
    debugElement.innerText = 'UNDEFINED';
  } else if (typeof message === 'symbol') {
    debugElement.innerText = message.toString();
  } else if (typeof message === 'bigint') {
    debugElement.innerText = message.toString();
  } else if (message instanceof Error) {
    debugElement.innerText = message.toString();
  }
  debugElement.style.display = 'flex';
}




// Function to load settings from the config file
function loadSettings() {
  try {
    let configData = null;
    if (os.platform() === 'darwin') {
      let userDataPath = path.join(os.homedir(), '.swiftllm');
      let configPath = path.join(userDataPath, 'config.json');

      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath);
      }
  
      configData = fs.readFileSync(configPath);
    } else {
      configData = fs.readFileSync(path.join(__dirname, '../../config.json'));
    }
    let loadedConfig = JSON.parse(configData);

    // Access the settings and populate the checkboxes
    let preventMenuExpansionCheckbox = document.getElementById('preventMenuExpansion');
    let enableAdblockerCheckbox = document.getElementById('enableAdblocker');
    let launchAtStartupCheckbox = document.getElementById('launchAtStartup');
    let setting4Checkbox = document.getElementById('setting4');

    // Initialize settings if they don't exist
    if (!loadedConfig.preventMenuExpansion) {
      loadedConfig.preventMenuExpansion = false;
    }
    if (!loadedConfig.enableAdblocker) {
      loadedConfig.enableAdblocker = false;
    }
    if (!loadedConfig.launchAtStartup) {
      loadedConfig.launchAtStartup = false;
    }
    if (!loadedConfig.setting4) {
      loadedConfig.setting4 = false;
    }
    if (!loadedConfig.state) {
      loadedConfig.state = {};
    }
    if (!loadedConfig.state.selectedLLM) {
      loadedConfig.state.selectedLLM = defaultLlm;
    }
    if (!loadedConfig.baseUrls) {
      loadedConfig.baseUrls = {};
    }
    for (let key in baseUrls) {
      if (!loadedConfig.baseUrls.hasOwnProperty(key)) {
        loadedConfig.baseUrls[key] = baseUrls[key];
      }
    }

    // Init loaded settings from config file
    if (preventMenuExpansionCheckbox) {
      preventMenuExpansionCheckbox.checked = loadedConfig.settings.hasOwnProperty('preventMenuExpansion') ? loadedConfig.settings.preventMenuExpansion : false;
    }
    if (enableAdblockerCheckbox) {
      enableAdblockerCheckbox.checked = loadedConfig.settings.hasOwnProperty('enableAdblocker') ? loadedConfig.settings.enableAdblocker : false;
    }
    if (launchAtStartupCheckbox) {
      launchAtStartupCheckbox.checked = loadedConfig.settings.hasOwnProperty('launchAtStartup') ? loadedConfig.settings.launchAtStartup : false;
    }
    if (setting4Checkbox) {
      setting4Checkbox.checked = loadedConfig.settings.hasOwnProperty('setting4') ? loadedConfig.settings.setting4 : false;
    }

    saveSettings(loadedConfig);

    return loadedConfig;
  } catch (error) {
    // printError(error);
    // If the config file doesn't exist, return an empty object
    var newConfig = {};
    // Initialize settings if they don't exist
    newConfig.settings = {
      preventMenuExpansion: false,
      enableAdblocker: false,
      launchAtStartup: false,
      setting4: false
    };
    newConfig.state = {
      selectedLLM: defaultLlm,
    };
    newConfig.baseUrls = baseUrls;
    saveSettings(newConfig);

    return newConfig;
  }
}

/**
 * Save Settings
 * applies the settings to the app and updates the configuration file
 * @param {} config - application's configuration
 */
function saveSettings(config) {
  let configDataStr = JSON.stringify(config);
  writeSettingsToFile(configDataStr);
}

function applySettings(settings){
  // Disable menu expand option
  let toggleButton = document.getElementById('toggle-button');
  if(settings.preventMenuExpansion) {
    toggleButton.removeEventListener('mouseover', expandMenu);
  } else {
    toggleButton.addEventListener('mouseover', expandMenu);
  }

  if (settings.enableAdblocker) {
    ipcRenderer.send('call-createAndUpdateaAblocker');
  } else {
    ipcRenderer.send('call-disableAdblocker');
  }

  if (settings.launchAtStartup) {
    ipcRenderer.send('call-enableLaunchAtStartup');
  } else {
    ipcRenderer.send('call-disableLaunchAtStartup');
  }
}

function writeSettingsToFile(configDataStr){
  if (os.platform() === 'darwin') {
    let userDataPath = path.join(os.homedir(), '.swiftllm');
    let configPath = path.join(userDataPath, 'config.json');

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath);
    }

    fs.writeFileSync(configPath, configDataStr);
  } else {
    fs.writeFileSync(path.join(__dirname, '../../config.json'), configDataStr);
  }
}


// Set default LLM to load on startup
document.addEventListener('DOMContentLoaded', () => {
  config = loadSettings();
  applySettings(config.settings);

  // Initialize the src for each llm-browser webview
  let webviews = document.querySelectorAll('.llm-browser');
  webviews.forEach((webview) => {
    webview.src = config.baseUrls[webview.id];
  });

  // Initialize the src for the web-browser webview
  let webview = document.querySelector('.web-browser');
  webview.src = config.baseUrls['browserHomeUrl'];

  selectLLM(config.state.selectedLLM);
  selectURL(config.browserHomeUrl);
  focusWebview(llmId);
});


function changeSetting(checked, setting) {
  // printDebug('Setting: ' + setting + ' changed to: ' + checked);
  config.settings[setting] = checked;
  saveSettings(config);
  applySettings(config.settings);
} 






