import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerSurveyDto } from './dto/answer-survey.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      include: {
        readStatuses: true,
        survey: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
            answers: true,
          },
        },
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
              AND: [
                { OR: [{ targetRole: null }, { targetRole: user.role }] },
                { OR: [{ targetGrade: null }, { targetGrade: user.grade }] },
                {
                  OR: [
                    { targetDepartment: null },
                    { targetDepartment: user.department },
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        readStatuses: true,
        survey: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
            answers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(createMessageDto: CreateMessageDto) {
    const surveyChoices = createMessageDto.surveyChoices
      ?.map((choice) => choice.trim())
      .filter((choice) => choice.length > 0);

    const hasSurvey =
      createMessageDto.surveyQuestion &&
      createMessageDto.surveyQuestion.trim().length > 0;

    if (hasSurvey && (!surveyChoices || surveyChoices.length < 2)) {
      throw new BadRequestException('アンケートには2つ以上の選択肢が必要です');
    }

    return this.prisma.message.create({
      data: {
        title: createMessageDto.title,
        body: createMessageDto.body,
        targetRole: createMessageDto.targetRole ?? null,
        targetGrade: createMessageDto.targetGrade ?? null,
        targetDepartment: createMessageDto.targetDepartment ?? null,
        ...(hasSurvey
          ? {
              survey: {
                create: {
                  question: createMessageDto.surveyQuestion!.trim(),
                  choices: {
                    create: surveyChoices!.map((choice, index) => ({
                      label: choice,
                      order: index,
                    })),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        survey: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status === MessageStatus.SENT) {
      throw new BadRequestException('送信済みの連絡は編集できません');
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        title: updateMessageDto.title,
        body: updateMessageDto.body,
        targetRole:
          updateMessageDto.targetRole === undefined
            ? undefined
            : updateMessageDto.targetRole,
        targetGrade:
          updateMessageDto.targetGrade === undefined
            ? undefined
            : updateMessageDto.targetGrade,
        targetDepartment:
          updateMessageDto.targetDepartment === undefined
            ? undefined
            : updateMessageDto.targetDepartment,
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

  async answerSurvey(messageId: number, answerSurveyDto: AnswerSurveyDto) {
    const survey = await this.prisma.survey.findUnique({
      where: { messageId },
      include: {
        choices: true,
      },
    });

    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }

    const choiceExists = survey.choices.some(
      (choice) => choice.id === answerSurveyDto.choiceId,
    );

    if (!choiceExists) {
      throw new BadRequestException('選択肢が正しくありません');
    }

    return this.prisma.surveyAnswer.upsert({
      where: {
        surveyId_userId: {
          surveyId: survey.id,
          userId: answerSurveyDto.userId,
        },
      },
      update: {
        choiceId: answerSurveyDto.choiceId,
        answeredAt: new Date(),
      },
      create: {
        surveyId: survey.id,
        choiceId: answerSurveyDto.choiceId,
        userId: answerSurveyDto.userId,
      },
      include: {
        choice: true,
      },
    });
  }

  async getSurveyStatus(messageId: number) {
    const survey = await this.prisma.survey.findUnique({
      where: { messageId },
      include: {
        message: true,
        choices: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              include: {
                user: true,
              },
            },
          },
        },
        answers: {
          include: {
            user: true,
            choice: true,
          },
          orderBy: {
            answeredAt: 'desc',
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }

    const targetUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(survey.message.targetRole ? { role: survey.message.targetRole } : {}),
        ...(survey.message.targetGrade ? { grade: survey.message.targetGrade } : {}),
        ...(survey.message.targetDepartment
          ? { department: survey.message.targetDepartment }
          : {}),
      },
      orderBy: {
        id: 'asc',
      },
    });

    const answeredUserIds = new Set(
      survey.answers.map((answer) => answer.userId),
    );

    const unansweredUsers = targetUsers
      .filter((user) => !answeredUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        department: user.department,
      }));

    const summary = survey.choices.map((choice) => ({
      choiceId: choice.id,
      label: choice.label,
      count: choice.answers.length,
      users: choice.answers.map((answer) => ({
        id: answer.user.id,
        name: answer.user.name,
        email: answer.user.email,
        role: answer.user.role,
        grade: answer.user.grade,
        department: answer.user.department,
        answeredAt: answer.answeredAt,
      })),
    }));

    return {
      message: {
        id: survey.message.id,
        title: survey.message.title,
        status: survey.message.status,
        targetRole: survey.message.targetRole,
        targetGrade: survey.message.targetGrade,
        targetDepartment: survey.message.targetDepartment,
      },
      survey: {
        id: survey.id,
        question: survey.question,
      },
      targetCount: targetUsers.length,
      totalAnswerCount: survey.answers.length,
      unansweredCount: unansweredUsers.length,
      summary,
      unansweredUsers,
    };
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
        ...(message.targetRole ? { role: message.targetRole } : {}),
        ...(message.targetGrade ? { grade: message.targetGrade } : {}),
        ...(message.targetDepartment
          ? { department: message.targetDepartment }
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
        grade: readStatus.user.grade,
        department: readStatus.user.department,
        readAt: readStatus.readAt,
      }));

    const unreadUsers = users
      .filter((user) => !readUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        department: user.department,
      }));

    return {
      message: {
        id: message.id,
        title: message.title,
        status: message.status,
        targetRole: message.targetRole,
        targetGrade: message.targetGrade,
        targetDepartment: message.targetDepartment,
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