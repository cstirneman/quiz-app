let selectedQuizId = JSON.parse(localStorage.getItem('quiz-to-study')).id;

// Fetch the selected quiz by its ID from the server
fetch(`/api/quizzes/${selectedQuizId}`)
    .then(response => response.json())
    .then(selectedQuiz => {
        if (selectedQuiz) {
            const questions = selectedQuiz.questions;
            console.log(questions);
            let score = 0;
            let questionNumberIndex = 0;
            let nextBtn = document.getElementById("next-btn");
            let questionText = document.getElementById("question");
            let quizName = document.getElementById("quiz-name");
            let previouslySelectedButton = null;
            let selectedCorrectness = null;

            function startQuiz() {
                quizName.innerHTML = selectedQuiz.name;
                score = 0;
                questionNumberIndex = 0;
                showQuestion(questionNumberIndex);
                nextBtn.style.display = "block";
                handleNextButton();  // Set up the next button event listener
            };

            function showQuestion(questionNumber) {
                // Clear previous question and answers
                questionText.innerHTML = '';

                // Display the question text
                let questionHeader = document.createElement("h2");
                questionHeader.innerHTML = `${questionNumberIndex + 1}. ${questions[questionNumber].question}`;
                questionText.appendChild(questionHeader);

                // Create and display the answer buttons
                createAnswerButtons(questions[questionNumber].answers);
            }

            function createAnswerButtons(questionAnswers) {
                questionAnswers.forEach((answer, index) => {
                    let buttonElement = document.createElement("button");
                    buttonElement.classList.add("answers");
                    buttonElement.innerHTML = answer.text;
                    buttonElement.addEventListener("click", () => selectedAnswer(buttonElement, answer.correct));
                    questionText.appendChild(buttonElement);
                });
            };

            function selectedAnswer(buttonElement, correctness) {
                if (previouslySelectedButton) {
                    previouslySelectedButton.classList.remove("selectedAnswer");
                }

                selectedCorrectness = correctness;
                
                // Add a visual cue to the selected answer
                buttonElement.classList.add("selectedAnswer");
                previouslySelectedButton = buttonElement;

                // Log correctness for debugging
                console.log(`Selected answer correctness: ${selectedCorrectness}`);
            }

            function handleNextButton() {
                nextBtn.addEventListener("click", () => {
                    // Debugging log to check the selected correctness before incrementing score
                    console.log(`Before incrementing, selectedCorrectness: ${selectedCorrectness}`);
                    
                    // Adjusting the condition to check if selectedCorrectness is 1 (which is true in your case)
                    if (selectedCorrectness == 1) {  // Use == to check both 1 and true
                        score++;
                        console.log(`Score after incrementing: ${score}`);
                    }
            
                    if (questionNumberIndex < questions.length - 1) {
                        questionNumberIndex++;
                        selectedCorrectness = null;  // Reset for the next question
                        showQuestion(questionNumberIndex);
                    } else {
                        questionText.innerHTML = `You got ${score} out of ${questions.length} correct!`;
                        nextBtn.innerHTML = "Finish";
                        nextBtn.removeEventListener("click", handleNextButton);  // Remove old listener
                        nextBtn.addEventListener("click", handleFinishButton);
                    }
                });
            }

            function handleFinishButton() {
                window.location.href = "index.html"; // Navigate back to the main page
            }

            startQuiz();
        } else {
            console.log('Quiz not found');
        }
    })
    .catch(error => {
        console.error('Error fetching the quiz:', error);
    });
