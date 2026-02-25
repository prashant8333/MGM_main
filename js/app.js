/* ===== MAIN APP CONTROLLER ===== */

let currentScene = 0;
const totalScenes = 19;

// Dialogue scripts
const dialogues = {
    '1a': "Doctor, this tooth has been torturing me all night!",
    '1b': "Okay, please have a seat first.",
    '3a': "A little pain was already there since evening, but I ignored it as I had to go on a date...",
    '3b': "...where I had an ice cream 🍦 — and after having just a bite, the pain became intolerable!",
    '5a': "Okay, Don't worry just tell me have you felt pain on this tooth before or have you under- gone any treatment of this tooth before.",
    '5b': "No, I have not undergone any such treatment.",
    '5c': "I'm telling u, it's horrible !! It all started with a bite of ice cream. It was sharp. But If I recall correctly it subsided after few seconds but I did not dare to have another bite...",
    '5d': "Hmmm...ok",
    '7a': "Cool! now we are all set to examine the oral cavity"
};

// Calculate dynamic wait time based on dialogue length
function getDialogueWaitTime(text) {
    const words = text.split(' ').length;
    // Base 500ms + 180ms per word. Min 1.2s, Max 3.2s
    return Math.max(1200, Math.min(3200, 500 + words * 180));
}

// Typing effect
function typeText(elementId, text, speed = 35) {
    return new Promise(resolve => {
        const el = document.getElementById(elementId);
        if (!el) { resolve(); return; }
        el.innerHTML = '';
        let i = 0;
        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        el.appendChild(cursor);

        function typeChar() {
            if (i < text.length) {
                const char = text[i];
                el.insertBefore(document.createTextNode(char), cursor);
                i++;
                setTimeout(typeChar, speed);
            } else {
                cursor.remove();
                resolve();
            }
        }
        typeChar();
    });
}

// Show element by removing hidden class
function showElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.style.display = 'block';
    }
}

// Hide element by adding hidden class
function hideElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('hidden');
        el.style.display = 'none';
    }
}

// Scene tracking to prevent overlapping async logic
let sceneTrackingId = 0;

// Scene-specific enter logic
async function onSceneEnter(sceneIndex) {
    const executionId = ++sceneTrackingId;

    updateProgress();
    updateNavButtons();

    // Utility to check if this execution is still valid
    const isValid = () => executionId === sceneTrackingId && currentScene === sceneIndex;

    switch (sceneIndex) {
        case 0:
            // Intro — nothing special
            break;

        case 1:
            // Patient enters, dialogue
            hideElement('bubble-1a');
            hideElement('dialogue-1b-container');
            hideElement('btn-scene-1');

            await wait(300); // Wait for scene transit
            if (!isValid()) return;

            showElement('bubble-1a');
            await typeText('dialogue-1a', dialogues['1a'], 30);
            await wait(getDialogueWaitTime(dialogues['1a']));
            if (!isValid()) return;
            hideElement('bubble-1a');

            showElement('dialogue-1b-container');
            await typeText('dialogue-1b', dialogues['1b'], 30);
            await wait(getDialogueWaitTime(dialogues['1b']));
            if (!isValid()) return;
            hideElement('dialogue-1b-container');

            await wait(400);
            if (!isValid()) return;
            showElement('btn-scene-1');
            break;

        case 2:
            // Loading scene — auto-advance
            await wait(2500);
            nextScene();
            break;

        case 3:
            // Patient backstory
            hideElement('bubble-3a');
            hideElement('dialogue-3b-container');
            hideElement('btn-scene-3');

            await wait(400);
            if (!isValid()) return;

            showElement('bubble-3a');
            await typeText('dialogue-3a', dialogues['3a']);
            await wait(getDialogueWaitTime(dialogues['3a']));
            if (!isValid()) return;
            hideElement('bubble-3a');

            showElement('dialogue-3b-container');
            await typeText('dialogue-3b', dialogues['3b']);
            await wait(getDialogueWaitTime(dialogues['3b']));
            if (!isValid()) return;
            hideElement('dialogue-3b-container');

            await wait(400);
            if (!isValid()) return;
            showElement('btn-scene-3');
            break;

        case 4:
            // Chief complaint card — just appears
            break;

        case 5:
            // Doctor asks history
            // Initially hide all just in case
            hideElement('dialogue-5a-container');
            hideElement('dialogue-5b-container');
            hideElement('dialogue-5c-container');
            hideElement('dialogue-5d-container');
            hideElement('btn-scene-5');

            await wait(400);
            if (!isValid()) return;

            showElement('dialogue-5a-container');
            await typeText('dialogue-5a', dialogues['5a']);
            await wait(getDialogueWaitTime(dialogues['5a']));
            if (!isValid()) return;
            hideElement('dialogue-5a-container');

            showElement('dialogue-5b-container');
            await typeText('dialogue-5b', dialogues['5b']);
            await wait(getDialogueWaitTime(dialogues['5b']));
            if (!isValid()) return;
            hideElement('dialogue-5b-container');

            showElement('dialogue-5c-container');
            await typeText('dialogue-5c', dialogues['5c'], 30);
            await wait(getDialogueWaitTime(dialogues['5c']));
            if (!isValid()) return;
            hideElement('dialogue-5c-container');

            showElement('dialogue-5d-container');
            await typeText('dialogue-5d', dialogues['5d']);
            await wait(getDialogueWaitTime(dialogues['5d']));
            if (!isValid()) return;
            hideElement('dialogue-5d-container');

            await wait(400);
            if (!isValid()) return;
            showElement('btn-scene-5');
            break;

        case 6:
            // Pain profile quiz — set up click handlers
            scoreTracker.init();
            document.querySelectorAll('.pain-field .option-btn').forEach(btn => {
                btn.addEventListener('click', () => handlePainOptionClick(btn));
            });
            break;

        case 7:
            // Doctor ready to examine
            hideElement('dialogue-7a-container');
            hideElement('btn-scene-7');

            await wait(400);
            if (!isValid()) return;

            showElement('dialogue-7a-container');
            await typeText('dialogue-7a', dialogues['7a']);
            await wait(getDialogueWaitTime(dialogues['7a']));
            if (!isValid()) return;
            hideElement('dialogue-7a-container');

            await wait(500);
            if (!isValid()) return;
            showElement('btn-scene-7');
            break;

        case 8:
            // 3D Model scene — initialize Three.js
            setTimeout(() => initTeethModel(), 200);
            break;

        case 9:
            // Probe & mirror — animations handled by CSS
            break;

        case 10:
            // Percussion test — show reaction after delay
            await wait(1500);
            document.getElementById('percussionReaction')?.classList.add('active');
            break;

        case 11:
            // Thermal test — quiz
            break;

        case 12:
            // EPT — animate meters
            await wait(500);
            animateEPT();
            break;

        case 13:
            // Radiograph
            break;

        case 14:
            // Clinical diagnosis quiz
            break;

        case 15:
        case 16:
        case 17:
            // Management quizzes
            break;

        case 18:
            // Statistics
            displayStatistics();
            break;
    }
}

