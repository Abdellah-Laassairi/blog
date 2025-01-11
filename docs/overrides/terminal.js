document.addEventListener("DOMContentLoaded", function() {
    // Terminal element initialization
    const terminalElement = document.getElementById("terminal-x");
    if (!terminalElement) return;

    // Terminal addons initialization
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    const searchAddon = new SearchAddon.SearchAddon();

    // Terminal configuration with Gruvbox Dark theme
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
        fontFamily: '"Roboto Mono", monospace',
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

    // Virtual filesystem with formatted content
    const fileSystem = {
        'about.md': `# About Abdellah Laassairi

Data Scientist | Machine Learning Engineer
🌍 Based in France

Focused on creating impactful AI solutions and reducing CO₂ emissions through sustainable technology.`,
        'projects.md': `# Projects

1. Sustainable Construction AI
   - Machine learning optimization for sustainable building materials
   - Energy efficiency prediction models
   - Carbon footprint reduction algorithms

2. Carbon Footprint Optimization
   - Real-time emissions monitoring
   - Predictive maintenance for energy systems
   - Green energy transition planning

3. Materials Intelligence Platform
   - Advanced materials database
   - Property prediction models
   - Sustainability metrics analysis`,
        'contact.md': `# Contact Information

- Email: laassairi.abdellah@gmail
- GitHub: @Abdellah-Laassairi
- LinkedIn: in/abdellah.laassairi

Available for collaboration on sustainable tech projects.`
    };

    // Terminal state management
    let commandBuffer = '';
    let commandHistory = [];
    let historyIndex = -1;
    const prompt = '$ ';

    // Text formatting utility functions
    function formatMarkdownText(text) {
        const lines = text.split('\n');
        let formattedLines = [];
        let inList = false;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Handle headers
            if (trimmedLine.startsWith('# ')) {
                if (index > 0) formattedLines.push('');
                formattedLines.push('\x1b[1;37m' + trimmedLine.substring(2) + '\x1b[0m');
                formattedLines.push('');
                return;
            }

            // Handle numbered lists
            if (/^\d+\.\s/.test(trimmedLine)) {
                if (!inList && index > 0) formattedLines.push('');
                formattedLines.push(trimmedLine);
                inList = true;
                return;
            }

            // Handle bullet points
            if (trimmedLine.startsWith('- ')) {
                if (!inList && index > 0) formattedLines.push('');
                formattedLines.push(trimmedLine);
                inList = true;
                return;
            }

            // Handle empty lines
            if (trimmedLine === '') {
                formattedLines.push('');
                inList = false;
                return;
            }

            // Handle regular text
            if (trimmedLine) {
                if (inList) {
                    formattedLines.push('  ' + trimmedLine);
                } else {
                    formattedLines.push(trimmedLine);
                }
            }
        });

        return formattedLines;
    }

    // Welcome message display
    function displayWelcome() {
        term.writeln('\x1b[1;32m╭───────────────────────────────────────────╮');
        term.writeln('│  Beep Boop! 🤖 Welcome human !              │');
        term.writeln('│  Type "help" to see available commands     │');
        term.writeln('╰───────────────────────────────────────────╯\x1b[0m');
        term.write(prompt);
    }

    // Initialize terminal display
    displayWelcome();

    // Window resize handler
    window.addEventListener('resize', () => {
        fitAddon.fit();
    });

    // Input handler
    term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
            const currentCommand = commandBuffer;
            if (currentCommand.toLowerCase() === 'clear') {
                term.write('\r\n');
                processCommand(currentCommand);
                commandHistory.push(currentCommand);
                historyIndex = commandHistory.length;
                commandBuffer = '';
            } else {
                term.write('\r\n');
                if (currentCommand.trim()) {
                    commandHistory.push(currentCommand);
                    historyIndex = commandHistory.length;
                    processCommand(currentCommand);
                }
                commandBuffer = '';
                term.write(prompt);
            }
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

    // History navigation
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

    // Command processor
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
                    const formattedLines = formatMarkdownText(fileSystem[filename]);
                    formattedLines.forEach(line => term.writeln(line));
                } else {
                    term.writeln(`\x1b[1;31mError: ${filename}: No such file\x1b[0m`);
                }
                break;

            case 'clear':
                term.clear();
                displayWelcome();
                break;

            case 'contact':
                const formattedContact = formatMarkdownText(fileSystem['contact.md']);
                formattedContact.forEach(line => term.writeln(line));
                break;

            case 'projects':
                const formattedProjects = formatMarkdownText(fileSystem['projects.md']);
                formattedProjects.forEach(line => term.writeln(line));
                break;

            case 'about':
                const formattedAbout = formatMarkdownText(fileSystem['about.md']);
                formattedAbout.forEach(line => term.writeln(line));
                break;

            default:
                term.writeln(`\x1b[1;31mCommand not found: ${cmd}\x1b[0m`);
                term.writeln('Type "help" for available commands');
        }
    }

    // Terminal resize observer
    new ResizeObserver(() => {
        fitAddon.fit();
    }).observe(terminalElement);
});