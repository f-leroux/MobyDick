# Moby Dick - Annotated Edition Reader

A beautiful, mobile-friendly web reader for Moby Dick with interactive annotations.

## Features

- 📖 Page-by-page reading (actual book pages)
- 📝 Interactive annotations - click highlighted words to see notes
- 🎨 Warm, easy-on-the-eyes color scheme
- 📱 Fully responsive - works great on mobile
- ⌨️ Keyboard navigation (← → arrows, ESC to close notes)

## How to Run

### Option 1: Using Python (Recommended)

1. Make sure you have Python 3 installed
2. Run the server:
   ```bash
   python3 server.py
   ```
3. Open your browser to: http://localhost:8000

### Option 2: Using Node.js

If you have Node.js installed:
```bash
npx http-server -p 8000
```

### Option 3: Using PHP

If you have PHP installed:
```bash
php -S localhost:8000
```

## Navigation

- **Next/Previous buttons** - Navigate between pages
- **Arrow keys** (← →) - Navigate between pages  
- **Click highlighted words** - View annotations
- **ESC key** - Close annotation popup
- **Click outside popup** - Close annotation

## File Structure

```
moby/
├── index.html          # Main HTML file
├── style.css           # Styling
├── script.js           # JavaScript logic
├── server.py           # Python server (recommended)
├── text_data/          # All chapter JSON files
│   ├── Moby001.json
│   ├── Moby002.json
│   └── ...
└── README.md           # This file
```

## Why Do I Need a Server?

Modern browsers block loading local files (like the JSON files) directly from `file://` URLs for security reasons (CORS policy). Running a simple local server solves this issue.

Enjoy reading Moby Dick! 🐋

