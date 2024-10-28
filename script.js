
function getLanguageFromExtension(ext) {
    const languageMap = {
        '.js': 'javascript',
        '.py': 'python',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.ts': 'typescript',
        '.md': 'markdown',
        '.xml': 'xml',
        '.sql': 'sql',
        '.php': 'php',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.java': 'java',
        '.rb': 'ruby',
        '.yaml': 'yaml',
        '.yml': 'yaml'
    };
    return languageMap[ext.toLowerCase()] || 'plaintext';
}

const DEFAULT_FONT_SIZE = 12;
const DEFAULT_LINE_HEIGHT = 1.2;

document.getElementById('set-editor-settings').addEventListener('click', () => {
    const modal = document.getElementById('editor-settings-modal');
    const savedFontSize = localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE;
    const savedLineHeight = localStorage.getItem('lineHeight') || DEFAULT_LINE_HEIGHT;

    // Set the saved values in the modal inputs
    document.getElementById('font-size-select').value = savedFontSize;
    document.getElementById('line-height-select').value = savedLineHeight;

    modal.style.display = 'flex';
});

document.getElementById('cancel-editor-settings').addEventListener('click', () => {
    document.getElementById('editor-settings-modal').style.display = 'none';
});

document.getElementById('save-editor-settings').addEventListener('click', () => {
    const fontSize = document.getElementById('font-size-select').value;
    const lineHeight = document.getElementById('line-height-select').value;

    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('lineHeight', lineHeight);

    editor.updateOptions({ fontSize: parseInt(fontSize), lineHeight: parseFloat(lineHeight) });

    showToast('Editor settings saved successfully!');
    document.getElementById('editor-settings-modal').style.display = 'none';
});

// Close modal when clicking outside
document.getElementById('editor-settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'editor-settings-modal') {
        e.target.style.display = 'none';
    }
});

async function loadThemes() {
    const themesFilePath = path.join(__dirname, 'themes.css'); // Adjust the path based on your app structure
    const cssContent = fs.readFileSync(themesFilePath, 'utf8');
    
    // Use a regex to find theme names
    const themeRegex = /body\.(\w+)-theme\s*{([^}]*)}/g;
    let match;
    const themes = [];

    while ((match = themeRegex.exec(cssContent)) !== null) {
        const themeName = match[1];
        const themeVariables = match[2]
            .trim()
            .split(';')
            .map(line => line.split(':').map(item => item.trim()))
            .filter(item => item.length === 2)
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        themes.push({ name: themeName, variables: themeVariables });
    }
    const themeMenu = document.getElementById('theme-menu');

    themes.forEach(theme => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option menu-option';
        themeOption.id = `set-theme-${theme.name}`;
        themeOption.innerHTML = `${theme.name.charAt(0).toUpperCase() + theme.name.slice(1)} <span class="theme-check">&#10003;</span>`;
        
        themeOption.addEventListener('click', () => {
            // Set active class and apply theme
            document.body.classList.remove(...themes.map(t => `${t.name}-theme`));
            document.body.classList.add(`${theme.name}-theme`);
            localStorage.setItem('theme', theme.name);
            updateEditorTheme();
            
            // Update active theme option
            themes.forEach(t => {
                document.getElementById(`set-theme-${t.name}`).classList.remove('active');
            });
            themeOption.classList.add('active');
        });

        themeMenu.appendChild(themeOption);
        const savedTheme = localStorage.getItem('theme');
        // Set active class if it's the saved theme
        if (savedTheme === theme.name) {
            themeOption.classList.add('active');
            document.body.classList.add(`${theme.name}-theme`);
        }
    });
    return themes;
}

// Get app from electron remote
const app = electron.remote.app;

// Update the loader configuration
require.config({
    paths: {
        'vs': app.isPackaged
            ? path.join(process.resourcesPath, 'public/vs')
            : 'public/vs'
    }
});

function updateEditorTheme() {
    // Get computed styles from the body element
    const computedStyle = window.getComputedStyle(document.body);
    let themestyle = computedStyle.getPropertyValue('--themestyle').trim();

    // Create a custom theme based on current CSS variables
    monaco.editor.defineTheme('customTheme', {
        base: themestyle, // or 'vs' for light theme
        inherit: true,
        rules: [
            // You can add specific token rules here if needed
        ],
        colors: {
            'editor.background': computedStyle.getPropertyValue('--background-color').trim(),
            'editor.foreground': computedStyle.getPropertyValue('--text-color').trim(),
            'editorLineNumber.foreground': computedStyle.getPropertyValue('--muted-color').trim(),
            'editorLineNumber.activeForeground': computedStyle.getPropertyValue('--text-color').trim(),
            'editor.selectionBackground': computedStyle.getPropertyValue('--menu-hover').trim(),
            'editor.selectionHighlightBackground': computedStyle.getPropertyValue('--menu-hover').trim() + '50', // 50 for opacity
            'editor.lineHighlightBackground': computedStyle.getPropertyValue('--menu-hover').trim() + '30',
            'editor.lineHighlightBorder': computedStyle.getPropertyValue('--menu-hover').trim() + '00',
            'scrollbarSlider.background': computedStyle.getPropertyValue('--scrollbar1').trim(),
            'scrollbarSlider.hoverBackground': computedStyle.getPropertyValue('--scrollbarhover').trim(),
            'scrollbarSlider.activeBackground': computedStyle.getPropertyValue('--scrollbarhover').trim(),
            'minimap.background': computedStyle.getPropertyValue('--background-color').trim(),
            'minimap.selectionHighlight': computedStyle.getPropertyValue('--menu-hover').trim(),
        }
    });

    try {
        editor.updateOptions({
            fontSize: parseInt(savedFontSize),
            lineHeight: parseFloat(savedLineHeight)
        });
    } catch(error) {
        alert(error);
    }

    // Apply the theme to the editor
    monaco.editor.setTheme('customTheme');
}
const savedTheme = localStorage.getItem('theme');
const savedFontSize = localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE;
const savedLineHeight = localStorage.getItem('lineHeight') || DEFAULT_LINE_HEIGHT;
// Load theme from localStorage on startup
window.addEventListener('DOMContentLoaded', async () => {
    const sidebarVisible = localStorage.getItem('sidebarVisible');
    if (sidebarVisible === 'false') {
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('side-bar').style.display = 'none';
        document.getElementById('sidebar-tick').style.display = 'none'; // Hide tick for the sidebar
    } else {
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('side-bar').style.display = 'flex';
        document.getElementById('sidebar-tick').style.display = 'inline'; // Show tick for the sidebar
    }
    // Load themes dynamically
    try {
        const themes = await loadThemes();
    } catch (error) {
        alert(error);
    }
    
    const themeMenu = document.getElementById('theme-menu');

    themes.forEach(theme => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option menu-option';
        themeOption.id = `set-theme-${theme.name}`;
        themeOption.innerHTML = `${theme.name.charAt(0).toUpperCase() + theme.name.slice(1)} <span class="theme-check">&#10003;</span>`;
        
        themeOption.addEventListener('click', () => {
            document.body.classList.remove(...themes.map(t => `${t.name}-theme`));
            document.body.classList.add(`${theme.name}-theme`);
            localStorage.setItem('theme', theme.name);
            updateEditorTheme();
            
            // Update active theme option
            themes.forEach(t => {
                document.getElementById(`set-theme-${t.name}`).classList.remove('active');
            });
            themeOption.classList.add('active');
        });
        
        themeMenu.appendChild(themeOption);
        
        // Set active class if it's the saved theme
        if (savedTheme === theme.name) {
            themeOption.classList.add('active');
            document.body.classList.add(`${theme.name}-theme`);
        }
    });
    
    // Load the default theme if none is saved
    if (!savedTheme) {
        document.body.classList.add('dark-theme'); // Default to dark if no theme set
    }

    // Update the editor theme for the first load
    updateEditorTheme();
});



