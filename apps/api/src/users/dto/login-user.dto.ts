import { IsString, Matches, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @Matches(/^[MECA]\d{4}$/, {
    message: '学籍番号は M/E/C/A のいずれか1文字 + 4桁の数字で入力してください',
  })
  studentNumber: string;

  @IsString()
  @MinLength(4)
  loginPassword: string;
}
