
export interface Exercise {
  question: string;
  options: string[];
  correctAnswer: string;
}

export const exercises: Exercise[] = [
  {
    question: "Which of the following is a synonym for 'happy'?",
    options: ["Sad", "Joyful", "Angry", "Tired"],
    correctAnswer: "Joyful",
  },
  {
    question: "What is the past tense of 'go'?",
    options: ["Gone", "Went", "Goed", "Going"],
    correctAnswer: "Went",
  },
  {
    question: "Choose the correct sentence.",
    options: [
      "He don't like coffee.",
      "He doesn't like coffee.",
      "He not like coffee.",
      "He no like coffee.",
    ],
    correctAnswer: "He doesn't like coffee.",
  },
  {
    question: "What is the plural of 'child'?",
    options: ["Childs", "Childrens", "Children", "Childes"],
    correctAnswer: "Children",
  },
  {
    question: "Which word is a noun?",
    options: ["Run", "Quickly", "Beautiful", "House"],
    correctAnswer: "House",
  },
];
