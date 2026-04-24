import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('sent')
  findSent() {
    return this.messagesService.findSent();
  }

  @Get(':id/read-status')
  getReadStatus(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.getReadStatus(id);
  }

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Patch(':id/send')
  send(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.send(id);
  }

  @Post(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() readMessageDto: ReadMessageDto,
  ) {
    return this.messagesService.markAsRead(id, readMessageDto.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.remove(id);
  }
}