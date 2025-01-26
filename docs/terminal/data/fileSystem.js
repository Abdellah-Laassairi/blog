// fileSystem.js
window.TerminalApp.fileSystem = {
    'about.md': `# About Abdellah Laassairi

Data Scientist | Machine Learning Engineer
🌍 Based in France

Focused on creating impactful AI solutions and reducing CO₂ emissions through sustainable technology.

## Skills
- Machine Learning & Deep Learning
- Data Analysis & Visualization
- Python, TensorFlow, PyTorch
- MLOps & Cloud Computing
- Sustainable AI Development`,

    'projects.md': `# Projects

1. Sustainable Construction AI
   - Machine learning optimization for sustainable building materials
   - Energy efficiency prediction models
   - Carbon footprint reduction algorithms
   - Tech stack: Python, TensorFlow, AWS

2. Carbon Footprint Optimization
   - Real-time emissions monitoring
   - Predictive maintenance for energy systems
   - Green energy transition planning
   - Tech stack: Python, Scikit-learn, Docker

3. Materials Intelligence Platform
   - Advanced materials database
   - Property prediction models
   - Sustainability metrics analysis
   - Tech stack: Python, PyTorch, MongoDB`,

    'contact.md': `# Contact Information

- 📧 Email: laassairi.abdellah@gmail.com
- 🌐 GitHub: @Abdellah-Laassairi
- 💼 LinkedIn: in/abdellah.laassairi
- 🌍 Location: France

Available for collaboration on sustainable tech projects.`,

    'help.md': `# Available Commands

## File Operations
ls                - List files in current directory
ll                - Detailed file listing
cat <file>        - Display file contents
pwd               - Print working directory
mkdir <dir>       - Create directory
touch <file>      - Create empty file
rm <file>         - Remove file
cp <src> <dst>    - Copy file
mv <src> <dst>    - Move file

## System Information
whoami            - Show current user
date              - Show current date/time
ps                - List running processes
df                - Show disk space usage
env               - Show environment variables
uname             - Show system information

## Search & Documentation
grep <pattern>    - Search for pattern
find <path>       - Find files
man <command>     - Show manual page
history           - View command history

## Terminal Control
clear             - Clear terminal screen
chat              - Start chat mode
exit              - Exit chat mode (when in chat)`,

    'README.md': `# Abdellah Laassairi's Portfolio

Welcome to my terminal-based portfolio! This interactive terminal allows you to explore my background, projects, and contact information using Unix-like commands.

## Quick Start
- Type 'help' to see available commands
- Use 'cat about.md' to learn about me
- Use 'cat projects.md' to see my projects
- Use 'cat contact.md' for contact information

Feel free to explore and reach out!`
};

// Initialize file system with timestamps and permissions
Object.keys(window.TerminalApp.fileSystem).forEach(filename => {
    window.TerminalApp.fileSystem[filename] = {
        content: window.TerminalApp.fileSystem[filename],
        permissions: '-rw-r--r--',
        owner: 'user',
        group: 'user',
        size: window.TerminalApp.fileSystem[filename].length,
        modified: new Date('2025-01-14T09:27:21Z')
    };
});

console.log("File system initialized:", window.TerminalApp.fileSystem);
