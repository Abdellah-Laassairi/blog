// CommandProcessor.js

// Ensure TerminalApp namespace exists
window.TerminalApp = window.TerminalApp || {};

// Default theme if config is not available
const defaultTheme = {
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#a89984',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2'
};

window.TerminalApp.CommandProcessor = class CommandProcessor {
    static COMMANDS = {
        help: 'displayHelp',
        ls: 'listFiles',
        ll: 'listFilesDetailed',
        cat: 'catFile',
        clear: cmd => cmd.terminal.clear(),
        chat: 'enterChatMode',
        whoami: 'showUserInfo',
        pwd: 'showCurrentDirectory',
        date: 'showDateTime',
        echo: 'echoText',
        mkdir: 'makeDirectory',
        touch: 'touchFile',
        rm: 'removeFile',
        cp: 'copyFile',
        mv: 'moveFile',
        grep: 'grepSearch',
        find: 'findFiles',
        history: 'showHistory',
        man: 'showManual',
        ps: 'showProcesses',
        df: 'showDiskSpace',
        du: 'showDiskUsage',
        env: 'showEnvironment',
        uname: 'showSystemInfo'
    };

    constructor(terminal, fileSystem, chatService) {
        this.terminal = terminal;
        this.fileSystem = fileSystem || {};
        this.chatService = chatService;
        this.isChatMode = false;
        this.commandHistory = [];
        this.currentDirectory = '/home/user';
        // Get theme from config or use default
        this.theme = (window.TerminalApp.terminalConfig && window.TerminalApp.terminalConfig.theme) || defaultTheme;
        this.env = {
            HOME: '/home/user',
            PATH: '/usr/local/bin:/usr/bin:/bin',
            SHELL: '/bin/bash',
            USER: 'user',
            TERM: 'xterm-256color',
            LANG: 'en_US.UTF-8',
            PWD: '/home/user'
        };
    }

    formatColor(color) {
        return `\x1b[38;2;${color}m`;
    }

    formatMarkdownText(text) {
        if (!text) return [];

        const formatters = {
            h1: text => `${this.formatColor(this.theme.brightCyan)}# ${text}\x1b[0m`,
            h2: text => `${this.formatColor(this.theme.brightYellow)}## ${text}\x1b[0m`,
            h3: text => `${this.formatColor(this.theme.yellow)}### ${text}\x1b[0m`,
            bold: text => `\x1b[1m${text}\x1b[0m`,
            italic: text => `\x1b[3m${text}\x1b[0m`,
            link: (text, url) => `${this.formatColor(this.theme.blue)}${text} (${url})\x1b[0m`,
            code: text => `${this.formatColor(this.theme.brightGreen)}${text}\x1b[0m`,
            list: text => `  • ${text}`
        };

        return text.split('\n').map(line => {
            // Headers
            if (line.startsWith('# ')) return formatters.h1(line.slice(2));
            if (line.startsWith('## ')) return formatters.h2(line.slice(3));
            if (line.startsWith('### ')) return formatters.h3(line.slice(4));
            
            // Lists
            if (line.startsWith('- ')) return formatters.list(line.slice(2));
            
            // Other formatting
            line = line.replace(/\*\*(.+?)\*\*/g, (_, text) => formatters.bold(text));
            line = line.replace(/\*(.+?)\*/g, (_, text) => formatters.italic(text));
            line = line.replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => formatters.link(text, url));
            line = line.replace(/`(.+?)`/g, (_, text) => formatters.code(text));
            
            return line;
        });
    }

    async processCommand(command) {
        if (!command?.trim()) {
            this.terminal.writeln('\r\n' + (this.isChatMode ? TerminalApp.CHAT_PROMPT : TerminalApp.PROMPT));
            return;
        }

        if (this.isChatMode) {
            if (command.toLowerCase() === 'exit') {
                this.exitChatMode();
            } else {
                await this.chatService.sendChatMessage(command);
            }
            return;
        }

        this.commandHistory.push(command);
        const args = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        const cmd = args.shift()?.toLowerCase();

        try {
            const handler = CommandProcessor.COMMANDS[cmd];
            if (handler) {
                if (typeof handler === 'string') {
                    await this[handler](...args);
                } else {
                    await handler(this, ...args);
                }
            } else if (cmd) {
                this.terminal.writeln(`${this.formatColor(this.theme.red)}${cmd}: command not found\x1b[0m`);
            }
        } catch (error) {
            console.error(`Error executing command ${cmd}:`, error);
            this.terminal.writeln(`${this.formatColor(this.theme.red)}${error.message}\x1b[0m`);
        }
    }

    showUserInfo() {
        this.terminal.writeln(this.env.USER);
    }

    showCurrentDirectory() {
        this.terminal.writeln(this.currentDirectory);
    }

    showDateTime() {
        const now = new Date('2025-01-14T09:11:56Z');
        this.terminal.writeln(now.toUTCString());
    }

    echoText(...args) {
        const text = args
            .map(arg => arg.replace(/^["'](.*)["']$/, '$1'))
            .join(' ');
        this.terminal.writeln(text);
    }

    listFiles() {
        const files = Object.keys(this.fileSystem).sort();
        files.forEach(file => {
            this.terminal.writeln(file);
        });
    }

    listFilesDetailed() {
        const now = new Date('2025-01-14T09:27:21Z');
        const files = Object.keys(this.fileSystem).sort();
        
        this.terminal.writeln('total ' + files.length * 4);
        files.forEach(filename => {
            const file = this.fileSystem[filename];
            const date = file.modified.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            this.terminal.writeln(
                `${file.permissions} ${file.owner} ${file.group} ${file.size.toString().padStart(6)} ${date} ${filename}`
            );
        });
    }

    catFile(filename) {
        if (!filename) {
            this.terminal.writeln(`${this.formatColor(this.theme.red)}Error: Please specify a file to read\x1b[0m`);
            return;
        }

        const file = this.fileSystem[filename];
        if (!file) {
            this.terminal.writeln(`${this.formatColor(this.theme.red)}cat: ${filename}: No such file or directory\x1b[0m`);
            return;
        }

        const formattedLines = this.formatMarkdownText(file.content);
        formattedLines.forEach(line => this.terminal.writeln(line));
    }

    grepSearch(pattern, ...files) {
        if (!pattern) {
            this.terminal.writeln(`${this.formatColor(this.theme.red)}grep: missing pattern\x1b[0m`);
            return;
        }

        const searchFiles = files.length ? files : Object.keys(this.fileSystem);
        let found = false;

        searchFiles.forEach(filename => {
            const file = this.fileSystem[filename];
            if (!file) {
                this.terminal.writeln(`${this.formatColor(this.theme.red)}grep: ${filename}: No such file or directory\x1b[0m`);
                return;
            }

            const lines = file.content.split('\n');
            lines.forEach((line, index) => {
                if (line.includes(pattern)) {
                    this.terminal.writeln(`${this.formatColor(this.theme.green)}${filename}\x1b[0m:${this.formatColor(this.theme.yellow)}${index + 1}\x1b[0m:${line}`);
                    found = true;
                }
            });
        });

        if (!found) {
            this.terminal.writeln(`${this.formatColor(this.theme.yellow)}No matches found\x1b[0m`);
        }
    }

    findFiles(path = '.', ...args) {
        const files = Object.keys(this.fileSystem).sort();
        files.forEach(file => {
            this.terminal.writeln(`./${file}`);
        });
    }

    showManual(command) {
        if (!command) {
            this.terminal.writeln(`${this.formatColor(this.theme.red)}What manual page do you want?\x1b[0m`);
            return;
        }

        const manPages = {
            ls: 'LS(1)\n\nNAME\n    ls - list directory contents\n\nSYNOPSIS\n    ls [OPTION]... [FILE]...\n\nDESCRIPTION\n    List information about the FILEs (the current directory by default).\n\nOPTIONS\n    -l     use a long listing format',
            cat: 'CAT(1)\n\nNAME\n    cat - concatenate files and print on the standard output\n\nSYNOPSIS\n    cat [FILE]...\n\nDESCRIPTION\n    Concatenate FILE(s) to standard output.',
            grep: 'GREP(1)\n\nNAME\n    grep - print lines that match patterns\n\nSYNOPSIS\n    grep PATTERN [FILE]...\n\nDESCRIPTION\n    Search for PATTERN in each FILE or standard input.',
            help: 'HELP(1)\n\nNAME\n    help - display information about available commands\n\nSYNOPSIS\n    help [COMMAND]\n\nDESCRIPTION\n    Display helpful information about builtin commands.'
        };

        const page = manPages[command.toLowerCase()];
        if (page) {
            const formattedLines = this.formatMarkdownText(page);
            formattedLines.forEach(line => this.terminal.writeln(line));
        } else {
            this.terminal.writeln(`${this.formatColor(this.theme.red)}No manual entry for ${command}\x1b[0m`);
        }
    }

    displayHelp() {
        const sections = [
            {
                title: 'Available Commands',
                color: this.theme.brightCyan,
                commands: []
            },
            {
                title: 'File Operations',
                color: this.theme.yellow,
                commands: [
                    ['ls', 'List files in current directory'],
                    ['ll', 'Detailed file listing'],
                    ['cat <file>', 'Display file contents'],
                    ['pwd', 'Print working directory'],
                    ['mkdir <dir>', 'Create directory'],
                    ['touch <file>', 'Create empty file'],
                    ['rm <file>', 'Remove file'],
                    ['cp <src> <dst>', 'Copy file'],
                    ['mv <src> <dst>', 'Move file']
                ]
            },
            {
                title: 'System Information',
                color: this.theme.green,
                commands: [
                    ['whoami', 'Show current user'],
                    ['date', 'Show current date/time'],
                    ['ps', 'List running processes'],
                    ['df', 'Show disk space usage'],
                    ['env', 'Show environment variables'],
                    ['uname', 'Show system information']
                ]
            },
            {
                title: 'Search & Documentation',
                color: this.theme.blue,
                commands: [
                    ['grep <pattern>', 'Search for pattern'],
                    ['find <path>', 'Find files'],
                    ['man <command>', 'Show manual page'],
                    ['history', 'View command history']
                ]
            },
            {
                title: 'Terminal Control',
                color: this.theme.magenta,
                commands: [
                    ['clear', 'Clear terminal screen'],
                    ['chat', 'Start chat mode'],
                    ['exit', 'Exit chat mode (when in chat)']
                ]
            }
        ];

        sections.forEach(section => {
            this.terminal.writeln(`${this.formatColor(section.color)}${section.title}\x1b[0m`);
            this.terminal.writeln('');
            section.commands.forEach(([cmd, desc]) => {
                const paddedCmd = cmd.padEnd(16);
                this.terminal.writeln(`${paddedCmd} - ${desc}`);
            });
            this.terminal.writeln('');
        });
    }

    showSystemInfo() {
        this.terminal.writeln('Linux blog-server 5.15.0-1054-aws x86_64 GNU/Linux');
    }

    showProcesses() {
        const processes = [
            'PID TTY          TIME CMD',
            '  1 ?        00:00:00 init',
            '  7 ?        00:00:00 sshd',
            ' 12 ?        00:00:01 node',
            ' 15 pts/0    00:00:00 bash',
            ' 23 pts/0    00:00:00 ps'
        ];
        processes.forEach(line => this.terminal.writeln(line));
    }

    showDiskSpace() {
        const diskInfo = [
            'Filesystem     1K-blocks    Used Available Use% Mounted on',
            '/dev/root       8065444 4187580   3877864  52% /',
            'tmpfs            497428       0    497428   0% /dev/shm'
        ];
        diskInfo.forEach(line => this.terminal.writeln(line));
    }

    showEnvironment() {
        Object.entries(this.env).forEach(([key, value]) => {
            this.terminal.writeln(`${key}=${value}`);
        });
    }

    startGame() {
        this.terminal.writeln(`${this.formatColor(this.theme.magenta)} Starting a simple game... Guess the number between 1 and 10!\x1b[0m`);
        const randomNumber = Math.floor(Math.random() * 10) + 1;
        this.terminal.writeln(`(Psst, the number is ${randomNumber})`);
    }

    showHistory() {
        this.terminal.writeln(`${this.formatColor(this.theme.blue)}Command History:\x1b[0m`);
        this.commandHistory.forEach((cmd, index) => this.terminal.writeln(`${index + 1}. ${cmd}`));
    }

    enterChatMode() {
        this.isChatMode = true;
        this.terminal.writeln('\r\n Entering chat mode (type "exit" to leave)');
        this.terminal.write('\r\n' + TerminalApp.CHAT_PROMPT);
    }

    exitChatMode() {
        this.isChatMode = false;
        this.terminal.writeln('\r\n Exiting chat mode');
        this.terminal.write('\r\n' + TerminalApp.PROMPT);
    }
};
console.log("Command processor initialized:", window.TerminalApp.commandProcessorConfig);
