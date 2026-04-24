import { Injectable } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
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

  findSent() {
    return this.prisma.message.findMany({
      where: {
        status: MessageStatus.SENT,
      },
      include: {
        readStatuses: true,
      },
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

  send(id: number) {
    return this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.SENT,
      },
    });
  }

  markAsRead(messageId: number, userId: number) {
    return this.prisma.readStatus.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
      },
    });
  }

  remove(id: number) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}