// EPT animation
function animateEPT() {
    const meterNormal = document.getElementById('meterNormal');
    const meterAffected = document.getElementById('meterAffected');
    const valNormal = document.getElementById('eptNormalValue');
    const valAffected = document.getElementById('eptAffectedValue');

    // Animate normal tooth first
    setTimeout(() => {
        if (meterNormal) meterNormal.style.width = '75%';
        animateValue(valNormal, 0, 18.7, 2000, 'μA');
    }, 500);

    // Then affected tooth
    setTimeout(() => {
        if (meterAffected) meterAffected.style.width = '60%';
        animateValue(valAffected, 0, 15, 2000, 'μA');
    }, 3000);

    // Show result
    setTimeout(() => {
        document.getElementById('eptResult')?.classList.remove('hidden');
        showElement('btn-scene-12');
    }, 5500);
}

function animateValue(el, start, end, duration, suffix) {
    if (!el) return;
    const startTime = Date.now();
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * easeOutQuart(progress);
        el.textContent = current.toFixed(1) + ' ' + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    update();
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// Scene navigation
function nextScene() {
    if (currentScene >= totalScenes - 1) return;
    goToScene(currentScene + 1);
}

function prevScene() {
    if (currentScene <= 0) return;
    goToScene(currentScene - 1, true);
}

function goToScene(index, reverse = false) {
    if (index < 0 || index >= totalScenes) return;

    const oldScene = document.getElementById(`scene-${currentScene}`);
    const newScene = document.getElementById(`scene-${index}`);

    if (!oldScene || !newScene) return;

    // Exit old scene
    oldScene.classList.remove('active');
    oldScene.classList.add(reverse ? '' : 'exit-left');

    setTimeout(() => {
        oldScene.classList.remove('exit-left');
    }, 500);

    // Enter new scene
    if (reverse) {
        newScene.style.transform = 'translateX(-40px)';
        newScene.offsetHeight; // force reflow
    }
    newScene.classList.add('active');

    currentScene = index;
    onSceneEnter(index);
}

function updateProgress() {
    const progress = ((currentScene) / (totalScenes - 1)) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentSceneNum').textContent = currentScene + 1;
}

function updateNavButtons() {
    document.getElementById('btnPrev').disabled = currentScene === 0;
    // Hide nav next on scenes that have their own next button
    const scenesWithOwnButton = [0, 1, 3, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18];
    // Just control prev/next arrow buttons
}

function restartCase() {
    // Reset all scenes
    currentScene = 0;

    // Remove all active/exit classes
    document.querySelectorAll('.scene').forEach(s => {
        s.classList.remove('active', 'exit-left');
    });

    // Reset quiz states
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('disabled', 'selected-correct', 'selected-incorrect', 'show-correct');
    });
    document.querySelectorAll('.quiz-feedback').forEach(fb => {
        fb.classList.add('hidden');
    });
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.style.pointerEvents = '';
    });

    // Reset pain profile
    painProfileSelections = {};

    // Reset hidden elements
    ['btn-scene-1', 'btn-scene-3', 'btn-scene-5', 'btn-scene-7',
        'btn-pain-submit', 'btn-scene-12',
        'btn-quiz-thermal', 'btn-quiz-diagnosis', 'btn-quiz-q1', 'btn-quiz-q2', 'btn-quiz-q3',
        'dialogue-1b-container', 'bubble-1a', 'bubble-3a', 'dialogue-3b-container',
        'dialogue-5a-container', 'dialogue-5b-container', 'dialogue-5c-container', 'dialogue-5d-container',
        'dialogue-7a-container'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Reset EPT
    const meterNormal = document.getElementById('meterNormal');
    const meterAffected = document.getElementById('meterAffected');
    if (meterNormal) meterNormal.style.width = '0%';
    if (meterAffected) meterAffected.style.width = '0%';
    document.getElementById('eptNormalValue').textContent = '0 μA';
    document.getElementById('eptAffectedValue').textContent = '0 μA';
    document.getElementById('eptResult')?.classList.add('hidden');

    // Reset percussion
    document.getElementById('percussionReaction')?.classList.remove('active');

    // Activate scene 0
    document.getElementById('scene-0').classList.add('active');
    updateProgress();
    updateNavButtons();
}

// Utility
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    updateNavButtons();
});
