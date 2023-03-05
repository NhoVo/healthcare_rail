/* eslint-disable prettier/prettier */
import { FilterHealthRecordDto } from '@api/doctor/dto';
import { JwtAuthGuard } from '@auth/guards';
import { CurrentUser, Paginate } from '@decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Pagination } from '@types';
import { CholesterolService } from './cholesterol.service';
import { CreateCholesterolDto, FilterCholesterolDto, FilterCholesterolGetMemberDto, UpdateCholesterolDto } from './dto';

@Controller('v1')
@ApiTags('Cholesterol')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CholesterolController {
  constructor(private readonly cholesterolService: CholesterolService) {}

  @Get('cholesterols')
  @HttpCode(HttpStatus.OK)
  findAll(@Query() dto: FilterCholesterolDto, @Paginate() pagination: Pagination) {
    return this.cholesterolService.findAll(dto, pagination);
  }

  @Get('cholesterol/:id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.cholesterolService.findOne(id);
  }

  @Get('get-cholesterol')
  @HttpCode(HttpStatus.OK)
  getCholesterol(@CurrentUser() user, @Query() dto: FilterCholesterolGetMemberDto, @Paginate() pagination: Pagination) {
    return this.cholesterolService.getCholesterol(user['memberId'], dto, pagination);
  }

  @Get('get-cholesterol-doctor')
  @HttpCode(HttpStatus.OK)
  getCholesterolForDoctor(@Query() dto: FilterHealthRecordDto, @Paginate() pagination: Pagination) {
    return this.cholesterolService.getCholesterolForDoctor(dto, pagination);
  }

  @Post('cholesterol')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user, @Body() dto: CreateCholesterolDto) {
    return this.cholesterolService.create(user['memberId'], dto);
  }

  @Patch('cholesterol/:id')
  @HttpCode(HttpStatus.OK)
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateCholesterolDto) {
    return this.cholesterolService.update(user['memberId'], id, dto);
  }

  @Delete('cholesterol/:id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.cholesterolService.delete(user['memberId'], id);
  }
}
