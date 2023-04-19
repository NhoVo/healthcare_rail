/* eslint-disable prettier/prettier */
import { JwtAuthGuard } from '@auth/guards';
import { CurrentUser, Paginate } from '@decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Pagination } from '@types';
import { FilterPatientsDto, RatingDto, SelectDoctorDto, UpdatePatientDto } from './dto';
import { PatientService } from './patient.service';

@Controller('v1')
@ApiTags('Patient')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('patients')
  @HttpCode(HttpStatus.OK)
  findAll(@Query() dto: FilterPatientsDto, @Paginate() pagination: Pagination) {
    return this.patientService.findAll(dto, pagination);
  }

  @Get('patient/rating')
  @HttpCode(HttpStatus.OK)
  getRating(@CurrentUser() user, @Query() dto: SelectDoctorDto) {
    return this.patientService.getRating(user['memberId'], dto);
  }

  @Get('patient/:id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Patch('patient')
  @HttpCode(HttpStatus.OK)
  update(@CurrentUser() user, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(user['memberId'], dto);
  }

  @Put('patient/select')
  @HttpCode(HttpStatus.OK)
  selectDoctor(@CurrentUser() user, @Body() dto: SelectDoctorDto) {
    return this.patientService.selectDoctor(user['memberId'], dto);
  }

  @Put('patient/revoke')
  @HttpCode(HttpStatus.OK)
  revokeDoctor(@CurrentUser() user) {
    return this.patientService.revokeDoctor(user['id']);
  }

  @Post('patient/rating')
  @HttpCode(HttpStatus.OK)
  createRating(@CurrentUser() user, @Body() dto: RatingDto) {
    return this.patientService.createRating(user['memberId'], dto);
  }

  
}
