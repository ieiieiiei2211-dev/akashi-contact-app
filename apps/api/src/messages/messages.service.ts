import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(createMessageDto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        title: createMessageDto.title,
        body: createMessageDto.body,
      },
    });
  }
}