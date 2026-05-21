document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button');
    let exportButton, importButton, resetButton;
    
    buttons.forEach(btn => {
        if (btn.textContent.includes('Export JSON')) exportButton = btn;
        if (btn.textContent.includes('Import JSON')) importButton = btn;
        if (btn.textContent.includes('Reset Progress')) resetButton = btn;
    });

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            const data = {
                progress: {},
                autosaves: {},
                settings: {
                    currentCourse: localStorage.getItem('current_course_path')
                }
            };
            
            // Collect all passed quizzes
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('passed_quizzes_')) {
                    data.progress[key] = localStorage.getItem(key);
                }
                if (key.startsWith('capstone_autosave_')) {
                    data.autosaves[key] = localStorage.getItem(key);
                }
            }
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `codecanvas-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    if (importButton) {
        importButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        if (data.progress) {
                            Object.keys(data.progress).forEach(key => {
                                localStorage.setItem(key, data.progress[key]);
                            });
                        }
                        
                        if (data.autosaves) {
                            Object.keys(data.autosaves).forEach(key => {
                                localStorage.setItem(key, data.autosaves[key]);
                            });
                        }

                        if (data.settings && data.settings.currentCourse) {
                            localStorage.setItem('current_course_path', data.settings.currentCourse);
                        }
                        
                        alert('Backup restored successfully! Returning to editor...');
                        window.location.href = '../index.html';
                    } catch (err) {
                        alert('Error parsing backup file. Please ensure it is a valid CodeCanvas export.');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('DANGER: This will permanently delete all your quiz progress and saved code. Are you absolutely sure?')) {
                localStorage.clear();
                alert('All data has been wiped. Starting fresh!');
                window.location.href = '../index.html';
            }
        });
    }
});
