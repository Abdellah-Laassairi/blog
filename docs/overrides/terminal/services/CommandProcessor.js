// Command processor class
window.TerminalApp.CommandProcessor = class CommandProcessor {
    constructor() {
        this.isChatMode = false;
        this.currentDirectory = '/home/abdellah/portfolio';
        // Use default theme if config is not loaded yet
        this.theme = window.TerminalApp?.TERMINAL_CONFIG?.TERMINAL_OPTIONS?.theme || {
            red: '#ff0000',
            green: '#00ff00',
            yellow: '#ffff00',
            blue: '#0000ff',
            cyan: '#00ffff',
            white: '#ffffff'
        };
    }

    // Helper method to format color using RGB values
    formatColor(color) {
        // If color is already in RGB format, return it
        if (typeof color === 'string' && color.startsWith('\x1b[')) {
            return color;
        }
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `\x1b[38;2;${r};${g};${b}m`;
    }

    // Color formatting helpers
    get errorColor() { return this.formatColor(this.theme.red); }
    get successColor() { return this.formatColor(this.theme.green); }
    get infoColor() { return this.formatColor(this.theme.cyan); }
    get warningColor() { return this.formatColor(this.theme.yellow); }
    get resetColor() { return '\x1b[0m'; }

    // Helper method to format text with color
    colorize(text, color) {
        return `${this.formatColor(color)}${text}${this.resetColor}`;
    }

    async processCommand(input) {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        // Handle chat mode
        if (this.isChatMode) {
            if (trimmedInput.toLowerCase() === 'exit') {
                await this.exitChat();
                return;
            }

            if (window.TerminalApp.chatService) {
                await window.TerminalApp.chatService.sendChatMessage(trimmedInput);
            } else {
                TerminalApp.write('\x1b[1;31mError: Chat service not initialized.\x1b[0m\n');
                this.isChatMode = false;
            }
            return;
        }

        const args = trimmedInput.split(/\s+/);
        const command = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        const commands = {
            help: this.showHelp.bind(this),
            clear: this.clearScreen.bind(this),
            ls: this.listFiles.bind(this),
            ll: this.listFilesDetailed.bind(this),
            cat: this.catFile.bind(this),
            pwd: this.showCurrentDir.bind(this),
            mkdir: this.makeDirectory.bind(this),
            touch: this.touchFile.bind(this),
            rm: this.removeFile.bind(this),
            cp: this.copyFile.bind(this),
            mv: this.moveFile.bind(this),
            whoami: this.showUser.bind(this),
            date: this.showDate.bind(this),
            ps: this.listProcesses.bind(this),
            df: this.showDiskUsage.bind(this),
            env: this.showEnv.bind(this),
            uname: this.showSystemInfo.bind(this),
            grep: this.grepPattern.bind(this),
            find: this.findFiles.bind(this),
            man: this.showManual.bind(this),
            history: this.showHistory.bind(this),
            chat: this.startChat.bind(this),
            exit: this.exitChat.bind(this)
        };

        if (commands[command]) {
            try {
                await commands[command](commandArgs);
            } catch (error) {
                TerminalApp.write(this.colorize(`Error: ${error.message}`, this.theme.red) + '\n');
            }
        } else {
            TerminalApp.write(this.colorize(`Command not found: ${command}`, this.theme.red) + '\n');
            TerminalApp.write('Type "help" to see available commands\n');
        }
    }

    async showHelp() {
        const helpText = [
            this.colorize('Available Commands', this.theme.cyan),
            '',
            this.colorize('## File Operations', this.theme.yellow),
            'ls                - List files in current directory',
            'll                - List files in current directory with details',
            'cat <file>        - Display file contents',
            'pwd               - Print working directory',
            'mkdir <dir>       - Create a new directory',
            'touch <file>      - Create a new empty file',
            'rm <file>         - Remove a file',
            'cp <src> <dest>   - Copy a file',
            'mv <src> <dest>   - Move a file',
            '',
            this.colorize('## Terminal Control', this.theme.yellow),
            'clear             - Clear terminal screen',
            'help              - Show this help message',
            'chat              - Start chat mode',
            'exit              - Exit chat mode (when in chat)',
            '',
            this.colorize('## System Information', this.theme.yellow),
            'whoami            - Print current user',
            'date              - Print current date and time',
            'ps                - List running processes',
            'df                - Show disk usage',
            'env               - Print environment variables',
            'uname             - Print system information',
            '',
            this.colorize('## File Search', this.theme.yellow),
            'grep <pattern> <file> - Search for a pattern in a file',
            'find <path>       - Search for files in a directory',
            '',
            this.colorize('## Manual', this.theme.yellow),
            'man <command>     - Show manual for a command',
            '',
            this.colorize('## History', this.theme.yellow),
            'history           - Show command history'
        ];

        helpText.forEach(line => TerminalApp.write(line + '\n'));
    }

    async clearScreen() {
        TerminalApp.write('\x1b[2J');  // Clear entire screen
        TerminalApp.write('\x1b[H');   // Move cursor to home position
    }

    async listFiles() {
        Object.keys(window.TerminalApp.fileSystem).forEach(file => {
            TerminalApp.write(this.colorize(file, this.theme.cyan) + '\n');
        });
    }

    async listFilesDetailed() {
        const files = Object.entries(window.TerminalApp.fileSystem).map(([name, data]) => ({
            name,
            permissions: data.permissions,
            owner: data.owner,
            group: data.group,
            size: data.size,
            modified: data.modified
        }));

        files.forEach(file => {
            const date = file.modified.toLocaleString('en-US', { 
                month: 'short', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            TerminalApp.write(
                `${file.permissions} ${file.owner} ${file.group} ${String(file.size).padStart(8)} ${date} ${this.colorize(file.name, this.theme.cyan)}\n`
            );
        });
    }

    async catFile(args) {
        if (!args.length) {
            throw new Error('Please specify a file to read');
        }

        const filename = args[0];
        const file = window.TerminalApp.fileSystem[filename];
        
        if (!file) {
            throw new Error(`File not found: ${filename}`);
        }

        TerminalApp.write(file.content + '\n');
    }

    async makeDirectory(args) {
        if (!args.length) {
            throw new Error('mkdir: missing operand');
        }
        TerminalApp.write(this.colorize(`Created directory ${args[0]}`, this.theme.green) + '\n');
    }

    async touchFile(args) {
        if (!args.length) {
            throw new Error('touch: missing file operand');
        }
        TerminalApp.write(this.colorize(`Created file ${args[0]}`, this.theme.green) + '\n');
    }

    async removeFile(args) {
        if (!args.length) {
            throw new Error('rm: missing operand');
        }
        TerminalApp.write(this.colorize(`Removed ${args[0]}`, this.theme.green) + '\n');
    }

    async copyFile(args) {
        if (args.length < 2) {
            throw new Error('cp: missing destination file operand');
        }
        TerminalApp.write(this.colorize(`Copied ${args[0]} to ${args[1]}`, this.theme.green) + '\n');
    }

    async moveFile(args) {
        if (args.length < 2) {
            throw new Error('mv: missing destination file operand');
        }
        TerminalApp.write(this.colorize(`Moved ${args[0]} to ${args[1]}`, this.theme.green) + '\n');
    }

    async showUser() {
        TerminalApp.write('abdellah\n');
    }

    async showDate() {
        const now = new Date();
        TerminalApp.write(now.toLocaleString() + '\n');
    }

    async listProcesses() {
        const processes = [
            { pid: 1, cmd: 'terminal', cpu: '0.0', mem: '0.1' },
            { pid: 2, cmd: 'shell', cpu: '0.0', mem: '0.1' }
        ];
        
        TerminalApp.write('  PID CMD         %CPU %MEM\n');
        processes.forEach(proc => {
            TerminalApp.write(
                `${String(proc.pid).padStart(5)} ${proc.cmd.padEnd(12)} ${proc.cpu.padStart(4)} ${proc.mem.padStart(4)}\n`
            );
        });
    }

    async showDiskUsage() {
        const usage = [
            { fs: '/', size: '50G', used: '25G', avail: '25G', use: '50%', mount: '/' }
        ];
        
        TerminalApp.write('Filesystem  Size  Used  Avail Use% Mounted on\n');
        usage.forEach(fs => {
            TerminalApp.write(
                `${fs.fs.padEnd(12)}${fs.size.padStart(6)} ${fs.used.padStart(6)} ${fs.avail.padStart(6)} ${fs.use.padStart(4)} ${fs.mount}\n`
            );
        });
    }

    async showEnv() {
        const env = {
            USER: 'abdellah',
            HOME: '/home/abdellah',
            SHELL: '/bin/bash',
            TERM: 'xterm-256color'
        };
        
        Object.entries(env).forEach(([key, value]) => {
            TerminalApp.write(`${key}=${value}\n`);
        });
    }

    async showSystemInfo() {
        const info = {
            sysname: 'Linux',
            release: '5.15.0',
            version: '#1 SMP',
            machine: 'x86_64'
        };
        TerminalApp.write(`${info.sysname} ${info.release} ${info.version} ${info.machine}\n`);
    }

    async grepPattern(args) {
        if (!args.length) {
            throw new Error('grep: missing pattern');
        }
        const pattern = args[0];
        const files = args.slice(1);
        
        if (!files.length) {
            throw new Error('grep: missing file operand');
        }

        files.forEach(file => {
            const content = window.TerminalApp.fileSystem[file]?.content || '';
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (line.includes(pattern)) {
                    TerminalApp.write(`${file}:${i + 1}:${line}\n`);
                }
            });
        });
    }

    async findFiles(args) {
        if (!args.length) {
            throw new Error('find: missing path');
        }
        
        Object.keys(window.TerminalApp.fileSystem).forEach(file => {
            TerminalApp.write(`./${file}\n`);
        });
    }

    async showManual(args) {
        if (!args.length) {
            throw new Error('man: missing command name');
        }
        
        const command = args[0];
        const manPages = {
            ls: 'ls - list directory contents',
            cat: 'cat - concatenate files and print on the standard output',
            pwd: 'pwd - print name of current/working directory'
        };
        
        if (manPages[command]) {
            TerminalApp.write(manPages[command] + '\n');
        } else {
            throw new Error(`No manual entry for ${command}`);
        }
    }

    async showHistory() {
        if (window.TerminalApp.commandHistory) {
            window.TerminalApp.commandHistory.forEach((cmd, i) => {
                TerminalApp.write(`${String(i + 1).padStart(4)} ${cmd}\n`);
            });
        }
    }

    async showCurrentDir() {
        TerminalApp.write(this.colorize(this.currentDirectory, this.theme.cyan) + '\n');
    }

    async startChat() {
        if (this.isChatMode) {
            TerminalApp.write('Already in chat mode. Type "exit" to leave chat mode.\n');
            return;
        }

        if (!window.TerminalApp.ChatService) {
            TerminalApp.write('\x1b[1;31mError: Chat service is not available.\x1b[0m\n');
            return;
        }

        this.isChatMode = true;
        
        // Only create a new chat service if one doesn't exist
        if (!window.TerminalApp.chatService) {
            window.TerminalApp.chatService = new window.TerminalApp.ChatService(
                window.TerminalApp.TERMINAL_CONFIG,
                window.TerminalApp.terminal
            );
        }

        TerminalApp.write('\x1b[1;32mEntering chat mode. Type "exit" to leave chat mode.\x1b[0m\n');
        TerminalApp.write('Loading AI model, please wait...\n');
        
        try {
            // Wait for model initialization if not already initialized
            if (!window.transformersHelper.modelReady) {
                await window.transformersHelper.initialize();
            }
            TerminalApp.write('\x1b[1;32mModel initialized successfully!\x1b[0m\n');
            TerminalApp.write(TerminalApp.CHAT_PROMPT);
        } catch (error) {
            console.error('Failed to initialize model:', error);
            TerminalApp.write('\x1b[1;31mError: Failed to initialize AI model. Please try again later.\x1b[0m\n');
            this.isChatMode = false;
        }
    }

    async exitChat() {
        if (!this.isChatMode) {
            TerminalApp.write('Not in chat mode.\n');
            return;
        }

        this.isChatMode = false;
        TerminalApp.write('\x1b[1;32mExiting chat mode.\x1b[0m\n');
    }
}