// Add this at the top level, before require.config
let currentSearchController = null;

require(['vs/editor/editor.main'], function () {
    // Add these variable declarations at the top
    let completionTimeout = null;
    let inlineDecoration = [];
    let isCompletionActive = false;

    // Show spinner during initialization
    showSpinner('Initializing editor...');

    let tabs = [];
    let activeTab = null;
    let currentPath = process.cwd();
    let folderWatcher = null;
    let lastFolderContents = new Set();

    // Use the globally stored modules
    const fs = window.electronFS;
    const path = window.electronPath;
    const remote = window.electronRemote;

    // Add IPC listener here, after variables are defined
    electron.ipcRenderer.on('open-file', (event, filePath) => {
        if (filePath) {
            openFile(filePath);
        }
    });

    // Add keyboard shortcut handling here
    document.addEventListener('keydown', async (e) => {
        const ctrlPressed = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;
        if (ctrlPressed && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            document.getElementById('search-icon').click();
            document.getElementById('search-input').focus();
        }
        if (ctrlPressed) {
            switch (e.key.toLowerCase()) {
                case 'o':
                    e.preventDefault();
                    const result = await remote.dialog.showOpenDialog({
                        properties: ['openFile'],
                        filters: [{ name: 'All Files', extensions: ['*'] }]
                    });

                    if (!result.canceled && result.filePaths.length > 0) {
                        openFile(result.filePaths[0]);
                    }
                    break;

                case 's':
                    e.preventDefault();
                    if (activeTab) {
                        if (activeTab.path === 'untitled') {
                            const result = await remote.dialog.showSaveDialog({
                                defaultPath: currentPath,
                                filters: [{ name: 'All Files', extensions: ['*'] }]
                            });

                            if (!result.canceled && result.filePath) {
                                const content = editor.getValue();
                                fs.writeFileSync(result.filePath, content, 'utf-8');
                                activeTab.path = result.filePath;
                                activeTab.saved = true;
                                const language = getLanguageFromExtension(path.extname(result.filePath));
                                activeTab.language = language;
                                activeTab.model.dispose();
                                activeTab.model = monaco.editor.createModel(content, language);
                                editor.setModel(activeTab.model);
                                renderTabs();
                                saveState();
                                showToast('File saved successfully!');
                            }
                        } else {
                            const content = editor.getValue();
                            fs.writeFileSync(activeTab.path, content, 'utf-8');
                            activeTab.saved = true;
                            renderTabs();
                            saveState();
                            showToast('File saved successfully!');
                        }
                    }
                    break;
            }
        }
    });

    // First define the triggerCompletion function
    async function triggerCompletion(editor) {
        const model = editor.getModel();
        const position = editor.getPosition();

        if (!model || !position) return;

        const apiKey = localStorage.getItem('codeCompletionApiKey');
        if (!apiKey) {
            showToast('Please set your API key first');
            return;
        }

        // Set flag to prevent new completions
        isCompletionActive = true;

        try {
            // Get context based on last 9000 characters
            const maxChars = 9000;
            const fullText = model.getValue();
            const cursorOffset = model.getOffsetAt(position);

            // Get the last 9000 characters before cursor
            const startOffset = Math.max(0, cursorOffset - maxChars);
            const context = fullText.substring(startOffset, cursorOffset);

            const response = await fetch('http://88.99.145.13:8002/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-instruct',
                    prompt: context,
                    max_tokens: 100,
                    temperature: 0.3,
                    stop: ['\n\n']
                })
            });

            if (!response.ok) {
                console.error('Completion API error:', await response.text());
                isCompletionActive = false;
                return;
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0]) {
                isCompletionActive = false;
                return;
            }

            const completion = data.choices[0].text;
            const completionLines = completion.split('\n');

            // Filter out empty lines and prepare completion
            const finalCompletion = completionLines
                .filter(line => line.trim() !== '')
                .join('\n');

            // If no valid completion, don't insert anything
            if (!finalCompletion) {
                isCompletionActive = false;
                return;
            }

            // Calculate the range for insertion at current position
            const completionRange = {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            };

            // Add the completion text with only a newline after
            editor.executeEdits('completion', [{
                range: completionRange,
                text: finalCompletion + '\n',
                forceMoveMarkers: true
            }]);

            // Calculate number of lines inserted
            const insertedLines = finalCompletion.split('\n').length;

            // Update the range for decoration
            const decorationRange = {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber + insertedLines - 1,
                endColumn: model.getLineMaxColumn(position.lineNumber + insertedLines - 1)
            };

            // Apply grey styling to the inserted completion
            inlineDecoration = editor.deltaDecorations([], [{
                range: decorationRange,
                options: {
                    className: 'inline-suggestion',
                    inlineClassName: 'inline-suggestion',
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                }
            }]);

            // Add event listener for Tab key to accept suggestion
            const handler = editor.onKeyDown((e) => {
                if (e.keyCode === monaco.KeyCode.Tab) {
                    e.preventDefault();

                    // Remove the decoration to make text normal color
                    editor.deltaDecorations(inlineDecoration, []);

                    // Only move cursor to end of completion when Tab is pressed
                    editor.setPosition({
                        lineNumber: decorationRange.endLineNumber,
                        column: decorationRange.endColumn
                    });

                    // Reset completion flag
                    isCompletionActive = false;
                    handler.dispose();
                } else if (e.keyCode !== monaco.KeyCode.Tab) {
                    // If any other key is pressed, remove the entire completion
                    const currentLineContent = model.getLineContent(position.lineNumber);
                    const textBeforeCursor = currentLineContent.substring(0, position.column - 1);

                    editor.executeEdits('completion', [{
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber + insertedLines - 1,
                            endColumn: model.getLineMaxColumn(position.lineNumber + insertedLines - 1)
                        },
                        text: textBeforeCursor
                    }]);
                    editor.deltaDecorations(inlineDecoration, []);

                    // Keep cursor at original position
                    editor.setPosition(position);

                    // Reset completion flag
                    isCompletionActive = false;
                    handler.dispose();
                }
            });

        } catch (error) {
            console.error('Error fetching completions:', error);
            isCompletionActive = false;
        }
    }

    // Update the editor creation with correct keybinding format
    window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: '// Welcome to CablyCode\n',
        language: 'javascript',
        theme: 'vs',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 12,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: true,
        readOnly: false,
        cursorStyle: 'line',
        renderLineHighlight: 'all',
        scrollbar: {
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 11,
            horizontalScrollbarSize: 11
        },
        quickSuggestions: true,
        suggestOnTriggerCharacters: false
    });
    updateEditorTheme();
    var minimapVisible = localStorage.getItem('minimapVisible') || true;
    if (minimapVisible == "false") {
        minimapVisible = false;
    }
    minimapVisible = !minimapVisible;
    function toggleMinimap() {
        minimapVisible = !minimapVisible;
        localStorage.setItem('minimapVisible', minimapVisible);
        if (minimapVisible) {
            editor.updateOptions({ minimap: { enabled: true } });
            document.getElementById('minimap-tick').style.display = 'inline';
        } else {
            editor.updateOptions({ minimap: { enabled: false } });
            document.getElementById('minimap-tick').style.display = 'none';
        }
    }
    toggleMinimap();
    document.getElementById('toggle-minimap').addEventListener('click', toggleMinimap);
    editor.addAction({
        id: 'ai-completion',
        label: 'AI Complete',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: 'ai',  // Custom group for AI features
        contextMenuOrder: 1,
        run: triggerCompletion
    });

    // Remove these separator actions as they're no longer needed
    // editor.addAction({
    //     id: 'ai-separator-before',
    //     label: '',
    //     contextMenuGroupId: '9_cutcopypaste',
    //     contextMenuOrder: 6.9,
    //     run: () => {}
    // });
    //
    // editor.addAction({
    //     id: 'ai-separator-after',
    //     label: '',
    //     contextMenuGroupId: '9_cutcopypaste',
    //     contextMenuOrder: 7.1,
    //     run: () => {}
    // });

    // Add command to Monaco's command registry
    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        triggerCompletion,
        'ai-completion'
    );

    // Remove the old auto-completion timeout code
    editor.onDidChangeModelContent((e) => {
        // Only handle non-completion related content changes
        if (isCompletionActive) return;

        // No need for completion timeout anymore
        if (completionTimeout) {
            clearTimeout(completionTimeout);
            completionTimeout = null;
        }
    });

    // First, define ALL functions
    function createTab(filePath, content, language) {
        const tab = {
            id: Date.now(),
            path: filePath,
            content: content,
            language: language,
            model: monaco.editor.createModel(content, language),
            saved: true
        };
        tabs.push(tab);
        renderTabs();
        activateTab(tab);
        updateFilePathBar(filePath);
        saveState();
        updateChatFileList();  // Update chat file list when creating tab

        // Check content immediately after loading
        if (filePath !== 'untitled') {
            checkFileContent(tab);
        }
    }
    window.createTab = createTab;

    function activateTab(tab) {
        activeTab = tab;
        editor.setModel(tab.model);
        renderTabs();
        updateFilePathBar(tab.path);
        saveState();
    }
    window.activateTab = activateTab;

    // Update the closeTab function to be async
    async function closeTab(tabId) {
        const index = tabs.findIndex(t => t.id === tabId);
        if (index !== -1) {
            const tab = tabs[index];

            // Check if there are unsaved changes
            const currentContent = tab.model.getValue();
            let originalContent = '';
            let fileExists = true;

            try {
                if (tab.path !== 'untitled') {
                    if (fs.existsSync(tab.path)) {
                        originalContent = fs.readFileSync(tab.path, 'utf-8');
                    } else {
                        fileExists = false;
                        showToast(`File "${path.basename(tab.path)}" no longer exists`, 5000);
                    }
                }
            } catch (error) {
                console.error('Error reading file:', error);
                fileExists = false;
            }

            // If file doesn't exist, just close the tab without prompting
            if (!fileExists) {
                tab.model.dispose();
                tabs.splice(index, 1);

                if (activeTab && activeTab.id === tabId) {
                    if (tabs.length > 0) {
                        activateTab(tabs[index - 1] || tabs[0]);
                    } else {
                        editor.setModel(monaco.editor.createModel('', 'plaintext'));
                        activeTab = null;
                    }
                }
                renderTabs();
                saveState();
                updateChatFileList();
                return;
            }

            if (currentContent !== originalContent && !tab.saved) {
                const choice = await remote.dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Save', "Don't Save", 'Cancel'],
                    title: 'Unsaved Changes',
                    message: `Do you want to save the changes to ${path.basename(tab.path)}?`
                });

                if (choice.response === 0) { // Save
                    // If it's an untitled file, show Save As dialog
                    if (tab.path === 'untitled') {
                        const result = await remote.dialog.showSaveDialog({
                            defaultPath: currentPath,
                            filters: [{ name: 'All Files', extensions: ['*'] }]
                        });

                        if (!result.canceled && result.filePath) {
                            fs.writeFileSync(result.filePath, currentContent, 'utf-8');
                            showToast('File saved successfully!');
                        } else {
                            return; // Cancel the close operation
                        }
                    } else {
                        fs.writeFileSync(tab.path, currentContent, 'utf-8');
                        showToast('File saved successfully!');
                    }
                } else if (choice.response === 2) { // Cancel
                    return; // Cancel the close operation
                }
            }

            tab.model.dispose();
            tabs.splice(index, 1);

            if (activeTab && activeTab.id === tabId) {
                if (tabs.length > 0) {
                    activateTab(tabs[index - 1] || tabs[0]);
                } else {
                    editor.setModel(monaco.editor.createModel('', 'plaintext'));
                    activeTab = null;
                }
            }
            renderTabs();
            saveState();
            updateChatFileList();
        }

        if (tabs.length === 0) {
            updateFilePathBar(null);
        }
    }

    function renderTabs() {
        const container = document.getElementById('tabs-container');
        container.innerHTML = '';

        tabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = `tab ${activeTab && activeTab.id === tab.id ? 'active' : ''}`;

            const titleElement = document.createElement('div');
            titleElement.className = 'tab-title';
            titleElement.textContent = `${path.basename(tab.path)}${!tab.saved ? ' *' : ''}`;

            const closeButton = document.createElement('div');
            closeButton.className = 'tab-close';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = async (e) => {
                e.stopPropagation();
                await closeTab(tab.id);
            };

            tabElement.appendChild(titleElement);
            tabElement.appendChild(closeButton);
            tabElement.onclick = () => activateTab(tab);

            // Add context menu handler
            tabElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showTabContextMenu(e, tab);
            });

            container.appendChild(tabElement);
        });
    }

    function openFile(filePath) {
        return new Promise((resolve, reject) => {
            showSpinner('Loading file...');

            try {
                // Synchronously check if file exists
                if (!fs.existsSync(filePath)) {
                    hideSpinner();
                    showToast(`File "${path.basename(filePath)}" does not exist`, 5000);
                    reject(new Error('File does not exist'));
                    return;
                }

                // Synchronously read file content
                const content = fs.readFileSync(filePath, 'utf-8');
                const language = getLanguageFromExtension(path.extname(filePath));

                // Check if file is already open
                const existingTab = tabs.find(t => t.path === filePath);
                if (existingTab) {
                    activateTab(existingTab);
                    hideSpinner();
                    resolve();
                    return;
                }

                // Create new tab
                createTab(filePath, content, language);
                saveState();
                hideSpinner();
                resolve();

            } catch (error) {
                console.error('Error opening file:', error);
                showToast(`Error opening file: ${error.message}`, 5000);
                hideSpinner();
                reject(error);
            }
        });
    }

    function showExplorerContextMenu(e, itemPath, isDirectory) {
        e.preventDefault();

        const contextMenu = document.getElementById('context-menu');
        contextMenu.innerHTML = '';

        if (isDirectory) {
            contextMenu.innerHTML = `
                        <div class="context-menu-option" data-action="newFile" data-path="${itemPath}">New File</div>
                        <div class="context-menu-option" data-action="newFolder" data-path="${itemPath}">New Folder</div>
                        <div class="context-menu-separator"></div>
                        <div class="context-menu-option" data-action="rename" data-path="${itemPath}">Rename</div>
                        <div class="context-menu-option" data-action="delete" data-path="${itemPath}">Delete</div>
                    `;
        } else {
            contextMenu.innerHTML = `
                        <div class="context-menu-option" data-action="open" data-path="${itemPath}">Open</div>
                        <div class="context-menu-separator"></div>
                        <div class="context-menu-option" data-action="rename" data-path="${itemPath}">Rename</div>
                        <div class="context-menu-option" data-action="delete" data-path="${itemPath}">Delete</div>
                    `;
        }

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;

        // Ensure menu stays within window bounds
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${window.innerHeight - rect.height}px`;
        }
    }

    function saveCurrentDirectory(dirPath) {
        localStorage.setItem('lastDirectory', dirPath);
    }

    // Update loadDirectory function to ensure we save the directory
    function loadDirectory(dirPath) {
        showSpinner('Loading folder contents...');

        setTimeout(() => {
            try {
                if (!fs.existsSync(dirPath)) {
                    hideSpinner();
                    showToast(`Directory "${dirPath}" does not exist`, 5000);

                    // Show folder select dialog if directory doesn't exist
                    remote.dialog.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Select Folder'
                    }).then(result => {
                        if (!result.canceled && result.filePaths.length > 0) {
                            loadDirectory(result.filePaths[0]);
                        }
                    });
                    return;
                }

                // Save the directory AFTER confirming it exists
                currentPath = dirPath;
                saveCurrentDirectory(dirPath);  // This saves to localStorage

                const fileExplorer = document.getElementById('file-explorer');
                fileExplorer.innerHTML = '';

                // Show current path
                const pathElement = document.createElement('div');
                pathElement.style.padding = '5px';
                pathElement.style.fontSize = '11px';
                pathElement.style.color = '#666';
                pathElement.textContent = dirPath;
                fileExplorer.appendChild(pathElement);

                // Add "Go Back" option if not at root drive
                if (dirPath.toLowerCase() !== 'c:/') {
                    const backElement = document.createElement('div');
                    backElement.className = 'folder-item';
                    backElement.textContent = '..';
                    backElement.onclick = () => {
                        const parentPath = path.dirname(dirPath);
                        if (parentPath.match(/^[A-Z]:\\$/i)) {
                            loadDirectory('C:/');
                        } else {
                            loadDirectory(parentPath);
                        }
                    };
                    fileExplorer.appendChild(backElement);
                }

                const items = fs.readdirSync(dirPath);
                items.sort((a, b) => {
                    try {
                        const aStats = fs.statSync(path.join(dirPath, a));
                        const bStats = fs.statSync(path.join(dirPath, b));
                        if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
                        if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
                        return a.localeCompare(b);
                    } catch (error) {
                        return 0;
                    }
                });

                items.forEach(item => {
                    try {
                        if (item.startsWith('.')) return;

                        const itemPath = path.join(dirPath, item);
                        if (!fs.existsSync(itemPath)) return;

                        const stats = fs.statSync(itemPath);
                        const element = document.createElement('div');

                        if (stats.isDirectory()) {
                            element.className = 'folder-item';
                            element.onclick = () => loadDirectory(itemPath);
                        } else {
                            element.className = 'file-item';
                            element.onclick = () => openFile(itemPath);
                        }

                        element.textContent = item;
                        element.dataset.path = itemPath;

                        element.addEventListener('contextmenu', (e) => {
                            showExplorerContextMenu(e, itemPath, stats.isDirectory());
                        });

                        element.addEventListener('dblclick', (e) => {
                            e.stopPropagation();
                            startRename(element, itemPath);
                        });

                        fileExplorer.appendChild(element);
                    } catch (error) {
                        console.error(`Error processing item ${item}:`, error);
                    }
                });

                hideSpinner();
            } catch (error) {
                console.error('Error loading directory:', error);
                hideSpinner();
                showToast(`Error loading directory: ${error.message}`, 5000);

                // Show folder select dialog on error
                remote.dialog.showOpenDialog({
                    properties: ['openDirectory'],
                    title: 'Select Folder'
                }).then(result => {
                    if (!result.canceled && result.filePaths.length > 0) {
                        loadDirectory(result.filePaths[0]);
                    }
                });
            }
        }, 100);

        // After successfully loading the directory, update the watcher
        if (folderWatcher) {
            clearInterval(folderWatcher);
        }

        lastFolderContents = getFolderContents(dirPath);
        folderWatcher = setInterval(() => compareFolderContents(dirPath), 1000);
    }

    function showSpinner(message = 'Loading...') {
        const overlay = document.querySelector('.spinner-overlay');
        const messageEl = document.querySelector('.spinner-message');
        messageEl.textContent = message;
        overlay.style.display = 'flex';
    }

    function hideSpinner() {
        const overlay = document.querySelector('.spinner-overlay');
        overlay.style.display = 'none';
    }

    function updateFilePathBar(filePath) {
        const pathBar = document.getElementById('file-path-bar');
        if (filePath && filePath !== 'untitled') {
            pathBar.textContent = filePath;
            pathBar.style.display = 'flex';
        } else {
            pathBar.textContent = '';
            pathBar.style.display = 'none';
        }
    }

    function showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }

    function getFolderContents(dirPath) {
        try {
            return new Set(fs.readdirSync(dirPath));
        } catch (error) {
            console.error('Error reading directory:', error);
            return new Set();
        }
    }

    function compareFolderContents(dirPath) {
        const currentContents = getFolderContents(dirPath);
        const previousContents = lastFolderContents;

        // Find new items
        const newItems = [...currentContents].filter(x => !previousContents.has(x));
        // Find removed items
        const removedItems = [...previousContents].filter(x => !currentContents.has(x));

        if (newItems.length > 0) {
            console.log('New files/folders detected:', newItems);
            loadDirectory(dirPath); // Refresh the file explorer
        }
        if (removedItems.length > 0) {
            console.log('Files/folders removed:', removedItems);
            loadDirectory(dirPath); // Refresh the file explorer
        }

        lastFolderContents = currentContents;
    }

    function checkFileContent(tab) {
        if (!tab || tab.path === 'untitled') return;

        try {
            if (!fs.existsSync(tab.path)) {
                console.log(`File no longer exists: ${tab.path}`);
                return;
            }

            const diskContent = fs.readFileSync(tab.path, 'utf-8');
            const editorContent = tab.model.getValue();

            if (diskContent !== editorContent) {
                console.log('File not saved:', path.basename(tab.path));
                if (tab.saved) {
                    tab.saved = false;
                    renderTabs(); // Update the tab display
                }
                return false;
            } else if (!tab.saved) {
                tab.saved = true;
                renderTabs(); // Update the tab display
            }
            return true;
        } catch (error) {
            console.error('Error checking file content:', error);
            return false;
        }
    }

    // Add window event listeners
    window.addEventListener('beforeunload', () => {
        if (folderWatcher) {
            clearInterval(folderWatcher);
        }
        saveState();
    });

    // Add periodic content checking
    setInterval(() => {
        tabs.forEach(tab => {
            checkFileContent(tab);
        });
    }, 1000);

    // THEN, add all event handlers

    // Update the Exit menu option handler
    document.querySelectorAll('.menu-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            const action = e.target.textContent;
            switch (action) {
                case 'New Window':
                    remote.app.emit('create-new-window');
                    break;

                case 'New File':
                    createTab('untitled', '', 'plaintext');
                    break;

                case 'Open File...':
                    const result = await remote.dialog.showOpenDialog({
                        properties: ['openFile']
                    });
                    if (!result.canceled && result.filePaths.length > 0) {
                        openFile(result.filePaths[0]);
                    }
                    break;

                case 'Open Folder...':
                    const folderResult = await remote.dialog.showOpenDialog({
                        properties: ['openDirectory']
                    });
                    if (!folderResult.canceled && folderResult.filePaths.length > 0) {
                        loadDirectory(folderResult.filePaths[0]);
                    }
                    break;

                case 'Save':
                    if (activeTab) {
                        if (activeTab.path === 'untitled') {
                            const saveResult = await remote.dialog.showSaveDialog({
                                defaultPath: currentPath,
                                filters: [{ name: 'All Files', extensions: ['*'] }]
                            });

                            if (!saveResult.canceled && saveResult.filePath) {
                                const content = editor.getValue();
                                fs.writeFileSync(saveResult.filePath, content, 'utf-8');
                                activeTab.path = saveResult.filePath;
                                activeTab.saved = true;
                                const language = getLanguageFromExtension(path.extname(saveResult.filePath));
                                activeTab.language = language;
                                activeTab.model.dispose();
                                activeTab.model = monaco.editor.createModel(content, language);
                                editor.setModel(activeTab.model);
                                renderTabs();
                                updateFilePathBar(saveResult.filePath);
                                saveState();
                                showToast('File saved successfully!');
                            }
                        } else {
                            const content = editor.getValue();
                            fs.writeFileSync(activeTab.path, content, 'utf-8');
                            activeTab.saved = true;
                            renderTabs();
                            saveState();
                            showToast('File saved successfully!');
                        }
                    }
                    break;

                case 'Save As...':
                    if (activeTab) {
                        const saveAsResult = await remote.dialog.showSaveDialog({
                            defaultPath: currentPath,
                            filters: [{ name: 'All Files', extensions: ['*'] }]
                        });

                        if (!saveAsResult.canceled && saveAsResult.filePath) {
                            const content = editor.getValue();
                            fs.writeFileSync(saveAsResult.filePath, content, 'utf-8');
                            activeTab.path = saveAsResult.filePath;
                            activeTab.saved = true;
                            const language = getLanguageFromExtension(path.extname(saveAsResult.filePath));
                            activeTab.language = language;
                            activeTab.model.dispose();
                            activeTab.model = monaco.editor.createModel(content, language);
                            editor.setModel(activeTab.model);
                            renderTabs();
                            updateFilePathBar(saveAsResult.filePath);
                            saveState();
                            showToast('File saved successfully!');
                        }
                    }
                    break;

                case 'Exit':
                    const window = remote.getCurrentWindow();

                    // Check for unsaved changes before closing
                    const unsavedTabs = tabs.filter(tab => !tab.saved);
                    if (unsavedTabs.length > 0) {
                        const choice = await remote.dialog.showMessageBox({
                            type: 'question',
                            buttons: ['Save All', "Don't Save", 'Cancel'],
                            title: 'Unsaved Changes',
                            message: `You have ${unsavedTabs.length} unsaved file(s). Do you want to save them before closing?`
                        });

                        if (choice.response === 0) { // Save All
                            for (const tab of unsavedTabs) {
                                if (tab.path === 'untitled') {
                                    const result = await remote.dialog.showSaveDialog({
                                        defaultPath: currentPath,
                                        filters: [{ name: 'All Files', extensions: ['*'] }]
                                    });

                                    if (!result.canceled && result.filePath) {
                                        fs.writeFileSync(result.filePath, tab.model.getValue(), 'utf-8');
                                    } else {
                                        return; // Cancel the close operation if user cancels save
                                    }
                                } else {
                                    fs.writeFileSync(tab.path, tab.model.getValue(), 'utf-8');
                                }
                            }
                        } else if (choice.response === 2) { // Cancel
                            return;
                        }
                    }

                    // Clean up and force quit
                    if (folderWatcher) {
                        clearInterval(folderWatcher);
                    }
                    remote.app.quit();
                    break;
            }
        });
    });

    // Add context menu handlers
    document.getElementById('context-menu').addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const itemPath = e.target.dataset.path;

        if (!action || !itemPath) return;

        switch (action) {
            case 'open':
                openFile(itemPath);
                break;

            case 'newFile':
                const fileResult = await remote.dialog.showSaveDialog({
                    title: 'New File',
                    defaultPath: path.join(itemPath, 'untitled.txt'),
                    properties: ['showOverwriteConfirmation']
                });
                if (!fileResult.canceled && fileResult.filePath) {
                    fs.writeFileSync(fileResult.filePath, '');
                    loadDirectory(currentPath);
                }
                break;

            case 'newFolder':
                const folderName = await remote.dialog.showMessageBox({
                    title: 'New Folder',
                    message: 'Enter folder name:',
                    buttons: ['OK', 'Cancel'],
                    defaultId: 0,
                    cancelId: 1,
                    prompt: true,
                    inputValue: 'New Folder'
                });
                if (folderName.response === 0 && folderName.input) {
                    const newFolderPath = path.join(itemPath, folderName.input);
                    fs.mkdirSync(newFolderPath);
                    loadDirectory(currentPath);
                }
                break;

            case 'rename':
                const element = Array.from(document.querySelectorAll('.file-item, .folder-item'))
                    .find(el => el.dataset.path === itemPath);
                if (element) {
                    startRename(element, itemPath);
                }
                break;

            case 'delete':
                const choice = await remote.dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'Confirm',
                    message: `Are you sure you want to delete ${path.basename(itemPath)}?`
                });
                if (choice.response === 0) {
                    try {
                        if (fs.statSync(itemPath).isDirectory()) {
                            fs.rmdirSync(itemPath, { recursive: true });
                        } else {
                            fs.unlinkSync(itemPath);
                        }
                        loadDirectory(currentPath);
                    } catch (error) {
                        showToast(`Error deleting: ${error.message}`, 5000);
                    }
                }
                break;
        }

        document.getElementById('context-menu').style.display = 'none';
    });

    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#context-menu')) {
            document.getElementById('context-menu').style.display = 'none';
        }
    });

    // Update the window control handlers
    document.getElementById('minimize-button').addEventListener('click', () => {
        const window = remote.getCurrentWindow();
        window.minimize();
    });

    document.getElementById('maximize-button').addEventListener('click', () => {
        const window = remote.getCurrentWindow();
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });

    document.getElementById('close-button').addEventListener('click', async () => {
        const window = remote.getCurrentWindow();

        // Check for unsaved changes before closing
        const unsavedTabs = tabs.filter(tab => !tab.saved);
        if (unsavedTabs.length > 0) {
            const choice = await remote.dialog.showMessageBox({
                type: 'question',
                buttons: ['Save All', "Don't Save", 'Cancel'],
                title: 'Unsaved Changes',
                message: `You have ${unsavedTabs.length} unsaved file(s). Do you want to save them before closing?`
            });

            if (choice.response === 0) { // Save All
                for (const tab of unsavedTabs) {
                    if (tab.path === 'untitled') {
                        const result = await remote.dialog.showSaveDialog({
                            defaultPath: currentPath,
                            filters: [{ name: 'All Files', extensions: ['*'] }]
                        });

                        if (!result.canceled && result.filePath) {
                            fs.writeFileSync(result.filePath, tab.model.getValue(), 'utf-8');
                        } else {
                            return; // Cancel the close operation if user cancels save
                        }
                    } else {
                        fs.writeFileSync(tab.path, tab.model.getValue(), 'utf-8');
                    }
                }
            } else if (choice.response === 2) { // Cancel
                return;
            }
        }

        // Clean up and force quit
        if (folderWatcher) {
            clearInterval(folderWatcher);
        }
        remote.app.quit();
    });

    // Add this function after the editor creation and before other functions
    function saveState() {
        const state = tabs.map(tab => ({
            path: tab.path,
            content: tab.model.getValue(),
            language: tab.language,
            saved: tab.saved
        }));

        localStorage.setItem('editorState', JSON.stringify({
            tabs: state,
            activeTabId: activeTab ? activeTab.id : null
        }));
    }

    function loadState() {
        try {
            const savedState = localStorage.getItem('editorState');
            if (savedState) {
                const state = JSON.parse(savedState);

                // Clear any existing tabs first
                tabs.forEach(tab => tab.model.dispose());
                tabs = [];

                // Restore tabs, checking for duplicates
                const openPaths = new Set();
                state.tabs.forEach(tabState => {
                    // Skip if we already have this file open
                    if (openPaths.has(tabState.path)) return;

                    // For non-untitled files, read current content from disk
                    if (tabState.path !== 'untitled' && fs.existsSync(tabState.path)) {
                        try {
                            const diskContent = fs.readFileSync(tabState.path, 'utf-8');
                            // Use disk content and compare with saved content
                            createTab(tabState.path, diskContent, tabState.language);
                            openPaths.add(tabState.path);

                            if (tabs.length > 0) {
                                const lastTab = tabs[tabs.length - 1];
                                // Compare current content with disk content
                                lastTab.saved = (diskContent === tabState.content);
                            }
                        } catch (error) {
                            console.error('Error reading file:', error);
                        }
                    } else {
                        // For untitled files or non-existent files, use saved content
                        createTab(tabState.path, tabState.content, tabState.language);
                        openPaths.add(tabState.path);

                        if (tabs.length > 0) {
                            const lastTab = tabs[tabs.length - 1];
                            lastTab.saved = tabState.saved;
                        }
                    }
                });

                // Restore active tab
                if (state.activeTabId && tabs.length > 0) {
                    const tabToActivate = tabs[0]; // Just activate the first tab since IDs will be different
                    activateTab(tabToActivate);
                }
            }
        } catch (error) {
            console.error('Error loading editor state:', error);
        }
    }

    // Update the editor change handler
    editor.getModel()?.onDidChangeContent((event) => {
        if (activeTab) {
            console.log(`File changed: ${path.basename(activeTab.path)}`);
            console.log('Change event:', event);
            if (activeTab.saved) {
                activeTab.saved = false;
                renderTabs(); // Update the tab display
            }
            saveState();

            // Check content against disk
            checkFileContent(activeTab);
        }
    });

    // Add this line after creating the editor and before loading the initial state
    loadState();

    // Add the startRename function
    function startRename(element, itemPath) {
        const input = document.createElement('input');
        input.className = 'rename-input';
        input.value = path.basename(itemPath);

        // Prevent the default click behavior while renaming
        element.onclick = (e) => e.stopPropagation();

        element.appendChild(input);
        input.focus();

        // Select the name without extension for files
        const ext = path.extname(input.value);
        const nameWithoutExt = path.basename(input.value, ext);
        input.setSelectionRange(0, nameWithoutExt.length);

        input.addEventListener('blur', () => finishRename(element, input, itemPath));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                input.remove();
                resetElementClickHandler(element, itemPath);
            }
        });
    }

    function finishRename(element, input, oldPath) {
        const newName = input.value.trim();
        const oldName = path.basename(oldPath);

        if (newName && newName !== oldName) {
            try {
                const newPath = path.join(path.dirname(oldPath), newName);
                fs.renameSync(oldPath, newPath);

                // Update any open tabs with this file
                const tab = tabs.find(t => t.path === oldPath);
                if (tab) {
                    tab.path = newPath;
                    renderTabs();
                    updateFilePathBar(newPath);
                }

                // Refresh the file explorer
                loadDirectory(currentPath);
            } catch (error) {
                console.error('Error renaming:', error);
                showToast(`Error renaming: ${error.message}`, 5000);
            }
        }

        input.remove();
        resetElementClickHandler(element, oldPath);
    }

    function resetElementClickHandler(element, itemPath) {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            element.onclick = () => loadDirectory(itemPath);
        } else {
            element.onclick = () => openFile(itemPath);
        }
    }

    // Update the initial directory loading logic
    loadState();
    try {
        const lastDirectory = localStorage.getItem('lastDirectory');

        if (lastDirectory && fs.existsSync(lastDirectory)) {
            loadDirectory(lastDirectory);
        } else {
            // Show folder select dialog if no saved directory or it doesn't exist
            remote.dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: 'Select Folder'
            }).then(result => {
                if (!result.canceled && result.filePaths.length > 0) {
                    loadDirectory(result.filePaths[0]);
                } else {
                    // Only fall back to C:/ if user cancels dialog
                    if (fs.existsSync('C:/')) {
                        loadDirectory('C:/');
                    } else {
                        showToast('Please select a valid folder to continue', 5000);
                    }
                }
                hideSpinner(); // Hide spinner after directory is loaded
            });
        }
    } catch (error) {
        console.error('Error loading last directory:', error);
        hideSpinner(); // Hide spinner on error
        // Show folder select dialog on error
        remote.dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Folder'
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                loadDirectory(result.filePaths[0]);
            } else {
                if (fs.existsSync('C:/')) {
                    loadDirectory('C:/');
                } else {
                    showToast('Please select a valid folder to continue', 5000);
                }
            }
            hideSpinner(); // Hide spinner after directory is loaded
        });
    }

    // Add API key modal handlers here, before the initial directory loading
    document.getElementById('set-api-key').addEventListener('click', () => {
        const modal = document.getElementById('api-key-modal');
        const input = document.getElementById('api-key-input');
        input.value = localStorage.getItem('codeCompletionApiKey') || '';
        const modelSelect = document.getElementById('model-select');
        modelSelect.value = localStorage.getItem('selectedModel') || 'gpt-4o-mini';
        modal.style.display = 'flex';
    });

    document.getElementById('cancel-api-key').addEventListener('click', () => {
        document.getElementById('api-key-modal').style.display = 'none';
    });

    document.getElementById('save-api-key').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value.trim();
        const selectedModel = document.getElementById('model-select').value;
        if (apiKey) {
            localStorage.setItem('codeCompletionApiKey', apiKey);
            localStorage.setItem('selectedModel', selectedModel);
            showToast('API key saved successfully!');
        } else {
            localStorage.removeItem('codeCompletionApiKey');
            localStorage.removeItem('selectedModel');
            showToast('API key removed');
        }
        document.getElementById('api-key-modal').style.display = 'none';
    });

    // Close modal when clicking outside
    document.getElementById('api-key-modal').addEventListener('click', (e) => {
        if (e.target.id === 'api-key-modal') {
            e.target.style.display = 'none';
        }
    });

    // AI Chat functionality
    const chatButton = document.getElementById('ai-chat-button');
    const chatModal = document.getElementById('chat-modal');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    chatButton.addEventListener('click', () => {
        chatModal.style.display = 'flex';
        updateChatFileList();
    });

    chatClose.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    chatSend.addEventListener('click', sendChatMessage);

    // Update the sendChatMessage function
    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        const apiKey = localStorage.getItem('codeCompletionApiKey');
        if (!apiKey) {
            showToast('Please set your API key first');
            return;
        }

        // Get selected files content
        const selectedFiles = [];
        document.querySelectorAll('.chat-file-checkbox:checked').forEach(checkbox => {
            const filePath = checkbox.dataset.path;
            const tab = tabs.find(t => t.path === filePath);
            if (tab) {
                selectedFiles.push({
                    name: path.basename(filePath),
                    content: tab.model.getValue()
                });
            }
        });

        // Prepare context with file contents
        let context = '';
        if (selectedFiles.length > 0) {
            context = 'Here are the relevant files:\n\n' +
                selectedFiles.map(file =>
                    `File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\`\n`
                ).join('\n') +
                '\nUser question: ';
        }

        // Add user message
        addChatMessage(message, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('http://88.99.145.13:8002/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: localStorage.getItem('selectedModel'),
                    messages: [
                        {
                            role: 'user',
                            content: context + message
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (errorText.includes('maximum context length')) {
                    addChatMessage('Error: Maximum context length exceeded. Please select fewer files or send a shorter message.', 'ai error');
                } else if (errorText.includes('Out of credits')) {
                    addChatMessage('Error: Out of credits', 'ai error');
                } else {
                    addChatMessage('Error: ' + errorText, 'ai error');
                }
                return;
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();
            addChatMessage(aiResponse, 'ai');
        } catch (error) {
            console.error('Chat error:', error);
            addChatMessage('Error: ' + error.message, 'ai error');
        }
    }

    function addChatMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;

        if (type === 'ai') {
            // Parse markdown and add syntax highlighting
            messageDiv.innerHTML = marked.parse(message, {
                highlight: function (code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return hljs.highlightAuto(code).value;
                }
            });
        } else if (type === 'ai error') {
            messageDiv.textContent = message;
            messageDiv.className = 'chat-message ai-message error';
        } else {
            messageDiv.textContent = message;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /* Update the chat file list function */
    function updateChatFileList() {
        const fileList = document.getElementById('chat-file-list');
        fileList.innerHTML = '';  // Clear all items

        tabs.forEach(tab => {
            if (tab.path === 'untitled') return;

            const item = document.createElement('div');
            item.className = 'chat-file-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'chat-file-checkbox';
            checkbox.dataset.path = tab.path;
            checkbox.checked = true;  // Default to checked

            const label = document.createElement('span');
            label.textContent = path.basename(tab.path);

            item.appendChild(checkbox);
            item.appendChild(label);
            fileList.appendChild(item);
        });
    }

    /* Add these functions for tab context menu */
    function showTabContextMenu(e, tab) {
        // Remove any existing context menus
        removeTabContextMenu();

        const menu = document.createElement('div');
        menu.className = 'tab-context-menu';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        // Close
        const closeItem = document.createElement('div');
        closeItem.className = 'tab-context-menu-item';
        closeItem.textContent = 'Close';
        closeItem.onclick = () => closeTab(tab.id);
        menu.appendChild(closeItem);

        // Close All
        const closeAllItem = document.createElement('div');
        closeAllItem.className = 'tab-context-menu-item';
        closeAllItem.textContent = 'Close All';
        closeAllItem.onclick = closeAllTabs;
        menu.appendChild(closeAllItem);

        // Separator
        const separator = document.createElement('div');
        separator.className = 'tab-context-menu-separator';
        menu.appendChild(separator);

        // Close Others
        const closeOthersItem = document.createElement('div');
        closeOthersItem.className = 'tab-context-menu-item';
        closeOthersItem.textContent = 'Close Others';
        closeOthersItem.onclick = () => closeOtherTabs(tab.id);
        menu.appendChild(closeOthersItem);

        document.body.appendChild(menu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', removeTabContextMenu, { once: true });
        }, 0);
    }

    function removeTabContextMenu() {
        const existingMenu = document.querySelector('.tab-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    async function closeAllTabs() {
        for (const tab of [...tabs]) {
            await closeTab(tab.id);
        }
        removeTabContextMenu();
    }

    async function closeOtherTabs(currentTabId) {
        for (const tab of [...tabs]) {
            if (tab.id !== currentTabId) {
                await closeTab(tab.id);
            }
        }
        removeTabContextMenu();
    }
    // Update the searchFiles function
    async function searchFiles(query) {
        // Cancel any ongoing search immediately
        if (currentSearchController) {
            currentSearchController.abort();
            currentSearchController = null;
        }

        // Create new controller for this search
        currentSearchController = new AbortController();
        const signal = currentSearchController.signal;

        const searchResults = document.getElementById('search-results');
        const searchStatus = document.getElementById('search-status');
        const currentFolderPath = localStorage.getItem('lastDirectory');

        // Don't search if query is empty
        if (!query.trim()) {
            searchResults.innerHTML = '';
            searchStatus.style.display = 'none';
            return;
        }

        // Show searching status
        searchStatus.style.display = 'block';
        searchResults.innerHTML = '';

        if (!currentFolderPath) {
            searchStatus.style.display = 'none';
            showToast('No folder path found in local storage.', 5000);
            return;
        }

        // Set timeout for this search
        const timeoutId = setTimeout(() => {
            if (currentSearchController) {
                currentSearchController.abort();
                searchStatus.style.display = 'none';
                showToast('Search completed or stopped after 5 seconds', 3000);
            }
        }, 5000);

        try {
            async function* findInFiles(dir) {
                const items = await fs.promises.readdir(dir);

                for (const item of items) {
                    // Check if search was aborted
                    if (signal.aborted) return;

                    const fullPath = path.join(dir, item);
                    const stats = await fs.promises.stat(fullPath);

                    if (stats.isDirectory()) {
                        yield* findInFiles(fullPath);
                    } else {
                        try {
                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            const lines = content.split('\n');

                            for (let i = 0; i < lines.length; i++) {
                                if (signal.aborted) return;
                                if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                                    yield {
                                        lineNumber: i + 1,
                                        path: fullPath,
                                        name: item
                                    };
                                    break; // Only show first match per file
                                }
                            }
                        } catch (error) {
                            console.error(`Error reading file ${fullPath}:`, error);
                        }
                    }
                }
            }

            let resultCount = 0;
            for await (const match of findInFiles(currentFolderPath)) {
                if (signal.aborted) break;

                const resultElement = document.createElement('div');
                resultElement.className = 'search-result-item';

                // Update the search result click handler in searchFiles function
                resultElement.onmousedown = async function () {
                    const filePath = match.path;
                    const lineNumber = match.lineNumber;

                    try {
                        // First open the file
                        await openFile(filePath);

                        // Create a promise to wait for editor to be ready
                        const waitForEditor = new Promise((resolve) => {
                            const checkEditor = setInterval(() => {
                                if (window.editor && window.editor.getModel()) {
                                    clearInterval(checkEditor);
                                    resolve();
                                }
                            }, 50); // Check every 50ms

                            // Timeout after 5 seconds
                            setTimeout(() => {
                                clearInterval(checkEditor);
                                resolve();
                            }, 5000);
                        });

                        // Wait for editor to be ready
                        await waitForEditor;

                        // Now navigate to the line
                        window.editor.revealLineInCenter(lineNumber);
                        window.editor.setPosition({
                            lineNumber: lineNumber,
                            column: 1
                        });

                        // Add decoration to highlight the line
                        const decorations = window.editor.deltaDecorations([], [{
                            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                            options: {
                                isWholeLine: true,
                                className: 'lineHighlight',
                                linesDecorationsClassName: 'lineDecoration'
                            }
                        }]);

                        // Remove the decoration after 2 seconds
                        setTimeout(() => {
                            window.editor.deltaDecorations(decorations, []);
                        }, 2000);

                    } catch (error) {
                        console.error('Error opening file:', error);
                        showToast('Error opening file: ' + error.message);
                    }
                };

                const relativePath = path.relative(currentFolderPath, match.path);

                resultElement.innerHTML = `
                <div class="file-item">${match.name}</div>
                <div class="result-path">${relativePath}:${match.lineNumber}</div>
            `;

                searchResults.appendChild(resultElement);
                resultCount++;
            }

            if (resultCount === 0 && !signal.aborted) {
                searchResults.innerHTML = '<div style="padding: 10px; color: #858585;">No results found</div>';
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search was stopped.');
            } else {
                console.error('Search error:', error);
                searchResults.innerHTML = '<div style="padding: 10px; color: #ff6b6b;">Error during search</div>';
            }
        } finally {
            clearTimeout(timeoutId);
            if (!signal.aborted) {
                searchStatus.style.display = 'none';
            }
            // Clear the current controller if this search is done
            if (signal.aborted) {
                currentSearchController = null;
            }
        }
    }

    // Update the search input handler
    document.getElementById('search-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                // Abort any ongoing search before starting a new one
                if (currentSearchController) {
                    currentSearchController.abort();
                    currentSearchController = null;
                }
                searchFiles(query);
            } else {
                // Clear results if search is empty
                document.getElementById('search-results').innerHTML = '';
                document.getElementById('search-status').style.display = 'none';
            }
        }
    });
    // Utility function for debouncing (if not already defined)
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});
// Update the search icon click handler
document.getElementById('search-icon').addEventListener('click', function () {
    this.classList.add('active');
    document.getElementById('explorer-icon').classList.remove('active');

    // Store the current file explorer content before hiding it
    const fileExplorer = document.getElementById('file-explorer');
    fileExplorer.style.display = 'none';
    document.getElementById('search-container').style.display = 'flex';

    // Update explorer title
    document.querySelector('.explorer-title').textContent = 'SEARCH';

    // Focus the search input
    document.getElementById('search-input').focus();
});

// Update the explorer icon click handler
document.getElementById('explorer-icon').addEventListener('click', function () {
    this.classList.add('active');
    document.getElementById('search-icon').classList.remove('active');

    // Show file explorer and hide search container
    document.getElementById('file-explorer').style.display = 'block';
    document.getElementById('search-container').style.display = 'none';

    // Update explorer title back
    document.querySelector('.explorer-title').textContent = 'EXPLORER';

    // Reload the current directory to refresh the file explorer
    const currentDir = localStorage.getItem('lastDirectory');
    if (currentDir) {
        loadDirectory(currentDir);
    }
});

document.getElementById('toggle-sidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    const sideBar = document.getElementById('side-bar');
    const tick = document.getElementById('sidebar-tick');

    if (sidebar.style.display === 'none') {
        sidebar.style.display = 'flex';
        sideBar.style.display = 'flex';
        tick.style.display = 'inline'; // Show tick when sidebar is visible
        localStorage.setItem('sidebarVisible', 'true'); // Save state to localStorage
    } else {
        sidebar.style.display = 'none';
        sideBar.style.display = 'none';
        tick.style.display = 'none'; // Hide tick when sidebar is hidden
        localStorage.setItem('sidebarVisible', 'false'); // Save state to localStorage
    }
});
