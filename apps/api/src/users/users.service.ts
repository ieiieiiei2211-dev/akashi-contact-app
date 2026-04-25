import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  studentNumber: true,
  role: true,
  grade: true,
  department: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          studentNumber: createUserDto.studentNumber ?? null,
          loginPassword: createUserDto.loginPassword ?? null,
          role: createUserDto.role,
          grade: createUserDto.grade ?? null,
          department: createUserDto.department ?? null,
        },
        select: safeUserSelect,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('このメールアドレスはすでに登録されています');
      }

      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          studentNumber:
            updateUserDto.studentNumber === undefined
              ? undefined
              : updateUserDto.studentNumber,
          loginPassword:
            updateUserDto.loginPassword === undefined
              ? undefined
              : updateUserDto.loginPassword,
          role: updateUserDto.role,
          grade:
            updateUserDto.grade === undefined
              ? undefined
              : updateUserDto.grade,
          department:
            updateUserDto.department === undefined
              ? undefined
              : updateUserDto.department,
        },
        select: safeUserSelect,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('このメールアドレスはすでに登録されています');
      }

      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        studentNumber: loginUserDto.studentNumber,
        isActive: true,
      },
    });

    if (!user || user.loginPassword !== loginUserDto.loginPassword) {
      throw new UnauthorizedException('学籍番号またはパスワードが正しくありません');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      studentNumber: user.studentNumber,
      role: user.role,
      grade: user.grade,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  deactivate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: safeUserSelect,
    });
  }

  activate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
      },
      select: safeUserSelect,
    });
  }
}
