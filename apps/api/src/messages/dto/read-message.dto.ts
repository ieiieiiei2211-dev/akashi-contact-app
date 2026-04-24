import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ReadMessageDto {
  @Type(() => Number)
  @IsInt()
  userId: number;
}