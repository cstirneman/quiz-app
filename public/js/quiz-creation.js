const questions = [];
let questionTextArea = document.getElementById("question");
let addAnswerButton = document.getElementById("add-answer-btn");
let nextQuestionButton = document.getElementById("next-question-btn");
let finishButton = document.getElementById("finish-btn");
let creationDiv = document.getElementById("answer-creation");
let quizNameTextField = document.getElementById("quiz-name-text-field");
let helpInstructionsButton = document.getElementById("help-instructions-btn");

nextQuestionButton.addEventListener("click", handleNextQuestion);
addAnswerButton.addEventListener("click", addAnswer);
finishButton.addEventListener("click", handleFinishButton);
helpInstructionsButton.addEventListener("click", displayHelpInstructions);

function handleNextQuestion() {
    let answerTextFields = document.querySelectorAll(".answer-text-field");
    let answersFilled = true;
    let checkBoxElement = document.querySelectorAll(".checkbox");
    let checkBoxChecked = false;
    let answers = [];

    answerTextFields.forEach((answerField, index) => {
        if (answerField.value === "") {
            answersFilled = false;
        } else {
            answers.push({
                text: answerField.value,
                correct: checkBoxElement[index].checked
            });
        }
    });

    checkBoxElement.forEach(checkbox => {
        if (checkbox.checked) {
            checkBoxChecked = true;
        }
    });

    if (questionTextArea.value === "" || quizNameTextField.value === "" || !answersFilled || !checkBoxChecked) {
        alert("Please complete the quiz name, question, and answer fields, and ensure at least one checkbox is checked.");
        return;
    }

    addQuestiontoArray(answers);

    questionTextArea.value = "";
    answerTextFields.forEach(answerField => answerField.value = "");
    checkBoxElement.forEach(checkbox => checkbox.checked = false);
}

function addQuestiontoArray(answers) {
    const questionObject = {
        question: questionTextArea.value,
        answers: answers
    };

    questions.push(questionObject);
}

function addAnswer() {
    let h3Element = document.querySelector("h3");
    h3Element.style.display = "block";

    // Create textfield
    let createAnswerField = document.createElement("input");
    createAnswerField.type = "text";
    createAnswerField.setAttribute("id", "answer");
    createAnswerField.setAttribute("placeholder", "Add your answer here");
    createAnswerField.classList.add("answer-text-field");
    creationDiv.appendChild(createAnswerField);

    // Create checkbox
    let createCheckbox = document.createElement("input");
    createCheckbox.type = "checkbox";
    createCheckbox.classList.add("checkbox");
    creationDiv.appendChild(createCheckbox);

    // Create delete button
    let createDeleteButton = document.createElement("button");
    createDeleteButton.innerHTML = "delete";
    createDeleteButton.classList.add("delete-button");
    creationDiv.appendChild(createDeleteButton);
    createDeleteButton.addEventListener("click", deleteAnswer);
}

function deleteAnswer(e) {
    const button = e.target;
    const checkbox = e.target.previousElementSibling;
    const answerField = checkbox.previousElementSibling;
    button.remove();
    checkbox.remove();
    answerField.remove();
}

function displayHelpInstructions(){
    helpInstructionsButton.style.display = "none";
    let instructions = document.getElementById("instructions-list");
    let closeInstructionsBtn = document.getElementById("close-instructions-btn")
    instructions.style.display = "block";
    closeInstructionsBtn.addEventListener("click", closeInstructions);
}

function closeInstructions(){
    let instructions = document.getElementById("instructions-list");
    instructions.style.display = "none";
    helpInstructionsButton.style.display = "block";
}

function handleFinishButton() {
    let answerTextFields = document.querySelectorAll(".answer-text-field");
    let answersFilled = true;
    let checkBoxElement = document.querySelectorAll(".checkbox");
    let checkBoxChecked = false;

    // Check if all answer fields are filled
    answerTextFields.forEach((answerField) => {
        if (answerField.value === "") {
            answersFilled = false;
        }
    });

    // Check if at least one checkbox is checked
    checkBoxElement.forEach(checkbox => {
        if (checkbox.checked) {
            checkBoxChecked = true;
        }
    });

    // If the question, answers, and checkboxes are not empty, validate and save the current question
    if (questionTextArea.value !== "" || !answersFilled || !checkBoxChecked) {
        handleNextQuestion();
        if (questionTextArea.value !== "" || quizNameTextField.value === "" || !answersFilled || !checkBoxChecked) {
            return; // Stop further execution if the fields are not correctly filled
        }
    }

    // Ensure that the quiz name is not empty before proceeding
    if (quizNameTextField.value === "") {
        alert("Please enter a name for your quiz before finishing.");
        return;
    }

    // Create a new quiz object
    let newQuiz = {
        name: quizNameTextField.value,
        questions: questions
    };

    // Save the new quiz to the database via API call
    fetch('/api/quizzes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuiz),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Quiz saved:', data);
        window.location.href = "./quiz-overview.html";
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

