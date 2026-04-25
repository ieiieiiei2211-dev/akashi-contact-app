import { UserRole } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsEnum(UserRole)
  targetRole?: UserRole;

  @IsOptional()
  @IsInt()
  targetGrade?: number;

  @IsOptional()
  @IsString()
  targetDepartment?: string;

  @IsOptional()
  @IsString()
  targetGroupLabel?: string;

  @IsOptional()
  @IsString()
  surveyQuestion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surveyChoices?: string[];
}
