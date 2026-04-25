import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
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
          role: createUserDto.role,
          grade: createUserDto.grade ?? null,
          department: createUserDto.department ?? null,
        },
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

  deactivate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  activate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }
}