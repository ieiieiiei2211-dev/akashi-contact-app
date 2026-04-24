import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      include: {
        readStatuses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findSent(userId?: number) {
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
        })
      : null;

    if (userId && !user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.message.findMany({
      where: {
        status: MessageStatus.SENT,
        ...(user
          ? {
              OR: [
                { targetRole: null },
                { targetRole: user.role },
              ],
            }
          : {}),
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
        targetRole: createMessageDto.targetRole ?? null,
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

  async getReadStatus(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        readStatuses: {
          include: {
            user: true,
          },
          orderBy: {
            readAt: 'desc',
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(message.targetRole
          ? {
              role: message.targetRole,
            }
          : {}),
      },
      orderBy: {
        id: 'asc',
      },
    });

    const readUserIds = new Set(
      message.readStatuses.map((readStatus) => readStatus.userId),
    );

    const readUsers = message.readStatuses
      .filter((readStatus) =>
        users.some((user) => user.id === readStatus.userId),
      )
      .map((readStatus) => ({
        id: readStatus.user.id,
        name: readStatus.user.name,
        email: readStatus.user.email,
        role: readStatus.user.role,
        readAt: readStatus.readAt,
      }));

    const unreadUsers = users
      .filter((user) => !readUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }));

    return {
      message: {
        id: message.id,
        title: message.title,
        status: message.status,
        targetRole: message.targetRole,
        createdAt: message.createdAt,
      },
      readCount: readUsers.length,
      unreadCount: unreadUsers.length,
      readUsers,
      unreadUsers,
    };
  }

  remove(id: number) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}