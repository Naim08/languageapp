import React from 'react';
import { AnyExerciseQuestion, ExerciseAnswer } from '@/types/exercise';
import { BaseExercise } from './BaseExercise';
import { MultipleChoiceExercise } from './MultipleChoiceExercise';
import { FillInBlankExercise } from './FillInBlankExercise';

interface ExerciseProps {
  question: AnyExerciseQuestion;
  onAnswer: (answer: ExerciseAnswer) => void;
}

export const Exercise: React.FC<ExerciseProps> = ({ question, onAnswer }) => {
  return (
    <BaseExercise question={question} onAnswer={onAnswer}>
      {(() => {
        // BaseExercise will inject props via React.cloneElement
        switch (question.type) {
          case 'multiple_choice':
            return <MultipleChoiceExercise />;
          
          case 'fill_in_blank':
            return <FillInBlankExercise />;
          
          case 'translation':
            // For now, treat translation like fill-in-blank
            return <FillInBlankExercise />;
          
          case 'pronunciation':
            // TODO: Implement pronunciation component with speech recognition
            return <FillInBlankExercise />;
          
          default:
            throw new Error(`Unsupported exercise type: ${(question as any).type}`);
        }
      })()}
    </BaseExercise>
  );
};