// Fetch the quizzes from the server
let quizzes = [];

function fetchQuizzes() {
    return fetch('/api/quizzes')
        .then(response => response.json())
        .then(data => {
            quizzes = data;
            displayQuizNames();
        })
        .catch((error) => {
            console.error('Error fetching quizzes:', error);
        });
}

let studyButtonIndex = 0;
let quizIndex = 0;

function displayQuizNames() {
    let quizNamesDiv = document.getElementById("quiz-names-div");

    if (quizzes.length > 0) {
        quizzes.forEach((quiz, index) => {
            // Check that the quiz name is properly set
            if (!quiz.name) {
                quiz.name = "Unnamed Quiz"; // Set a placeholder if name is missing
            }

            // Create a container div for each quiz name and button
            let quizItemDiv = document.createElement("div");
            let quizBtnDiv = document.createElement("div");
            quizItemDiv.classList.add("quiz-item");
            quizBtnDiv.classList.add("quiz-btn-div");

            // Create a paragraph element for each quiz name
            let quizNameText = document.createElement("p");
            quizNameText.textContent = `${quiz.name}`;
            quizNameText.setAttribute("id", `quiz-${quizIndex}`);
            quizIndex++;
            quizItemDiv.appendChild(quizNameText);

            //Create a Study button for each quiz name
            let studyButton = document.createElement("button");
            studyButton.innerHTML = "Study";
            studyButton.classList.add("study-btn");
            studyButton.setAttribute("id", `study-btn-${studyButtonIndex}`);
            studyButtonIndex++;
            studyButton.addEventListener("click", () => studyQuiz(quiz.id));
            quizBtnDiv.appendChild(studyButton);

            // Create a delete button for each quiz name
            let deleteButton = document.createElement("button");
            deleteButton.innerHTML = "Delete";
            deleteButton.classList.add("delete-btn");
            deleteButton.addEventListener("click", () => deleteQuiz(quiz.id, quizItemDiv));
            quizBtnDiv.appendChild(deleteButton);

            // Append the container div to the main quiz names div
            quizItemDiv.appendChild(quizBtnDiv);
            quizNamesDiv.appendChild(quizItemDiv);
        });
    } else {
        quizNamesDiv.textContent = "No quizzes available. Create a Quiz to begin studying!";
    }
}

function studyQuiz(quizId) {
    fetch(`/api/quizzes/${quizId}`)
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('quiz-to-study', JSON.stringify(data));
            window.location.href = "./quiz.html";
        })
        .catch((error) => {
            console.error('Error fetching quiz:', error);
        });
}

function deleteQuiz(quizId, quizItemDiv) {
    fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
    })
    .then(() => {
        // Remove the quiz item from the DOM
        quizItemDiv.remove();
    })
    .catch((error) => {
        console.error('Error deleting quiz:', error);
    });
}

// Fetch and display the quizzes when the page loads
fetchQuizzes();
