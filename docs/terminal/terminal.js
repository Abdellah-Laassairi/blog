// Initialize TerminalApp namespace
window.TerminalApp = window.TerminalApp || {};

// Load theme configuration
async function loadThemeConfig() {
    try {
        const response = await fetch('/blog/terminal/config/theme-config.yaml');
        const yamlText = await response.text();
        const config = jsyaml.load(yamlText);

        // Convert YAML config to terminal config format
        const TERMINAL_CONFIG = {
            PROMPT_COLORS: config.prompt_colors,
            get PROMPT() {
                return `${this.PROMPT_COLORS.env}(base) ${this.PROMPT_COLORS.user}abdellah${this.PROMPT_COLORS.at}@${this.PROMPT_COLORS.host}portfolio${this.PROMPT_COLORS.path}:~/portfolio${this.PROMPT_COLORS.symbol}$ \x1b[0m`;
            },
            CHAT_PROMPT: config.chat_prompt,
            TERMINAL_OPTIONS: config.terminal_options
        };

        // Assign the config to TerminalApp
        Object.assign(TerminalApp, {
            commandBuffer: '',
            commandHistory: [],
            historyIndex: -1,
            writeBuffer: [],
            isWriting: false,
            ...TERMINAL_CONFIG
        });

        console.log('Theme configuration loaded successfully');
    } catch (error) {
        console.error('Error loading theme configuration:', error);
        // Use default configuration as fallback
        const defaultConfig = {
            PROMPT_COLORS: {
                env: '\x1b[1;32m',
                user: '\x1b[1;32m',
                at: '\x1b[0m',
                host: '\x1b[1;32m',
                path: '\x1b[1;34m',
                symbol: '\x1b[0m'
            },
            get PROMPT() {
                return `${this.PROMPT_COLORS.env}(.env) ${this.PROMPT_COLORS.user}abdellah${this.PROMPT_COLORS.at}@${this.PROMPT_COLORS.host}blog${this.PROMPT_COLORS.path}:~/portfolio${this.PROMPT_COLORS.symbol}$ \x1b[0m`;
            },
            CHAT_PROMPT: '\x1b[1;34m🤖 >\x1b[0m ',
            TERMINAL_OPTIONS: {
                fontFamily: '"Fira Code", "Source Code Pro", "Consolas", monospace',
                fontSize: 14,
                lineHeight: 1.2,
                theme: {
                    background: '#1e1e1e',
                    foreground: '#f0f0f0',
                    cursor: '#f0f0f0',
                    selection: 'rgba(255, 255, 255, 0.3)',
                    black: '#000000',
                    red: '#e06c75',
                    green: '#98c379',
                    yellow: '#d19a66',
                    blue: '#61afef',
                    magenta: '#c678dd',
                    cyan: '#56b6c2',
                    white: '#abb2bf',
                    brightBlack: '#5c6370',
                    brightRed: '#e06c75',
                    brightGreen: '#98c379',
                    brightYellow: '#d19a66',
                    brightBlue: '#61afef',
                    brightMagenta: '#c678dd',
                    brightCyan: '#56b6c2',
                    brightWhite: '#ffffff'
                },
                cursorBlink: true,
                cursorStyle: 'block',
                scrollback: 5000,
                smoothScrollDuration: 0,
                scrollSensitivity: 40,
                macOptionIsMeta: true,
                fastScrollModifier: 'alt',
                fastScrollSensitivity: 60,
                minimumContrastRatio: 4.5,
                allowTransparency: false,
                letterSpacing: 0,
                padding: 8
            }
        };

        Object.assign(TerminalApp, {
            commandBuffer: '',
            commandHistory: [],
            historyIndex: -1,
            writeBuffer: [],
            isWriting: false,
            ...defaultConfig
        });
    }
}

// Debounced resize handler
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Expose optimized write functions to namespace
TerminalApp.optimizedWrite = function(terminal, text, options = {}) {
    TerminalApp.writeBuffer.push({ text, options });
    processWriteBuffer(terminal);
};

