document.addEventListener('DOMContentLoaded', () => {
    // DOM Element selections
    const lessonNav = document.getElementById('lesson-nav');
    const lessonTitle = document.getElementById('lesson-title');
    const lessonBody = document.getElementById('lesson-body');
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');

    // State management
    let lessons = [];
    let activeLessonIndex = -1;

    /**
     * Fetches lesson data from the JSON file.
     */
    async function fetchLessons() {
        try {
            const response = await fetch('./assets/data/lessons.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            lessons = await response.json();
            populateNav();
            // Load the first *actual* lesson by default
            const firstLessonIndex = lessons.findIndex(lesson => !lesson.isHeader);
            if (firstLessonIndex !== -1) {
                loadLesson(firstLessonIndex);
            }
        } catch (error) {
            console.error("Could not fetch lessons:", error);
            lessonBody.innerHTML = "<p>Sorry, we couldn't load the lessons. Please try refreshing the page or check the file path.</p>";
        }
    }

    /**
     * Populates the navigation sidebar with lesson links and headers.
     */
    function populateNav() {
        lessonNav.innerHTML = ''; // Clear loading animation/placeholders
        lessons.forEach((lesson, index) => {
            if (lesson.isHeader) {
                const header = document.createElement('h3');
                header.textContent = lesson.title;
                header.className = 'px-4 pt-4 pb-1 text-sm font-bold text-slate-500 uppercase tracking-wider';
                lessonNav.appendChild(header);
            } else {
                const button = document.createElement('button');
                button.textContent = lesson.title;
                // Add index as a data attribute for easy reference
                button.dataset.index = index;
                // Base classes
                button.className = 'w-full text-left px-4 py-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors duration-150';
                button.onclick = () => loadLesson(index);
                lessonNav.appendChild(button);
            }
        });
    }

    /**
     * Loads a specific lesson into the content and editor areas.
     * @param {number} index - The index of the lesson to load.
     */
    function loadLesson(index) {
        if (index < 0 || index >= lessons.length || lessons[index].isHeader) return;

        activeLessonIndex = index;
        const lesson = lessons[index];

        lessonTitle.textContent = lesson.title;
        lessonBody.innerHTML = lesson.content; // Use innerHTML to render HTML tags in content
        editor.value = lesson.initialCode;

        updatePreview();
        updateNavStyles();
    }

    /**
     * Updates the active styles for the navigation links.
     */
    function updateNavStyles() {
        Array.from(lessonNav.children).forEach(el => {
            // Only style the buttons, not the headers
            if (el.tagName === 'BUTTON') {
                const buttonIndex = parseInt(el.dataset.index, 10);
                if (buttonIndex === activeLessonIndex) {
                    // Active classes
                    el.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
                    el.classList.remove('text-slate-700', 'hover:bg-slate-100');
                } else {
                    // Inactive classes
                    el.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-semibold');
                    el.classList.add('text-slate-700', 'hover:bg-slate-100');
                }
            }
        });
    }

    /**
     * Updates the preview iframe with the content from the editor.
     */
    function updatePreview() {
        const previewDoc = preview.contentDocument || preview.contentWindow.document;
        previewDoc.open();
        // Basic HTML structure with a style reset and dark mode text color for better viewing
        previewDoc.write(`
            <!DOCTYPE html>
            <html style="font-family: sans-serif;">
            <head>
                <style>
                    body { color: #333; }
                    @media (prefers-color-scheme: dark) {
                        body { background-color: #1e293b; color: #e2e8f0; }
                    }
                </style>
            </head>
            <body>
                ${editor.value}
            </body>
            </html>
        `);
        previewDoc.close();
    }

    // Event listener for the editor to update the preview on input
    editor.addEventListener('input', updatePreview);

    // Initial load
    fetchLessons();
});
