/* ===== QUIZ DATA & LOGIC ===== */

const quizData = {
    thermal: {
        name: 'Thermal Test',
        correctAnswer: '2',
        explanations: {
            '1': { icon: '❌', text: 'Normal response would mean no abnormal pain — but the patient reacted with heightened pain to cold.', correct: false },
            '2': { icon: '✅', text: 'Correct! The patient shows an exaggerated but brief response to cold stimulus, indicating abnormal pulp sensitivity consistent with reversible pulpitis.', correct: true },
            '3': { icon: '❌', text: 'No response would suggest pulp necrosis — but the patient clearly responded to the cold stimulus.', correct: false }
        }
    },
    diagnosis: {
        name: 'Clinical Diagnosis',
        correctAnswer: '1',
        explanations: {
            '1': { icon: '✅', text: 'Correct! Sharp pain lasting only seconds, provoked by cold/sweet, subsiding after stimulus removal, positive EPT, no periapical radiolucency — all point to Acute Reversible Pulpitis.', correct: true },
            '2': { icon: '❌', text: 'Acute Irreversible Pulpitis would present with spontaneous, prolonged pain that lingers after stimulus removal.', correct: false },
            '3': { icon: '❌', text: 'Chronic Reversible Pulpitis is not a standard classification in endodontic diagnosis.', correct: false },
            '4': { icon: '❌', text: 'Pulp Necrosis would show no response to thermal and electric pulp tests.', correct: false }
        }
    },
    q1: {
        name: 'Q1: Immediate Management',
        correctAnswer: 'C',
        explanations: {
            'A': { icon: '❌', text: 'Not indicated — pulp inflammation is reversible and pulp is vital. Root canal is not needed.', correct: false },
            'B': { icon: '❌', text: 'Too aggressive — tooth is restorable and pulp can recover.', correct: false },
            'C': { icon: '✅', text: 'Correct! Remove noxious stimuli — this eliminates the cause and allows the inflamed pulp to heal.', correct: true },
            'D': { icon: '❌', text: 'No infection spread — condition is inflammatory, not systemic. Antibiotics are not indicated.', correct: false }
        }
    },
    q2: {
        name: 'Q2: Systemic Antibiotics',
        correctAnswer: 'C',
        explanations: {
            'A': { icon: '❌', text: 'Not required — pulpitis alone does not justify antibiotics.', correct: false },
            'B': { icon: '❌', text: 'Pain severity is not an indication for antibiotics.', correct: false },
            'C': { icon: '✅', text: 'Correct! Systemic antibiotics are indicated when swelling with systemic signs is present (fever, cellulitis, spreading infection).', correct: true },
            'D': { icon: '❌', text: 'No systemic involvement present in reversible pulpitis.', correct: false }
        }
    },
    q3: {
        name: 'Q3: Intracanal Medicament',
        correctAnswer: 'D',
        explanations: {
            'A': { icon: '❌', text: 'Formocresol is not indicated — it is used in pulpotomy procedures, not reversible pulpitis.', correct: false },
            'B': { icon: '⭕', text: 'Calcium hydroxide is only used if deep caries exposure occurs — as a liner to stimulate reparative dentin. However, RCT is not indicated here.', correct: false },
            'C': { icon: '❌', text: 'Triple antibiotic paste is used in infected/necrotic canals, not in vital reversible pulpitis.', correct: false },
            'D': { icon: '✅', text: 'Correct! No intracanal medicament is needed — RCT is not indicated since the pulp is still vital and can recover.', correct: true }
        }
    }
};

// Score tracking
const scoreTracker = {
    answers: {},
    startTime: null,

    init() {
        this.answers = {};
        this.startTime = Date.now();
    },

    record(quizId, selectedAnswer, isCorrect) {
        this.answers[quizId] = {
            selected: selectedAnswer,
            correct: isCorrect,
            name: quizData[quizId].name
        };
    },

    getResults() {
        const total = Object.keys(this.answers).length;
        const correct = Object.values(this.answers).filter(a => a.correct).length;
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        return {
            total,
            correct,
            incorrect: total - correct,
            score: total > 0 ? Math.round((correct / total) * 100) : 0,
            time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            answers: this.answers
        };
    }
};

// Pain profile tracking
let painProfileSelections = {};

