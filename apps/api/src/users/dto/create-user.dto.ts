import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[MECA]\d{4}$/, {
    message: '学籍番号は M/E/C/A のいずれか1文字 + 4桁の数字で入力してください',
  })
  studentNumber?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  grade?: number;

  @IsOptional()
  @IsString()
  department?: string;
}