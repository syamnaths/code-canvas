document.addEventListener('DOMContentLoaded', () => {
    // DOM Element selections
    const lessonNav = document.getElementById('lesson-nav');
    const lessonTitle = document.getElementById('lesson-title');
    const lessonBody = document.getElementById('lesson-body');
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const peekSolutionBtn = document.getElementById('peek-solution-btn');
    const solutionModal = document.getElementById('solution-modal');
    const solutionDisplay = document.getElementById('solution-display');
    const modalTimer = document.getElementById('modal-timer');
    const closeSolutionBtn = document.getElementById('close-solution-btn');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    // State management
    let lessons = [];
    let activeLessonIndex = -1;
    let timerInterval = null;

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
                button.dataset.index = index;
                button.className = 'w-full text-left px-4 py-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors duration-150';
                button.onclick = () => loadLesson(index);
                lessonNav.appendChild(button);
            }
        });
    }

    /**
     * Loads a specific lesson into the content and editor areas.
     */
    function loadLesson(index) {
        if (index < 0 || index >= lessons.length || lessons[index].isHeader) return;

        activeLessonIndex = index;
        const lesson = lessons[index];

        lessonTitle.textContent = lesson.title;
        lessonBody.innerHTML = lesson.content;

        // Autosave load for Capstone Project (Lesson 30)
        if (lesson.title.includes("30.")) {
            const savedData = localStorage.getItem('capstone_autosave');
            editor.value = savedData ? savedData : lesson.initialCode;
        } else {
            editor.value = lesson.initialCode;
        }

        // Solution Peek Button Visibility
        if (lesson.solutionCode) {
            peekSolutionBtn.classList.remove('hidden');
        } else {
            peekSolutionBtn.classList.add('hidden');
        }

        updatePreview();
        updateNavStyles();

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            closeSidebar();
        }
    }

    /**
     * Sidebar Mobile Toggle Logic
     */
    function openSidebar() {
        sidebar.classList.remove('-translate-x-full');
        sidebarBackdrop.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        sidebarBackdrop.classList.add('hidden');
    }

    /**
     * Handles the solution peek logic.
     */
    function showSolution() {
        const lesson = lessons[activeLessonIndex];
        if (!lesson || !lesson.solutionCode) return;

        solutionDisplay.textContent = lesson.solutionCode;
        solutionModal.classList.remove('hidden');

        let timeLeft = 60;
        modalTimer.textContent = `${timeLeft}s`;

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            timeLeft--;
            modalTimer.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                closeSolution();
            }
        }, 1000);
    }

    function closeSolution() {
        solutionModal.classList.add('hidden');
        if (timerInterval) clearInterval(timerInterval);
    }

    // Event Listeners
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    peekSolutionBtn.addEventListener('click', showSolution);
    closeSolutionBtn.addEventListener('click', closeSolution);

    // Anti-copy prevention for solution modal
    solutionModal.addEventListener('contextmenu', e => e.preventDefault());
    solutionModal.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'u')) {
            e.preventDefault();
        }
    });

    /**
     * Updates the active styles for the navigation links.
     */
    function updateNavStyles() {
        Array.from(lessonNav.children).forEach(el => {
            if (el.tagName === 'BUTTON') {
                const buttonIndex = parseInt(el.dataset.index, 10);
                if (buttonIndex === activeLessonIndex) {
                    el.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
                    el.classList.remove('text-slate-700', 'hover:bg-slate-100');
                } else {
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
        // Autosave for Capstone Project (Lesson 30)
        const lesson = lessons[activeLessonIndex];
        if (lesson && lesson.title.includes("30.")) {
            localStorage.setItem('capstone_autosave', editor.value);
        }

        const previewDoc = preview.contentDocument || preview.contentWindow.document;
        previewDoc.open();
        previewDoc.write(`
            <!DOCTYPE html>
            <html style="font-family: sans-serif;">
            <head>
                <style>
                    body { color: #333; margin: 0; padding: 20px; }
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

    editor.addEventListener('input', updatePreview);
    fetchLessons();
});
