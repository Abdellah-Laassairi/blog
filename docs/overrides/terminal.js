// docs/overrides/terminal.js

document.addEventListener("DOMContentLoaded", function() {
    // Check if terminal element exists
    const terminalElement = document.getElementById("terminal-x");
    if (!terminalElement) return;

    // Initialize required addons
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    const searchAddon = new SearchAddon.SearchAddon();

    // Initialize terminal with Gruvbox Dark theme (matching your MkDocs theme)
    const term = new Terminal({
        theme: {
            background: '#282828',
            foreground: '#ebdbb2',
            cursor: '#d79921',
            selectionBackground: '#504945',
            black: '#282828',
            red: '#fb4934',
            green: '#b8bb26',
            yellow: '#fabd2f',
            blue: '#83a598',
            magenta: '#d3869b',
            cyan: '#8ec07c',
            white: '#f9f5d7',
            brightBlack: '#928374',
            brightRed: '#fb4934',
            brightGreen: '#b8bb26',
            brightYellow: '#fabd2f',
            brightBlue: '#83a598',
            brightMagenta: '#d3869b',
            brightCyan: '#8ec07c',
            brightWhite: '#fbf1c7'
        },
        fontFamily: '"Roboto Mono", monospace', // Using your configured font
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        allowTransparency: true,
        renderBoldAsBright: true,
        smoothScrollDuration: 300,
        scrollback: 10000,
        windowOptions: {
            setWinLines: true
        }
    });

    // Load addons
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    // Initialize terminal
    term.open(terminalElement);
    fitAddon.fit();

    // Simulated file system
    const fileSystem = {
        'about.md': `# About Abdellah Laassairi
Data Scientist | Machine Learning Engineer
🌍 Based in France

Focused on creating impactful AI solutions and reducing CO₂ emissions through sustainable technology.`,
        'projects.md': `# Projects
1. Sustainable Construction AI
2. Carbon Footprint Optimization
3. Materials Intelligence Platform`,
        'contact.md': `# Contact
- Email: [laassairi.abdellah@gmail](mailto:laassairi.abdellah@gmail)
- GitHub: [@Abdellah-Laassairi](https://github.com/Abdellah-Laassairi)
- LinkedIn: [in/abdellah](https://linkedin.com/in/abdellah.laassairi)`,
    };

    // Command state
    let commandBuffer = '';
    let commandHistory = [];
    let historyIndex = -1;
    const prompt = '$ ';

    // Welcome message
    function displayWelcome() {
        term.writeln('\x1b[1;32m╭───────────────────────────────────────────╮');
        term.writeln('│  Beep Boop! 🤖 Welcome human !              │');
        term.writeln('│  Type "help" to see available commands     │');
        term.writeln('╰───────────────────────────────────────────╯\x1b[0m');
        term.write(prompt);
    }

    displayWelcome();

    // Handle window resize
    window.addEventListener('resize', () => {
        fitAddon.fit();
    });

    // Input handling
    term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
            handleCommand();
        } else if (domEvent.keyCode === 8) { // Backspace
            if (commandBuffer.length > 0) {
                commandBuffer = commandBuffer.slice(0, -1);
                term.write('\b \b');
            }
        } else if (domEvent.keyCode === 38) { // Up arrow
            navigateHistory('up');
        } else if (domEvent.keyCode === 40) { // Down arrow
            navigateHistory('down');
        } else if (printable) {
            commandBuffer += key;
            term.write(key);
        }
    });

    function handleCommand() {
        term.writeln('');
        const command = commandBuffer.trim();
        
        if (command) {
            commandHistory.push(command);
            historyIndex = commandHistory.length;
            processCommand(command);
        }
        
        commandBuffer = '';
        term.write(prompt);
    }

    function navigateHistory(direction) {
        if (direction === 'up' && historyIndex > 0) {
            historyIndex--;
        } else if (direction === 'down' && historyIndex < commandHistory.length) {
            historyIndex++;
        }

        term.write('\x1b[2K\r' + prompt);
        
        if (historyIndex < commandHistory.length) {
            commandBuffer = commandHistory[historyIndex];
            term.write(commandBuffer);
        } else {
            commandBuffer = '';
        }
    }

    function processCommand(command) {
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'help':
                term.writeln('\x1b[1;33mAvailable commands:\x1b[0m');
                term.writeln('  \x1b[1;36mls\x1b[0m              - List files');
                term.writeln('  \x1b[1;36mcat [file]\x1b[0m      - View file contents');
                term.writeln('  \x1b[1;36mclear\x1b[0m           - Clear screen');
                term.writeln('  \x1b[1;36mcontact\x1b[0m         - Show contact information');
                term.writeln('  \x1b[1;36mprojects\x1b[0m        - List current projects');
                term.writeln('  \x1b[1;36mabout\x1b[0m           - About Abdellah');
                break;

            case 'ls':
                term.writeln('\x1b[1;34m' + Object.keys(fileSystem).join('  ') + '\x1b[0m');
                break;

            case 'cat':
                const filename = args[1];
                if (!filename) {
                    term.writeln('\x1b[1;31mError: Please specify a file\x1b[0m');
                } else if (fileSystem[filename]) {
                    term.writeln(fileSystem[filename]);
                } else {
                    term.writeln(`\x1b[1;31mError: ${filename}: No such file\x1b[0m`);
                }
                break;

            case 'clear':
                term.clear();
                displayWelcome();
                return;

            case 'contact':
                term.writeln(fileSystem['contact.md']);
                break;

            case 'projects':
                term.writeln(fileSystem['projects.md']);
                break;

            case 'about':
                term.writeln(fileSystem['about.md']);
                break;

            default:
                term.writeln(`\x1b[1;31mCommand not found: ${cmd}\x1b[0m`);
                term.writeln('Type "help" for available commands');
        }
    }

    // Handle terminal resize
    new ResizeObserver(() => {
        fitAddon.fit();
    }).observe(terminalElement);
});