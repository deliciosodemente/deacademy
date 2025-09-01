import React, { useState } from 'react';
import { Exercise as ExerciseType } from '../data/exercises';

interface ExerciseProps {
  exercises: ExerciseType[];
}

const Exercise: React.FC<ExerciseProps> = ({ exercises }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent changing the answer

    const correct = answer === exercises[currentQuestionIndex].correctAnswer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  if (currentQuestionIndex >= exercises.length) {
    return (
      <div className="container mt-5 text-center">
        <h2>Quiz Complete!</h2>
        <p className="lead">Your final score is: {score} / {exercises.length}</p>
        <button className="btn btn-primary" onClick={() => {
          setCurrentQuestionIndex(0);
          setScore(0);
          setSelectedAnswer(null);
          setIsCorrect(null);
        }}>
          Restart Quiz
        </button>
      </div>
    );
  }

  const { question, options } = exercises[currentQuestionIndex];

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Question {currentQuestionIndex + 1}</h2>
          <p className="lead">{question}</p>
        </div>
        <div className="card-body">
          <div className="list-group">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={`list-group-item list-group-item-action ${
                  selectedAnswer &&
                  (option === exercises[currentQuestionIndex].correctAnswer
                    ? 'list-group-item-success'
                    : option === selectedAnswer ? 'list-group-item-danger' : '')
                }`}
                disabled={!!selectedAnswer}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {selectedAnswer && (
          <div className="card-footer text-muted">
            {isCorrect ? (
              <p className="text-success">Correct!</p>
            ) : (
              <p className="text-danger">
                Sorry, that's not right. The correct answer is: {exercises[currentQuestionIndex].correctAnswer}
              </p>
            )}
            <button className="btn btn-primary" onClick={handleNextQuestion}>
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercise;
