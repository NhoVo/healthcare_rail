/* eslint-disable prettier/prettier */
import { ResponseSuccess } from '@/types';
import { MESS_CODE, t } from '@/utils';
import { AuthService } from '@auth/auth.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { BcryptService, PrismaService } from '@services';
import { LoginUserDto, RegisterDoctorDto, RegisterPatientDto } from './dto';
@Injectable()
export class LoginUserService {
  constructor(
    private authService: AuthService,
    private prismaService: PrismaService,
    private bcryptService: BcryptService,
  ) {}

  async refresh(user: any, token: string) {
    try {
      const data = await this.authService.refresh(user, token);
      return ResponseSuccess(data, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async login(dto: LoginUserDto) {
    try {
      const phoneExist = await this.prismaService.user.findFirst({
        where: {
          phone: dto.phone,
          isDeleted: false,
          // staff: { isDeleted: false },
          // status: Status.ACTIVE,
        },
      });
      if (!phoneExist) throw new BadRequestException(t(MESS_CODE['PHONE_OR_PASSWORD_INCORRECT']));

      const isPasswordMatch = await this.bcryptService.compare(dto.password, phoneExist.password);
      if (!isPasswordMatch) throw new BadRequestException(t(MESS_CODE['PHONE_OR_PASSWORD_INCORRECT']));

      const data = await this.authService.login(phoneExist);
      data['role'] = phoneExist.role;
      data['memberId'] = phoneExist.memberId;
      return ResponseSuccess(data, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async logout(user: any) {
    try {
      const data = await this.authService.logout(user);
      return ResponseSuccess(data, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async registerDoctor(dto: RegisterDoctorDto) {
    try {
      // Generate password
      // const randomPassword = randomize('Aa0', 8);
      const hash = await this.bcryptService.hash(dto.password);

      // Check for user exists
      const userExist = await this.prismaService.user.findFirst({
        where: {
          phone: dto.phone,
          isDeleted: false,
        },
      });
      if (userExist) throw new BadRequestException(t(MESS_CODE['PHONE_EXIST']));

      // Check for user phone exists
      const userEmailExist = await this.prismaService.doctor.findFirst({
        where: {
          email: dto.email,
          isDeleted: false,
        },
      });
      if (userEmailExist) throw new BadRequestException(t(MESS_CODE['EMAIL_EXIST']));

      if (dto?.password.length < 6) {
        throw new BadRequestException(t(MESS_CODE['PASSWORD_INVALID']));
      }
      delete dto.password;

      const data = await this.prismaService.$transaction(async (prisma) => {
        // Check for role exists

        // Create user
        const user = await prisma.user.create({
          data: {
            phone: dto.phone,
            role: Role.DOCTOR,
            password: hash,
          },
        });

        const doctor = await prisma.doctor.create({
          data: {
            ...dto,
            user: { connect: { id: user.id } },
          },
        });

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            memberId: doctor.id,
          },
        });

        return doctor;
      });
      const { ...result } = data;
      return ResponseSuccess(result, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async registerPatient(dto: RegisterPatientDto) {
    try {
      const { carers, ...patientCreate } = dto;
      // Generate password
      // const randomPassword = randomize('Aa0', 8);

      // Check for user exists
      const userExist = await this.prismaService.user.findFirst({
        where: {
          phone: patientCreate.phone,
          isDeleted: false,
        },
      });
      if (userExist) throw new BadRequestException(t(MESS_CODE['PHONE_EXIST']));

      if (patientCreate?.password.length < 6) {
        throw new BadRequestException(t(MESS_CODE['PASSWORD_INVALID']));
      }
      const hash = await this.bcryptService.hash(patientCreate.password);
      delete patientCreate.password;

      const data: any = await this.prismaService.$transaction(async (prisma) => {
        // Check for role exists

        // Create user
        const user = await prisma.user.create({
          data: {
            phone: patientCreate.phone,
            role: Role.PATIENT,
            password: hash,
          },
        });

        const patient = await prisma.patient.create({
          data: {
            ...patientCreate,
            user: { connect: { id: user.id } },
          },
        });

        await prisma.healthRecord.create({
          data: {
            patientId: patient.id,
            status: Status.SAFE,
            createdBy: patient.id,
          },
        });

        await carers.map(async (i) => {
          await this.prismaService.carer.create({
            data: {
              patientId: patient.id,
              phone: i.phone,
              fullName: i.fullName,
              createdBy: patient.id,
            },
          });
        });

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            memberId: patient.id,
          },
        });

        return patient;
      });

      const { ...result } = data;
      return ResponseSuccess(result, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // async forgotPassword(dto: ForgotPasswordDto) {
  //   try {
  //     const randomToken = randomize('Aa0', 32);
  //     const expiredAt = moment().add(30, 'minutes').toDate();

  //     // Check for exists
  //     const user = await this.prismaService.user.findFirst({
  //       where: {
  //         username: dto.username,
  //         isDeleted: false,
  //         staff: { isDeleted: false },
  //       },
  //       select: {
  //         staff: {
  //           select: {
  //             email: true,
  //             fullName: true,
  //           },
  //         },
  //       },
  //     });
  //     if (!user) throw new BadRequestException(t(MESS_CODE['USERNAME_NOT_FOUND'], ));

  //     if (user?.staff?.email) {
  //       await this.prismaService.reset_Password_Token.upsert({
  //         where: { username: dto.username },
  //         create: {
  //           username: dto.username,
  //           email: user?.staff?.email,
  //           token: randomToken,
  //           expiredAt,
  //         },
  //         update: {
  //           token: randomToken,
  //           expiredAt,
  //           isUsed: false,
  //         },
  //       });

  //       await this.mailerService
  //         .sendMail({
  //           to: user.staff.email,
  //           subject: t('RESET_YOUR_PASSWORD', ),
  //           template: ?.toUpperCase() === .VI ? 'forgot-password-vi' : 'forgot-password-en',
  //           context: {
  //             name: user.staff?.fullName,
  //             url: dto?.returnUrl + randomToken,
  //           },
  //         })
  //         .catch(console.error);
  //     }
  //     return ResponseSuccess({}, MESS_CODE['SUCCESS'], {  });
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }

  // async resetPassword(dto: ResetPasswordDto) {
  //   try {
  //     if (!dto.newPassword.match(PASSWORD_REGEX))
  //       throw new BadRequestException(t(MESS_CODE['PASSWORD_NOT_INVALID'], ));

  //     if (dto.newPassword !== dto.confirmNewPassword)
  //       throw new BadRequestException(t(MESS_CODE['NEW_PASSWORD_NOT_MATCH'], ));

  //     const now = moment().toDate();
  //     const token = await this.prismaService.reset_Password_Token.findFirst({
  //       where: {
  //         token: dto.token,
  //         expiredAt: { gt: now },
  //         isUsed: false,
  //       },
  //     });
  //     if (!token) throw new BadRequestException(t(MESS_CODE['INVALID_TOKEN'], ));

  //     await this.prismaService.reset_Password_Token.update({
  //       where: { id: token.id },
  //       data: { isUsed: true },
  //     });

  //     const hash = await this.bcryptService.hash(dto.newPassword);

  //     const user = await this.prismaService.user.findFirst({
  //       where: {
  //         username: token?.username,
  //         isDeleted: false,
  //         staff: { isDeleted: false },
  //       },
  //       select: { id: true },
  //     });

  //     await this.prismaService.user.update({
  //       where: { id: user.id },
  //       data: { password: hash },
  //     });
  //     return ResponseSuccess({ username: token?.username || '' }, MESS_CODE['SUCCESS'], {  });
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }
}
