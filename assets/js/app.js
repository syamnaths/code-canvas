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
    const courseSelect = document.getElementById('course-select');
    const editorLabel = document.getElementById('editor-label');
    const editorCopyBadge = document.getElementById('editor-copy-badge');
    const nextLessonBtn = document.getElementById('next-lesson-btn');
    const consoleOutput = document.getElementById('console-output');
    const clearConsoleBtn = document.getElementById('clear-console-btn');
    const runCodeBtn = document.getElementById('run-code-btn');
    const checkWorkBtn = document.getElementById('check-work-btn');
    const loadStarterBtn = document.getElementById('load-starter-btn');
    const taskChecklist = document.getElementById('task-checklist');
    const taskList = document.getElementById('task-list');

    // State management
    let lessons = [];
    let activeLessonIndex = -1;
    let timerInterval = null;
    let currentCoursePath = localStorage.getItem('current_course_path') || './assets/data/lessons.json';
    let passedQuizzes = JSON.parse(localStorage.getItem(`passed_quizzes_${currentCoursePath}`) || '{}');
    let isLocked = true;
    let isEditorDirty = false;

    // Helper to toggle Check My Work button state
    function setCheckWorkEnabled(enabled) {
        if (!checkWorkBtn) return;
        if (enabled) {
            checkWorkBtn.disabled = false;
            checkWorkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            checkWorkBtn.disabled = true;
            checkWorkBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // Clear Console
    if (clearConsoleBtn) {
        clearConsoleBtn.addEventListener('click', () => {
            consoleOutput.innerHTML = '';
        });
    }

    // Load Starter Code Button
    if (loadStarterBtn) {
        loadStarterBtn.addEventListener('click', () => {
            const starterTemplate = `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>

</body>
</html>`;
            editor.value = starterTemplate;
            updatePreview();
            loadStarterBtn.classList.add('hidden');
        });
    }

    // Listen for console logs or test results from iframe
    window.addEventListener('message', (event) => {
        if (event.data.type === 'console') {
            const entry = document.createElement('div');
            entry.className = `console-entry ${event.data.level}`;
            entry.textContent = `> ${event.data.message}`;
            consoleOutput.appendChild(entry);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        } else if (event.data.type === 'testResults') {
            const { passed, message } = event.data;
            consoleOutput.innerHTML = `<div class="${passed ? 'text-emerald-400' : 'text-red-400'} font-bold mb-2">${message}</div>`;
            if (passed) {
                nextLessonBtn.classList.remove('hidden');
            }
        }
    });

    // Run Code Button
    if (runCodeBtn) {
        runCodeBtn.addEventListener('click', () => {
            consoleOutput.innerHTML = '';
            updatePreview();
        });
    }

    // Check My Work Button
    if (checkWorkBtn) {
        checkWorkBtn.addEventListener('click', () => {
            consoleOutput.innerHTML = '<div class="text-indigo-400 font-bold mb-2">Running Tests...</div>';
            updatePreview();
            
            setTimeout(() => {
                const previewWin = preview.contentWindow;
                previewWin.postMessage({ type: 'runTests' }, '*');
            }, 500);
        });
    }

    // Editor Input Listener
    editor.addEventListener('input', () => {
        isEditorDirty = true;
        setCheckWorkEnabled(true);
        if (!currentCoursePath.includes('javascript')) {
            updatePreview();
        }
    });

    // Initialize course select value and labels
    if (courseSelect) {
        courseSelect.value = currentCoursePath;
        updateEditorLabel();
        courseSelect.addEventListener('change', (e) => {
            currentCoursePath = e.target.value;
            localStorage.setItem('current_course_path', currentCoursePath);
            passedQuizzes = JSON.parse(localStorage.getItem(`passed_quizzes_${currentCoursePath}`) || '{}');
            updateEditorLabel();
            fetchLessons();
        });
    }

    function updateEditorLabel() {
        if (!editorLabel) return;
        if (currentCoursePath.includes('javascript')) {
            editorLabel.textContent = 'JavaScript & HTML Editor';
        } else {
            editorLabel.textContent = 'HTML & CSS Editor';
        }
    }

    /**
     * Fetches lesson data from the JSON file.
     */
    async function fetchLessons() {
        try {
            const response = await fetch(currentCoursePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            lessons = await response.json();
            populateNav();
            
            // Load the last active lesson for THIS course or the first actual lesson
            let lastIndex = parseInt(localStorage.getItem(`last_lesson_index_${currentCoursePath}`) || '-1');
            
            let indexToLoad = lastIndex;
            if (indexToLoad === -1 || indexToLoad >= lessons.length || lessons[indexToLoad].isHeader) {
                indexToLoad = lessons.findIndex(lesson => !lesson.isHeader);
            }
            
            if (indexToLoad !== -1) {
                loadLesson(indexToLoad);
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
                header.className = 'px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest';
                lessonNav.appendChild(header);
            } else {
                const button = document.createElement('button');
                const isPassed = passedQuizzes[index];
                button.innerHTML = `
                    <span class="flex items-center justify-between gap-2">
                        <span class="truncate">${lesson.title}</span>
                        ${isPassed ? '<span class="text-green-500 font-bold">✓</span>' : ''}
                    </span>
                `;
                button.dataset.index = index;
                button.className = 'w-full text-left px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100 transition-colors duration-150';
                button.onclick = () => loadLesson(index);
                lessonNav.appendChild(button);
            }
        });
    }

    /**
     * Populates the task checklist based on evaluation rules.
     */
    function populateTaskChecklist(lesson) {
        taskList.innerHTML = '';
        taskChecklist.classList.add('hidden');
        
        if (lesson.evaluationRules && lesson.evaluationRules.requiredTags) {
            taskChecklist.classList.remove('hidden');
            taskList.innerHTML = lesson.evaluationRules.requiredTags
                .map(tag => `<li class="flex items-center gap-1">• Must include <code>&lt;${tag}&gt;</code> tag</li>`)
                .join('');
        }
    }

    /**
     * Loads a specific lesson into the content and editor areas.
     */
    function loadLesson(index) {
        if (index < 0 || index >= lessons.length || lessons[index].isHeader) return;

        activeLessonIndex = index;
        localStorage.setItem(`last_lesson_index_${currentCoursePath}`, index);
        const lesson = lessons[index];

        lessonTitle.textContent = lesson.title;
        populateTaskChecklist(lesson);
        
        // Reset "Check My Work" state
        isEditorDirty = false;
        setCheckWorkEnabled(false);
        nextLessonBtn.classList.add('hidden');
        editor.value = '';
        if (loadStarterBtn) loadStarterBtn.classList.remove('hidden');
        
        // Show/Hide Run button based on curriculum
        if (currentCoursePath.includes('javascript')) {
            runCodeBtn.classList.remove('hidden');
            checkWorkBtn.classList.remove('hidden');
            editor.removeEventListener('input', updatePreview);
        } else {
            runCodeBtn.classList.add('hidden');
            checkWorkBtn.classList.remove('hidden');
            editor.addEventListener('input', updatePreview);
        }
        
        // Add "Start Quiz" button to lesson content if a quiz exists
        let contentHtml = lesson.content;
        const score = passedQuizzes[index] || 0;
        const isPassed = score >= 70;

        if (lesson.quiz && lesson.quiz.length > 0) {
            const heading = isPassed ? 'Knowledge Mastered!' : 'Ready to test your knowledge?';
            const description = isPassed 
                ? `You've already passed this quiz with a score of ${score.toFixed(0)}%. You can retake it to improve your score or just for practice.`
                : 'Complete the topic quiz to unlock the interactive practice ground (70%+) and full editor features (90%+).';
            const btnText = isPassed ? 'Retake Topic Quiz' : 'Start Topic Quiz';

            contentHtml += `
                <div class="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center text-center">
                    <div class="w-12 h-12 ${isPassed ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'} rounded-full flex items-center justify-center mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h4 class="text-lg font-bold text-slate-900 mb-2">${heading}</h4>
                    <p class="text-slate-500 text-sm mb-6 max-w-sm">${description}</p>
                    <button id="start-quiz-btn" class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                        <span>${btnText}</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </div>
            `;
        }
        lessonBody.innerHTML = contentHtml;

        // Ensure we are in "Reading" mode initially
        showQuizView(false);

        // Reset Quiz Container
        renderQuiz(index);

        // Add listener for Start Quiz button
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => showQuizView(true));
        }

        // Playground Lock Logic
        if (score >= 70 || !lesson.quiz || lesson.quiz.length === 0) {
            unlockPlayground(score);
        } else {
            lockPlayground();
        }

        // Solution Peek Button Visibility
        if (lesson.solutionCode) {
            peekSolutionBtn.classList.remove('hidden');
        } else {
            peekSolutionBtn.classList.add('hidden');
        }

        updatePreview();
        updateNavStyles();
        updateNextButtonVisibility();

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            closeSidebar();
        }
    }

    /**
     * Toggles visibility between lesson reading and quiz
     */
    function showQuizView(show) {
        const lessonContent = document.getElementById('lesson-content');
        const quizContainer = document.getElementById('quiz-container');
        const playgroundContainer = document.getElementById('playground-container');
        
        if (show) {
            lessonContent.classList.add('hidden');
            quizContainer.classList.remove('hidden');
            if (playgroundContainer) playgroundContainer.style.setProperty('display', 'none', 'important');
            // Scroll to top of quiz
            quizContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            lessonContent.classList.remove('hidden');
            quizContainer.classList.add('hidden');
            // Re-evaluate playground visibility based on pass status
            const lesson = lessons[activeLessonIndex];
            const score = passedQuizzes[activeLessonIndex] || 0;
            if (score >= 70 || !lesson.quiz || lesson.quiz.length === 0) {
                unlockPlayground(score);
            } else {
                lockPlayground();
            }
            // Scroll to top of lesson
            lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Escapes HTML special characters to prevent rendering as tags.
     */
    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    /**
     * Renders the quiz for the current lesson.
     */
    function renderQuiz(index) {
        const lesson = lessons[index];
        const quizContainer = document.getElementById('quiz-container');
        
        if (!lesson.quiz || lesson.quiz.length === 0) {
            quizContainer.classList.add('hidden');
            return;
        }

        quizContainer.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <button id="back-to-reading-btn" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Back to Reading">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h3 class="text-xl font-bold text-slate-900">Topic Quiz</h3>
                    </div>
                    <span class="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider">${lesson.quiz.length} Questions</span>
                </div>
                
                <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-xs text-amber-800 leading-relaxed">Reading material is hidden during the quiz to ensure a fair assessment. You can return to the lesson at any time, but your current answers will not be saved.</p>
                </div>

                <div id="quiz-questions" class="space-y-8">
                    ${lesson.quiz.map((q, qIndex) => `
                        <div class="space-y-4">
                            <p class="font-semibold text-slate-800">${qIndex + 1}. ${escapeHTML(q.question)}</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                ${q.options.map((option, oIndex) => `
                                    <label class="relative flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group">
                                        <input type="radio" name="question-${qIndex}" value="${oIndex}" class="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500">
                                        <span class="ml-3 text-sm text-slate-600 group-hover:text-slate-900 font-medium">${escapeHTML(option)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p id="quiz-feedback" class="text-sm font-bold"></p>
                    <button id="submit-quiz-btn" class="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 transition-all">
                        Submit Answers
                    </button>
                </div>
            </div>
        `;

        document.getElementById('submit-quiz-btn').addEventListener('click', handleQuizSubmission);
        document.getElementById('back-to-reading-btn').addEventListener('click', () => showQuizView(false));
    }

    /**
     * Handles quiz submission and validation.
     */
    function handleQuizSubmission() {
        const lesson = lessons[activeLessonIndex];
        const questions = lesson.quiz;
        let score = 0;
        const feedback = document.getElementById('quiz-feedback');
        const submitBtn = document.getElementById('submit-quiz-btn');

        questions.forEach((q, qIndex) => {
            const selected = document.querySelector(`input[name="question-${qIndex}"]:checked`);
            if (selected && parseInt(selected.value) === q.answer) {
                score++;
            }
        });

        const percentage = (score / questions.length) * 100;
        
        if (percentage >= 70) {
            let message = `Excellent! Score: ${percentage.toFixed(0)}%. Practice Ground Unlocked!`;
            if (percentage < 90) {
                message += " Reach 90% to unlock Copy & Paste.";
            }
            feedback.textContent = message;
            feedback.className = 'text-sm font-medium text-green-600';
            
            // Save the highest score achieved
            const previousScore = passedQuizzes[activeLessonIndex] || 0;
            if (percentage > previousScore) {
                passedQuizzes[activeLessonIndex] = percentage;
                localStorage.setItem(`passed_quizzes_${currentCoursePath}`, JSON.stringify(passedQuizzes));
            }

            unlockPlayground(percentage);
            populateNav(); // Update checkmarks
            updateNavStyles();
        } else {
            feedback.textContent = `Keep studying! Score: ${percentage.toFixed(0)}%. You need 70% to unlock the playground.`;
            feedback.className = 'text-sm font-medium text-red-600';
        }
    }

    /**
     * UI Helper to unlock/lock the playground.
     */
    function unlockPlayground(score = 100) {
        isLocked = false;
        const playgroundContainer = document.getElementById('playground-container');
        const overlay = document.getElementById('playground-lock-overlay');
        
        if (playgroundContainer) {
            playgroundContainer.classList.remove('hidden');
            playgroundContainer.style.setProperty('display', 'block', 'important');
        }
        if (overlay) overlay.classList.add('hidden');
        
        if (score >= 90) {
            isLocked = false;
            if (editorCopyBadge) {
                editorCopyBadge.textContent = '🔓 Copy Mode Unlocked';
                editorCopyBadge.classList.remove('bg-slate-100', 'text-slate-500');
                editorCopyBadge.classList.add('bg-green-100', 'text-green-600');
            }
        } else {
            isLocked = true;
            if (editorCopyBadge) {
                editorCopyBadge.textContent = '🔒 Copy Mode Locked (90% required)';
                editorCopyBadge.classList.add('bg-slate-100', 'text-slate-500');
                editorCopyBadge.classList.remove('bg-green-100', 'text-green-600');
            }
        }
    }

    function lockPlayground() {
        isLocked = true;
        const playgroundContainer = document.getElementById('playground-container');
        const overlay = document.getElementById('playground-lock-overlay');
        
        if (playgroundContainer) {
            playgroundContainer.classList.add('hidden');
            playgroundContainer.style.setProperty('display', 'none', 'important');
        }
        if (overlay) overlay.classList.remove('hidden');
        
        if (editorCopyBadge) {
            editorCopyBadge.textContent = '🔒 Copy Mode Locked (90% required)';
            editorCopyBadge.classList.add('bg-slate-100', 'text-slate-500');
            editorCopyBadge.classList.remove('bg-green-100', 'text-green-600');
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

    /**
     * Navigates to the next available lesson.
     */
    function loadNextLesson() {
        const nextIndex = lessons.findIndex((lesson, i) => i > activeLessonIndex && !lesson.isHeader);
        if (nextIndex !== -1) {
            loadLesson(nextIndex);
            // Smooth scroll back to top of content
            document.getElementById('content-area').scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Toggles visibility of the Next Lesson button based on availability.
     */
    function updateNextButtonVisibility() {
        if (!nextLessonBtn) return;
        const nextIndex = lessons.findIndex((lesson, i) => i > activeLessonIndex && !lesson.isHeader);
        if (nextIndex !== -1) {
            nextLessonBtn.classList.remove('hidden');
        } else {
            nextLessonBtn.classList.add('hidden');
        }
    }

    // Event Listeners
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    peekSolutionBtn.addEventListener('click', showSolution);
    closeSolutionBtn.addEventListener('click', closeSolution);
    if (nextLessonBtn) {
        nextLessonBtn.addEventListener('click', loadNextLesson);
    }

    // Anti-copy prevention for solution modal
    solutionModal.addEventListener('contextmenu', e => e.preventDefault());
    solutionModal.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'u')) {
            e.preventDefault();
        }
    });

    // Anti-copy prevention for editor when locked
    const preventCopy = (e) => {
        if (isLocked) {
            e.preventDefault();
            alert('Pass the topic quiz to unlock Copy & Paste in the editor.');
        }
    };

    editor.addEventListener('copy', preventCopy);
    editor.addEventListener('cut', preventCopy);
    editor.addEventListener('contextmenu', (e) => {
        if (isLocked) e.preventDefault();
    });

    /**
     * Updates the active styles for the navigation links.
     */
    function updateNavStyles() {
        Array.from(lessonNav.children).forEach(el => {
            if (el.tagName === 'BUTTON') {
                const buttonIndex = parseInt(el.dataset.index, 10);
                if (buttonIndex === activeLessonIndex) {
                    el.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold', 'ring-1', 'ring-indigo-200');
                    el.classList.remove('text-slate-600', 'hover:bg-slate-100');
                } else {
                    el.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-bold', 'ring-1', 'ring-indigo-200');
                    el.classList.add('text-slate-600', 'hover:bg-slate-100');
                }
            }
        });
    }

    /**
     * Updates the preview iframe with the content from the editor.
     */
    function updatePreview() {
        const lesson = lessons[activeLessonIndex];
        if (lesson && lesson.isCapstone) {
            localStorage.setItem(`capstone_autosave_${currentCoursePath}`, editor.value);
        }

        const previewDoc = preview.contentDocument || preview.contentWindow.document;
        previewDoc.open();
        
        const content = editor.value;
        const evaluationRules = lesson.evaluationRules || null;
        
        const consoleCaptureScript = `
            <script>
                (function() {
                    window.evaluationRules = ${JSON.stringify(evaluationRules)};
                    window.onerror = function(msg, url, line) {
                        window.parent.postMessage({ type: 'console', level: 'error', message: 'Error: ' + msg }, '*');
                    };
                    const capture = (level, args) => {
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: level,
                                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                            }, '*');
                        } catch(e) {}
                    };
                    console.log = (...args) => capture('log', args);
                    console.error = (...args) => capture('error', args);
                    console.warn = (...args) => capture('warn', args);

                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'runTests') {
                            const rules = window.evaluationRules;
                            if (!rules || !rules.requiredTags) {
                                window.parent.postMessage({ type: 'testResults', passed: true, message: '✅ Code structure valid.' }, '*');
                                return;
                            }
                            
                            let passed = true;
                            let msg = '✅ All tests passed!';
                            
                            try {
                                if (rules.requiredTags) {
                                    const editorContent = window.parent.document.getElementById('editor').value;
                                    rules.requiredTags.forEach(tag => {
                                        const openTagCount = (editorContent.match(new RegExp('<' + tag + '[^>]*>', 'gi')) || []).length;
                                        const closeTagCount = (editorContent.match(new RegExp('<\/' + tag + '>', 'gi')) || []).length;
                                        
                                        if (openTagCount === 0) {
                                            passed = false;
                                            msg = '❌ Missing tag: <' + tag + '>';
                                        } else if (openTagCount !== closeTagCount) {
                                            passed = false;
                                            msg = '❌ Tag <' + tag + '> is not properly closed. Found ' + openTagCount + ' opening and ' + closeTagCount + ' closing tags.';
                                        }
                                    });
                                }
                            } catch(err) {
                                passed = false;
                                msg = '❌ Error during evaluation: ' + err.message;
                            }
                            
                            window.parent.postMessage({ type: 'testResults', passed: passed, message: msg }, '*');
                        }
                    });
                })();
            </script>
        `;
        
        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                ${consoleCaptureScript}
                <style>
                    body { color: #333; margin: 0; padding: 20px; font-family: sans-serif; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
        
        previewDoc.open();
        previewDoc.write(fullContent);
        previewDoc.close();
    }

    editor.addEventListener('input', updatePreview);

    fetchLessons();
});
