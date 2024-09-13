# SwiftLLM



## About
A Windows and MacOS app to show and hide an LLM chat bot window using only a key command, turning into a bit more. Designed to make using LLMs faster, more organized and easier overall.


#### Why does SwiftLLM exist?
I use LLMs, and I just LLMs A LOT. Because of this I (used to) have an entire browser I use just for LLM tabs and tabs I open from LLM search results. This approach works for me better, but still presents a few challenges that SwiftLLM helps with:
- Clicking the browser window, going to the LLM tab, creating a new conversation, clicking the prompt input textarea, then typing your query is cumbersome when done often.
    - SwiftLLM: As soon as you hit CTRL/CMD + Space you can immediately start typing your query into an LLM. CTRL/CMD + R reloads the page, starting a new conversation.
- Navigating back and forth between an LLM browser and another application can slow things down a lot, especially when an app window needs to be fullscreen/large
    - SwiftLLM: You can use CTRL/CMD + Space to show and hide the browser window for quick reference of an LLM response, and hide the window to go back to what you were doing quickly too.
- Constantly closing and managing excessive open tabs, especially when checking information sources
    - For example: I often perform queries on Perplexity and ctrl + click links to reference sources, which leaves me with a huge amount of tabs I have to constantly close
    - SwiftLLM: A side-by-side 'browser tab' is included that handles all ctrl + click opened links, with the ability to open links in an external browser when needed.
- Constantly switching between LLM tabs is a pain too, especially when managing excessive tabs.
    - SwiftLLM: Many LLM tabs are included in the UI, allowing quick switching from one to another.
- I don't like advertisements
    - SwiftLLM: You can prevent your eyes burning due to advertisements, by utilizing a built-in adblocker that autoupdates itself every hour. (NOTE: Includes Hagezi Pro which should cover all needs. If you add more blocklists, you may have stability issues when visiting certain websites.)
- I don't like the LLMs that are included, and I want one of the LLM tabs to load a web page that isn't an LLM
    - SwiftLLM: You can change the URLs of the included LLMs to any URL you want, LLM or not, using the config file.



### Features
- Use CTRL/CMD + Space to show / hide the LLM window
- Use CTRL/CMD + ALT/OPTION + L to 'lock' the toggle to show and hide the LLM window. Hit the key command again to reactivate it
- Using CTRL + Click on a link will split the window and create a single 'browser tab', with the LLM on the left side of the SwiftLLM window and the opened link on the right side
- Menu with options for choosing between various LLMs, with 6 custom options. All URLs can be changed via the config file
- Menu: option to open links in external browsers, like Chrome, when you CTRL + Click a link
- Menu: navigation controls for both the 'LLM section' and the 'browser tab'
- Menu: button to show and hide the 'browser tab' section

### Settings
- Prevent Menu Expansion: Does not expand the menu when hovering your mouse over it
- Enable Ad Blocker: Ad blocker with many block lists included. Should not affect most website functionality.
- Launch at OS Startup: Runs SwiftLLM when starting up your computer



## Setup Build Environment
#### NOTE: All scripts are compatible with both Ubuntu and MacOS, including Ubuntu on Windows Subsystem for Linux
- sudo bash setup_env.sh



## How to Build

#### This script will compile the app for your system, shut down the app if it is running, copy the app to an easy to run location for your OS and then run the app:
- ./bld_and_cp_wsl.sh [platform] [architecture] [windows_user_folder_name] 
- ./bld_and_cp_wsl.sh win x64 sellitus
- ./bld_and_cp_wsl.sh win arm sellitus
- ./bld_and_cp_wsl.sh mac x64
- ./bld_and_cp_wsl.sh mac arm

### If you want to update the packages npm uses, run the following command, then rebuild:
- ./update_packages_latest.sh

### Only create an OSX ARM / x64 .app file: 
- npm run package-mac-arm
- npm run package-mac-x64

### Only create a Windows ARM / x64 .exe file/folder: 
- npm run package-win-arm
- npm run package-win-x64



## Known Issues

- Some logins don't work properly. For example, you can't login to Claude by clicking the link to login with your Google account. (NOTE: You can still login to Claude with your Google account if you input your account's email manually)

- Some LLMs don't allow apps to auto-focus the textarea to input a query, so you may not be able to type your prompt before manually clicking the prompt textarea. (NOTE: A workaround is to click the textarea before you hide the SwiftLLM window. When you use the key command the textarea will still be focused, and you can start typing your query immediately.)
