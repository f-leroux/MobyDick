// Global state
let allPages = [];
let currentPageIndex = 0;
let notesMap = {};

// DOM elements
const pageContent = document.getElementById('pageContent');
const chapterInfo = document.getElementById('chapterInfo');
const pageIndicator = document.getElementById('pageIndicator');
const pageIndicatorTop = document.getElementById('pageIndicatorTop');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const prevBtnTop = document.getElementById('prevPageTop');
const nextBtnTop = document.getElementById('nextPageTop');
const notePopup = document.getElementById('notePopup');
const noteContent = document.getElementById('noteContent');
const closeNoteBtn = document.getElementById('closeNote');
const chapterSelect = document.getElementById('chapterSelect');
const pageJumpInput = document.getElementById('pageJumpInput');
const pageJumpBtn = document.getElementById('pageJumpBtn');

// Load all chapter files
async function loadAllChapters() {
    const chapters = [];
    let errors = 0;
    
    // Load all 136 chapters
    for (let i = 1; i <= 136; i++) {
        const chapterNum = String(i).padStart(3, '0');
        try {
            const response = await fetch(`text_data/Moby${chapterNum}.json`);
            if (response.ok) {
                const data = await response.json();
                chapters.push({
                    number: i,
                    data: data
                });
            } else {
                errors++;
                console.error(`Failed to load chapter ${chapterNum}: ${response.status}`);
            }
        } catch (error) {
            errors++;
            console.error(`Error loading chapter ${chapterNum}:`, error);
            
            // Show helpful message on first error
            if (errors === 1 && error.message && error.message.includes('Failed to fetch')) {
                pageContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <h2 style="color: #8b6f47; margin-bottom: 20px;">⚠️ Server Required</h2>
                        <p style="margin-bottom: 15px;">The files cannot be loaded directly from your file system due to browser security restrictions.</p>
                        <p style="margin-bottom: 15px;"><strong>Please run a local server:</strong></p>
                        <ol style="text-align: left; max-width: 500px; margin: 20px auto; line-height: 1.8;">
                            <li><strong>Using Python:</strong><br><code style="background: #f4d4b1; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">python3 server.py</code></li>
                            <li style="margin-top: 15px;"><strong>Or using npx:</strong><br><code style="background: #f4d4b1; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">npx http-server -p 8000</code></li>
                        </ol>
                        <p style="margin-top: 20px;">Then open: <a href="http://localhost:8000" style="color: #8b6f47; text-decoration: underline;">http://localhost:8000</a></p>
                    </div>
                `;
                throw new Error('CORS error - server required');
            }
        }
    }
    
    return chapters;
}

// Parse text into pages
function parseIntoPages(chapters) {
    const pages = [];
    
    chapters.forEach(chapter => {
        const text = chapter.data.main_text;
        const notes = chapter.data.notes;
        
        // Create notes map for this chapter
        const chapterNotesMap = {};
        notes.forEach(note => {
            chapterNotesMap[note.n] = note.note_html;
        });
        
        // Extract chapter title (first lines before first "page" marker)
        const firstPageMatch = text.match(/^(.*?)page\s+\d+/s);
        const chapterTitle = firstPageMatch ? firstPageMatch[1].trim() : '';
        
        // Split by page markers
        const pageMatches = text.split(/page\s+(\d+)/);
        
        // First element is before any page marker (chapter title), skip it
        for (let i = 1; i < pageMatches.length; i += 2) {
            const pageNum = pageMatches[i];
            const pageText = pageMatches[i + 1] || '';
            
            if (pageText.trim()) {
                pages.push({
                    chapter: chapter.number,
                    chapterTitle: chapterTitle,
                    pageNum: parseInt(pageNum),
                    text: pageText.trim(),
                    notes: chapterNotesMap
                });
            }
        }
    });
    
    return pages;
}

// Convert note markers to clickable spans
function processAnnotations(text, notes) {
    // Replace [^n] with clickable spans
    return text.replace(/\[?\^(\d+)\]?/g, (match, noteNum) => {
        const noteId = parseInt(noteNum);
        if (notes[noteId]) {
            // Find the word before the marker
            const beforeMarker = text.substring(0, text.indexOf(match));
            const words = beforeMarker.trim().split(/\s+/);
            const lastWord = words[words.length - 1] || '';
            
            return `<span class="annotated" data-note="${noteId}">${match}</span>`;
        }
        return match;
    });
}

// Better annotation processing - wrap the word before the marker
function processAnnotationsAdvanced(text, notes) {
    let result = text;
    // Match word (including punctuation) followed by the note marker [^n]
    const markers = [...text.matchAll(/(\S+?)\[\^(\d+)\]/g)];
    
    // Process in reverse to maintain indices
    for (let i = markers.length - 1; i >= 0; i--) {
        const match = markers[i];
        const fullMatch = match[0];
        const word = match[1];
        const noteNum = parseInt(match[2]);
        const index = match.index;
        
        if (notes[noteNum]) {
            const annotated = `<span class="annotated" data-note="${noteNum}">${word}</span>`;
            result = result.substring(0, index) + annotated + result.substring(index + fullMatch.length);
        }
    }
    
    return result;
}

// Display current page
function displayPage() {
    if (allPages.length === 0) return;
    
    const page = allPages[currentPageIndex];
    
    // Update chapter info
    chapterInfo.textContent = page.chapterTitle;
    
    // Update page indicator
    pageIndicator.textContent = `Page ${page.pageNum}`;
    pageIndicatorTop.textContent = `Page ${page.pageNum}`;
    
    // Process and display content
    const processedText = processAnnotationsAdvanced(page.text, page.notes);
    pageContent.innerHTML = processedText;
    
    // Store notes for this page
    notesMap = page.notes;
    
    // Update navigation buttons
    const isFirstPage = currentPageIndex === 0;
    const isLastPage = currentPageIndex === allPages.length - 1;
    
    prevBtn.disabled = isFirstPage;
    nextBtn.disabled = isLastPage;
    prevBtnTop.disabled = isFirstPage;
    nextBtnTop.disabled = isLastPage;
    
    // Add click listeners to annotated spans
    document.querySelectorAll('.annotated').forEach(span => {
        span.addEventListener('click', (e) => showNote(e, span));
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show note popup
function showNote(event, element) {
    const noteId = parseInt(element.dataset.note);
    const noteHtml = notesMap[noteId];
    
    if (noteHtml) {
        noteContent.innerHTML = noteHtml;
        notePopup.classList.add('active');
        
        // Position popup near the clicked element
        const rect = element.getBoundingClientRect();
        const popupWidth = 400;
        const popupHeight = notePopup.offsetHeight || 200;
        
        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + 10;
        
        // Check if popup goes off screen
        if (left + popupWidth > window.innerWidth) {
            left = window.innerWidth - popupWidth - 20;
        }
        
        if (top + popupHeight > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - popupHeight - 10;
        }
        
        // On mobile, center the popup
        if (window.innerWidth <= 768) {
            left = 20;
            top = window.innerHeight / 2 + window.scrollY;
            notePopup.style.transform = 'translateY(-50%)';
        } else {
            notePopup.style.transform = 'none';
        }
        
        notePopup.style.left = `${left}px`;
        notePopup.style.top = `${top}px`;
    }
}

// Hide note popup
function hideNote() {
    notePopup.classList.remove('active');
}

// Navigation
function nextPage() {
    if (currentPageIndex < allPages.length - 1) {
        currentPageIndex++;
        displayPage();
        updateChapterSelect();
    }
}

function prevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        displayPage();
        updateChapterSelect();
    }
}

// Chapter selection
function populateChapterSelect() {
    // Get unique chapters
    const chapters = new Map();
    allPages.forEach(page => {
        if (!chapters.has(page.chapter)) {
            chapters.set(page.chapter, page.chapterTitle);
        }
    });
    
    // Populate select
    chapterSelect.innerHTML = '<option value="">Select a chapter...</option>';
    chapters.forEach((title, num) => {
        const option = document.createElement('option');
        option.value = num;
        option.textContent = `Chapter ${num}: ${title.split('\n')[0]}`;
        chapterSelect.appendChild(option);
    });
}

function goToChapter(chapterNum) {
    const pageIndex = allPages.findIndex(page => page.chapter === parseInt(chapterNum));
    if (pageIndex !== -1) {
        currentPageIndex = pageIndex;
        displayPage();
        updateChapterSelect();
    }
}

function updateChapterSelect() {
    const currentChapter = allPages[currentPageIndex].chapter;
    chapterSelect.value = currentChapter;
}

// Page jump functionality
function jumpToPage(pageNum) {
    const pageIndex = allPages.findIndex(page => page.pageNum === parseInt(pageNum));
    if (pageIndex !== -1) {
        currentPageIndex = pageIndex;
        displayPage();
        updateChapterSelect();
        pageJumpInput.value = '';
        return true;
    }
    return false;
}

// Event listeners
nextBtn.addEventListener('click', nextPage);
prevBtn.addEventListener('click', prevPage);
nextBtnTop.addEventListener('click', nextPage);
prevBtnTop.addEventListener('click', prevPage);
closeNoteBtn.addEventListener('click', hideNote);

chapterSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        goToChapter(e.target.value);
    }
});

pageJumpBtn.addEventListener('click', () => {
    const pageNum = pageJumpInput.value;
    if (pageNum) {
        if (!jumpToPage(pageNum)) {
            alert(`Page ${pageNum} not found. Please enter a valid page number.`);
        }
    }
});

pageJumpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        pageJumpBtn.click();
    }
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (notePopup.classList.contains('active') && 
        !notePopup.contains(e.target) && 
        !e.target.classList.contains('annotated')) {
        hideNote();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === 'Escape') hideNote();
});

// Initialize
async function init() {
    try {
        pageContent.innerHTML = '<div class="loading">Loading Moby Dick...</div>';
        
        const chapters = await loadAllChapters();
        console.log(`Loaded ${chapters.length} chapters`);
        
        allPages = parseIntoPages(chapters);
        console.log(`Parsed ${allPages.length} pages`);
        
        if (allPages.length > 0) {
            populateChapterSelect();
            displayPage();
            updateChapterSelect();
        } else {
            pageContent.innerHTML = '<div class="loading">No pages found</div>';
        }
    } catch (error) {
        console.error('Error initializing:', error);
        pageContent.innerHTML = '<div class="loading">Error loading book</div>';
    }
}

// Start the app
init();

