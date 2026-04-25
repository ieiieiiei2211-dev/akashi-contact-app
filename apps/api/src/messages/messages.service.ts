import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as webpush from 'web-push';
import { MessageStatus, NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerSurveyDto } from './dto/answer-survey.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

type SavePushSubscriptionInput = {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}


  async savePushSubscription(input: SavePushSubscriptionInput) {
    if (!input.userId || Number.isNaN(input.userId)) {
      throw new BadRequestException('userId is required');
    }

    if (!input.endpoint || !input.p256dh || !input.auth) {
      throw new BadRequestException('push subscription is incomplete');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.pushSubscription.upsert({
      where: {
        endpoint: input.endpoint,
      },
      update: {
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
        isActive: true,
      },
      create: {
        userId: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      },
    });
  }

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
        attachmentName: createMessageDto.attachmentName ?? null,
        attachmentUrl: createMessageDto.attachmentUrl ?? null,
        targetRole: createMessageDto.targetRole ?? null,
        targetGrade: createMessageDto.targetGrade ?? null,
        targetDepartment: createMessageDto.targetDepartment ?? null,
        targetGroupLabel: createMessageDto.targetGroupLabel ?? null,
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

  async send(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status === MessageStatus.SENT) {
      return message;
    }

    const targetUsers = await this.prisma.user.findMany({
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

    const sentMessage = await this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.SENT,
      },
    });

    if (targetUsers.length > 0) {
      const notificationLogs: Prisma.NotificationLogCreateManyInput[] = [];

      for (const user of targetUsers) {
        const hasEmail = user.email.trim().length > 0;

        if (!hasEmail) {
          notificationLogs.push({
            messageId: message.id,
            userId: user.id,
            type: NotificationType.EMAIL,
            status: NotificationStatus.SKIPPED,
            errorMessage: 'メールアドレスが登録されていません',
          });
          continue;
        }

        try {
          await this.sendEmailNotification({
            to: user.email,
            name: user.name,
            messageId: message.id,
            title: message.title,
            body: message.body,
          });

          notificationLogs.push({
            messageId: message.id,
            userId: user.id,
            type: NotificationType.EMAIL,
            status: NotificationStatus.SENT,
            errorMessage: null,
          });
        } catch (err) {
          notificationLogs.push({
            messageId: message.id,
            userId: user.id,
            type: NotificationType.EMAIL,
            status: NotificationStatus.FAILED,
            errorMessage:
              err instanceof Error ? err.message : 'メール送信に失敗しました',
          });
        }
      }

      await this.prisma.notificationLog.createMany({
        data: notificationLogs,
      });

      const pushNotificationLogs = await this.createPushNotificationLogs({
        messageId: message.id,
        title: message.title,
        body: message.body,
        targetUsers,
      });

      if (pushNotificationLogs.length > 0) {
        await this.prisma.notificationLog.createMany({
          data: pushNotificationLogs,
        });
      }
    }

    return sentMessage;
  }
  private async createPushNotificationLogs(params: {
    messageId: number;
    title: string;
    body: string;
    targetUsers: { id: number; name: string }[];
  }): Promise<Prisma.NotificationLogCreateManyInput[]> {
    const logs: Prisma.NotificationLogCreateManyInput[] = [];
    const targetUserIds = params.targetUsers.map((user) => user.id);

    if (targetUserIds.length === 0) {
      return logs;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        isActive: true,
        userId: {
          in: targetUserIds,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const subscriptionsByUserId = new Map<number, typeof subscriptions>();

    for (const subscription of subscriptions) {
      const current = subscriptionsByUserId.get(subscription.userId) ?? [];
      current.push(subscription);
      subscriptionsByUserId.set(subscription.userId, current);
    }

    for (const user of params.targetUsers) {
      const userSubscriptions = subscriptionsByUserId.get(user.id) ?? [];

      if (userSubscriptions.length === 0) {
        logs.push({
          messageId: params.messageId,
          userId: user.id,
          type: NotificationType.PUSH,
          status: NotificationStatus.SKIPPED,
          errorMessage: 'プッシュ通知が有効化されていません',
        });
        continue;
      }

      const results = await Promise.allSettled(
        userSubscriptions.map(async (subscription) => {
          try {
            await this.sendPushNotificationToSubscription(subscription, {
              title: params.title,
              body: params.body,
            });
          } catch (err) {
            const statusCode = this.getPushErrorStatusCode(err);

            if (statusCode === 404 || statusCode === 410) {
              await this.prisma.pushSubscription.update({
                where: {
                  id: subscription.id,
                },
                data: {
                  isActive: false,
                },
              });
            }

            throw err;
          }
        }),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;

      if (successCount > 0) {
        logs.push({
          messageId: params.messageId,
          userId: user.id,
          type: NotificationType.PUSH,
          status: NotificationStatus.SENT,
          errorMessage: null,
        });
      } else {
        const firstError = results.find(
          (result): result is PromiseRejectedResult => result.status === 'rejected',
        );

        logs.push({
          messageId: params.messageId,
          userId: user.id,
          type: NotificationType.PUSH,
          status: NotificationStatus.FAILED,
          errorMessage:
            firstError?.reason instanceof Error
              ? firstError.reason.message
              : 'プッシュ通知の送信に失敗しました',
        });
      }
    }

    return logs;
  }

  private async sendPushNotificationToSubscription(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    params: {
      title: string;
      body: string;
    },
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      throw new Error('VAPID keys are not configured.');
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:test@example.com',
      publicKey,
      privateKey,
    );

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173';

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: '明石高専連絡ポータル',
        body: params.title,
        url: appUrl,
      }),
    );
  }

  private getPushErrorStatusCode(err: unknown) {
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const value = (err as { statusCode?: unknown }).statusCode;
      return typeof value === 'number' ? value : null;
    }

    return null;
  }


  getNotificationLogs(messageId: number) {
  return this.prisma.notificationLog.findMany({
    where: {
      messageId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          studentNumber: true,
          role: true,
          grade: true,
          department: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
  });
}

  private async sendEmailNotification(params: {
    to: string;
    name: string;
    messageId: number;
    title: string;
    body: string;
  }) {
    const smtpHost = process.env.SMTP_HOST;

    if (!smtpHost) {
      console.log(
        [
          '[mail:mock]',
          `to=${params.to}`,
          `name=${params.name}`,
          `messageId=${params.messageId}`,
          `title=${params.title}`,
        ].join(' '),
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173';

    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER ?? 'no-reply@example.com',
      to: params.to,
      subject: `【明石高専連絡ポータル】${params.title}`,
      text: [
        `${params.name} 様`,
        '',
        '明石高専連絡ポータルに新しい連絡が届いています。',
        '',
        `件名：${params.title}`,
        '',
        params.body.slice(0, 300),
        '',
        `確認はこちら：${appUrl}`,
      ].join('\n'),
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