// Process the write buffer with error handling
async function processWriteBuffer(terminal) {
    if (TerminalApp.isWriting || !TerminalApp.writeBuffer.length) return;

    try {
        TerminalApp.isWriting = true;

        while (TerminalApp.writeBuffer.length) {
            const { text, options } = TerminalApp.writeBuffer.shift();
            options.newLine ? terminal.writeln(text) : terminal.write(text);

            if (TerminalApp.writeBuffer.length) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
    } catch (error) {
        console.error('Terminal write error:', error);
        terminal.writeln('\x1b[31mError: Failed to write to terminal\x1b[0m');
    } finally {
        TerminalApp.isWriting = false;
    }
}

// Add write method to TerminalApp
TerminalApp.write = function(text, options = {}) {
    if (this.terminal) {
        TerminalApp.optimizedWrite(this.terminal, text, options);
    }
};

// Function to write prompt
function writePrompt(terminal) {
    const isChatMode = TerminalApp.commandProcessor ? TerminalApp.commandProcessor.isChatMode : false;
    terminal.write(isChatMode ? TerminalApp.CHAT_PROMPT : TerminalApp.PROMPT);
}

// Function to format and display welcome message
async function displayWelcome(terminal) {
    // Display welcome box
    terminal.writeln('\x1b[1;32m╭───────────────────────────────────────────╮');
    terminal.writeln('\x1b[1;32m│\x1b[0m  Say Hi to Abdellah v0.0.1! 🤖            \x1b[1;32m│');
    terminal.writeln('\x1b[1;32m│\x1b[0m  Type "chat" to interact with the model   \x1b[1;32m│');
    terminal.writeln('\x1b[1;32m╰───────────────────────────────────────────╯\x1b[0m');
    terminal.writeln('');

    // Simulate loading with proper progress bar
    const stages = ['Initializing', 'Loading modules', 'Starting services', 'Ready'];
    for (let i = 0; i <= 100; i += 25) {
        const stage = stages[Math.floor(i/25)];
        const filled = '█'.repeat(Math.floor(i/4));
        const empty = '░'.repeat(25 - Math.floor(i/4));
        terminal.write(`\r\x1b[K\x1b[1;34m${stage}... [${filled}${empty}] ${i}%\x1b[0m`);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    terminal.write('\r\x1b[K');  // Clear the loading line
    terminal.writeln('\x1b[1;32mSystem initialized successfully!\x1b[0m');
    terminal.writeln('');

    // Write initial prompt
    writePrompt(terminal);
}

// Function to initialize terminal
async function initializeTerminal() {
    let terminal;
    try {
        console.log('Initializing terminal...');

        // Set default terminal options if not loaded
        const defaultOptions = {
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            theme: {
                background: '#282c34',
                foreground: '#abb2bf',
                cursor: '#528bff',
                red: '#e06c75',
                green: '#98c379',
                yellow: '#e5c07b',
                blue: '#61afef',
                magenta: '#c678dd',
                cyan: '#56b6c2',
                white: '#abb2bf'
            }
        };

        // Create terminal instance with configuration
        terminal = new Terminal({
            ...(TerminalApp.TERMINAL_OPTIONS || defaultOptions),
            cursorBlink: true,
            cursorStyle: 'block',
            convertEol: true,
            fontWeight: 500,
            fontWeightBold: 700
        });

        // Initialize addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        const searchAddon = new SearchAddon.SearchAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);

        // Mount terminal
        const terminalElement = document.getElementById('terminal-x');
        if (!terminalElement) {
            throw new Error('Terminal element not found');
        }

        terminal.open(terminalElement);
        fitAddon.fit();

        // Store terminal instance globally
        TerminalApp.terminal = terminal;
        TerminalApp.commandBuffer = '';
        TerminalApp.commandHistory = [];
        TerminalApp.historyIndex = 0;

        // Initialize command processor
        TerminalApp.commandProcessor = new TerminalApp.CommandProcessor();

        // Set up event listeners
        setupEventListeners(terminal, fitAddon);

        // Display welcome message
        await displayWelcome(terminal);

        console.log('Terminal initialized successfully');
        return terminal;
    } catch (error) {
        console.error('Error initializing terminal:', error);
        if (terminal) {
            const errorColor = TerminalApp.TERMINAL_OPTIONS?.theme?.red || '#ff0000';
            terminal.writeln(`\x1b[38;2;${errorColor}mError: Failed to initialize terminal. Please check the console for details.\x1b[0m`);
        }
        throw error;
    }
}

// Set up event listeners for terminal
function setupEventListeners(terminal, fitAddon) {
    const debouncedFit = debounce(() => fitAddon.fit(), 100);

    window.addEventListener('resize', debouncedFit);
    new ResizeObserver(debouncedFit).observe(terminal.element);

    const keyHandlers = {
        13: () => handleEnterKey(terminal),
        8: () => handleBackspace(terminal),
        38: () => navigateHistory(terminal, 'up'),
        40: () => navigateHistory(terminal, 'down')
    };

    terminal.onKey(({ key, domEvent }) => {
        const handler = keyHandlers[domEvent.keyCode];
        if (handler) {
            handler();
        } else if (!domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey) {
            handleKeyInput(terminal, key);
        }
    });
}

// Handle Enter key press
async function handleEnterKey(terminal) {
    const command = TerminalApp.commandBuffer;

    // Reset command buffer before processing to prevent duplicates
    TerminalApp.commandBuffer = '';

    // Add command to history if not empty
    if (command.trim()) {
        TerminalApp.commandHistory.push(command);
        TerminalApp.historyIndex = TerminalApp.commandHistory.length;
    }

    // New line before processing
    terminal.writeln('');

    // Process the command using the global command processor
    if (TerminalApp.commandProcessor && command.trim()) {
        await TerminalApp.commandProcessor.processCommand(command);
    }

    // Write the prompt
    writePrompt(terminal);
}

// Handle backspace key
function handleBackspace(terminal) {
    if (TerminalApp.commandBuffer.length > 0) {
        TerminalApp.optimizedWrite(terminal, '\b \b');
        TerminalApp.commandBuffer = TerminalApp.commandBuffer.slice(0, -1);
    }
}

// Handle key input
function handleKeyInput(terminal, key) {
    const isPrintable = !key.altKey && !key.ctrlKey && !key.metaKey;

    if (isPrintable) {
        TerminalApp.commandBuffer += key;
        terminal.write(key);
    }
}

// Handle command history navigation
function navigateHistory(terminal, direction) {
    if (TerminalApp.commandHistory.length === 0) return;

    if (direction === 'up' && TerminalApp.historyIndex > 0) {
        TerminalApp.historyIndex--;
    } else if (direction === 'down' && TerminalApp.historyIndex < TerminalApp.commandHistory.length) {
        TerminalApp.historyIndex++;
    }

    const newCommand = TerminalApp.commandHistory[TerminalApp.historyIndex] || '';
    while (TerminalApp.commandBuffer.length > 0) {
        TerminalApp.optimizedWrite(terminal, '\b \b');
        TerminalApp.commandBuffer = TerminalApp.commandBuffer.slice(0, -1);
    }
    TerminalApp.optimizedWrite(terminal, newCommand);
    TerminalApp.commandBuffer = newCommand;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadThemeConfig();
    await initializeTerminal();
});