function selectQuizAnswer(btn) {
    const quizId = btn.dataset.quiz;
    const answer = btn.dataset.answer;
    const isCorrect = btn.dataset.correct === 'true';

    // Disable all options
    const allOptions = btn.parentElement.querySelectorAll('.quiz-option');
    allOptions.forEach(opt => {
        opt.classList.add('disabled');
        if (opt.dataset.correct === 'true') {
            opt.classList.add('show-correct');
        }
    });

    // Mark selected
    if (isCorrect) {
        btn.classList.add('selected-correct');
        btn.classList.remove('show-correct');
    } else {
        btn.classList.add('selected-incorrect');
    }

    // Record score
    scoreTracker.record(quizId, answer, isCorrect);

    // Show feedback
    const feedbackEl = document.getElementById(`feedback-${quizId}`);
    const explanation = quizData[quizId].explanations[answer];
    if (feedbackEl) {
        feedbackEl.innerHTML = `
            <span class="feedback-icon">${explanation.icon}</span>
            ${explanation.text}
        `;
        feedbackEl.className = `quiz-feedback ${isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`;
        feedbackEl.classList.remove('hidden');
    }

    // Show continue button
    const continueBtn = document.getElementById(`btn-quiz-${quizId}`);
    if (continueBtn) {
        continueBtn.classList.remove('hidden');
    }
}

function handlePainOptionClick(btn) {
    const row = btn.closest('.options-row');
    const field = row.dataset.field;
    const isMulti = row.classList.contains('multi');

    if (isMulti) {
        // Toggle selection for multi-select
        btn.classList.toggle('selected');
        if (!painProfileSelections[field]) {
            painProfileSelections[field] = [];
        }
        const val = btn.dataset.value;
        const idx = painProfileSelections[field].indexOf(val);
        if (idx > -1) {
            painProfileSelections[field].splice(idx, 1);
        } else {
            painProfileSelections[field].push(val);
        }
    } else {
        // Single select
        row.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        painProfileSelections[field] = btn.dataset.value;
    }

    // Show submit button when all fields have selections
    const allFields = ['status', 'character', 'duration', 'triggers'];
    const allFilled = allFields.every(f => {
        const sel = painProfileSelections[f];
        if (Array.isArray(sel)) return sel.length > 0;
        return !!sel;
    });
    if (allFilled) {
        document.getElementById('btn-pain-submit').classList.remove('hidden');
    }
}

function submitPainProfile() {
    // Check answers and mark correct/incorrect
    const fields = document.querySelectorAll('.pain-field .options-row');
    let allCorrect = true;

    fields.forEach(row => {
        const btns = row.querySelectorAll('.option-btn');
        btns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            const isCorrect = btn.dataset.correct === 'true';
            const isSelected = btn.classList.contains('selected');

            if (isCorrect) {
                btn.classList.add('correct');
                btn.classList.remove('selected');
            }
            if (isSelected && !isCorrect) {
                btn.classList.add('incorrect');
                btn.classList.remove('selected');
                allCorrect = false;
            }
        });
    });

    // Record as single quiz item
    scoreTracker.record('painProfile', painProfileSelections, allCorrect);

    // Move to next scene automatically after a brief delay
    setTimeout(() => {
        nextScene();
    }, 800);
}

function displayStatistics() {
    const results = scoreTracker.getResults();

    document.getElementById('statCorrect').textContent = results.correct;
    document.getElementById('statTotal').textContent = results.total;
    document.getElementById('statScore').textContent = results.score + '%';
    document.getElementById('statTime').textContent = results.time;

    // Breakdown
    const breakdownEl = document.getElementById('statsBreakdown');
    breakdownEl.innerHTML = '';
    Object.entries(results.answers).forEach(([quizId, data]) => {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <span class="q-name">${data.name}</span>
            <span class="q-result ${data.correct ? 'correct' : 'incorrect'}">${data.correct ? '✅ Correct' : '❌ Incorrect'}</span>
        `;
        breakdownEl.appendChild(item);
    });

    // Message
    const msgEl = document.getElementById('statsMessage');
    if (results.score >= 80) {
        msgEl.textContent = '🎉 Excellent! You have a strong understanding of reversible pulpitis diagnosis and management.';
        msgEl.className = 'stats-message excellent';
    } else if (results.score >= 50) {
        msgEl.textContent = '👍 Good job! Review the concepts you missed to strengthen your knowledge.';
        msgEl.className = 'stats-message good';
    } else {
        msgEl.textContent = '📚 Keep studying! Review the case again to improve your understanding.';
        msgEl.className = 'stats-message needs-work';
    }
}
