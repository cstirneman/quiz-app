// Fetch the current quiz from the server
let currentQuiz = null;

function fetchCurrentQuiz() {
    return fetch('/api/quizzes/current')
        .then(response => response.json())
        .then(data => {
            currentQuiz = data;
            console.log(currentQuiz);  // Inspect the currentQuiz object
            if (!currentQuiz.name) {
                console.error('Quiz name is missing from the server response.');
                alert('Quiz name is missing, please provide a name before saving.');
                return;  // Stop if the quiz name is missing
            }
            displayQuiz();
        })
        .catch((error) => {
            console.error('Error fetching current quiz:', error);
        });
}

function displayQuiz() {
    let quizOverviewDiv = document.getElementById("quiz-overview-div");
    let saveQuizButton = document.getElementById("save-quiz-btn");

    // Attach event listener here to avoid multiple bindings
    saveQuizButton.removeEventListener("click", saveQuiz);  // Remove previous listener if any
    saveQuizButton.addEventListener("click", saveQuiz);

    quizOverviewDiv.innerHTML = ""; // Clear previous quiz data

    currentQuiz.questions.forEach((questionObj, index) => {
        // Create a paragraph element for the question
        let questionText = document.createElement("p");
        let editQuestionButton = document.createElement("button");

        questionText.textContent = `Question ${index + 1}: ${questionObj.question}`;
        questionText.classList.add("questionText");

        editQuestionButton.innerHTML = "Edit";
        editQuestionButton.classList.add("edit-btn");
        editQuestionButton.addEventListener("click", () => editQuiz(index));

        quizOverviewDiv.appendChild(questionText);
        questionText.appendChild(editQuestionButton);
        
        // Create a list to display the answers
        let answerList = document.createElement("ul");

        questionObj.answers.forEach((answerObj) => {
            let answerItem = document.createElement("li");
            answerItem.textContent = `${answerObj.text} ${answerObj.correct ? "(Correct)" : ""}`;
            answerList.appendChild(answerItem);
        });

        quizOverviewDiv.appendChild(answerList);
    });
}

function editQuiz(index) {
    // Get the question to be edited
    let questionObj = currentQuiz.questions[index];

    // Create the form elements
    let modal = document.createElement("div");
    modal.classList.add("modal");

    // Add the question input first
    let questionInput = document.createElement("textarea");
    questionInput.value = questionObj.question;
    questionInput.classList.add("edit-textarea");
    modal.appendChild(questionInput);

    let answerInputs = [];
    questionObj.answers.forEach((answerObj, i) => {
        let answerInput = document.createElement("input");
        answerInput.type = "text";
        answerInput.value = answerObj.text;
        answerInput.classList.add("edit-input");

        let correctCheckbox = document.createElement("input");
        correctCheckbox.type = "checkbox";
        correctCheckbox.checked = answerObj.correct;
        correctCheckbox.classList.add("edit-checkbox");

        answerInputs.push({ answerInput, correctCheckbox });

        modal.appendChild(correctCheckbox); // Add checkbox before input
        modal.appendChild(answerInput);
    });

    // Confirm button to save the changes
    let confirmButton = document.createElement("button");
    confirmButton.innerHTML = "Confirm";
    confirmButton.classList.add("confirm-btn");

    confirmButton.addEventListener("click", () => {
        // Save the edited question and answers back to the array
        questionObj.question = questionInput.value;
        questionObj.answers = answerInputs.map(inputPair => ({
            text: inputPair.answerInput.value,
            correct: inputPair.correctCheckbox.checked
        }));

        if (!currentQuiz.id) {
            console.error('Quiz ID is missing, cannot update quiz.');
            return;
        }

        if (!currentQuiz.name) {
            console.error('Quiz name is missing, cannot update quiz.');
            return;
        }

        // Update the quiz on the server
        fetch(`/api/quizzes/${currentQuiz.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentQuiz),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update quiz');
            }
            return response.json();
        })
        .then(data => {
            console.log('Quiz updated:', data);
            // Remove modal and refresh the display
            modal.remove();
            refreshDisplay();
        })
        .catch((error) => {
            console.error('Error updating quiz:', error);
        });
    });

    // Append the confirm button to the modal
    modal.appendChild(confirmButton);

    // Append the modal to the body
    document.body.appendChild(modal);
}

function refreshDisplay() {
    let quizOverviewDiv = document.getElementById("quiz-overview-div");
    quizOverviewDiv.innerHTML = ""; // Clear existing content
    displayQuiz(); // Re-render the quiz overview
}

function saveQuiz(event) {
    event.preventDefault(); // Prevent any default action

    if (!currentQuiz.id) {
        console.error('Quiz ID is missing, cannot save quiz.');
        return;
    }

    if (!currentQuiz.name || currentQuiz.name === 'Default Quiz Name') {
        console.error('Quiz name is missing, cannot save quiz.');
        alert('Quiz name is missing, please provide a name before saving.');
        return;
    }

    fetch(`/api/quizzes/${currentQuiz.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentQuiz),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update quiz');
        }
        return response.json();
    })
    .then(data => {
        console.log('Quiz saved:', data);
        // Log to confirm execution reaches here
        console.log('Redirecting to study page...');
        window.location.href = "./study.html";  // This should work now
    })
    .catch((error) => {
        console.error('Error saving quiz:', error);
    });
}

// Attach the event listener when the page loads
document.addEventListener("DOMContentLoaded", function() {
    fetchCurrentQuiz();
    let saveQuizButton = document.getElementById("save-quiz-btn");
    saveQuizButton.addEventListener("click", saveQuiz);
});
