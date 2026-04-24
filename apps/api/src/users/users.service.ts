import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

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