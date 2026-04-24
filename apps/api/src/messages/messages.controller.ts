import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AnswerSurveyDto } from './dto/answer-survey.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('sent')
  findSent(@Query('userId') userId?: string) {
    if (userId === undefined) {
      return this.messagesService.findSent();
    }

    const parsedUserId = Number(userId);

    if (Number.isNaN(parsedUserId)) {
      throw new BadRequestException('userId must be a number');
    }

    return this.messagesService.findSent(parsedUserId);
  }

  @Get(':id/read-status')
  getReadStatus(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.getReadStatus(id);
  }

  @Get(':id/survey-status')
  getSurveyStatus(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.getSurveyStatus(id);
  }

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Patch(':id/send')
  send(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.send(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Post(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() readMessageDto: ReadMessageDto,
  ) {
    return this.messagesService.markAsRead(id, readMessageDto.userId);
  }

  @Post(':id/survey-answer')
  answerSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() answerSurveyDto: AnswerSurveyDto,
  ) {
    return this.messagesService.answerSurvey(id, answerSurveyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.remove(id);
  }
}