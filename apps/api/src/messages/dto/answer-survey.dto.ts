import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AnswerSurveyDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @Type(() => Number)
  @IsInt()
  choiceId: number;
}