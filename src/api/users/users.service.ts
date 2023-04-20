/* eslint-disable prettier/prettier */
import { IMAGE_REGEX, MESS_CODE, customRound, t } from '@/utils';
import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BcryptService, PrismaService } from '@services';
import { S3 } from 'aws-sdk';
import { ResponseSuccess } from '../../types/response';
import { ChangePasswordDto, UpdatePasswordDto } from './dto';
const aws_s3_url: string = process.env.AWS_S3_URL || '';
const bucket_region: string | undefined = process.env.AWS_S3_BUCKET_REGION;
const bucket_name: string = process.env.AWS_S3_BUCKET_NAME || '';
const folder_name: string = process.env.AWS_S3_FOLDER_NAME || '';

const s3 = new S3({
  apiVersion: '2006-03-01',
  region: bucket_region,
});
const s3Client = new S3Client({ region: bucket_region });
@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,

    private readonly bcryptService: BcryptService,
  ) {}

  async checkUserExist(id: string) {
    return await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async checkPhoneExist(phone: string) {
    return await this.prismaService.user.findFirst({
      where: {
        phone,
        isDeleted: false,
      },
    });
  }

  async getMe(userId: string) {
    try {
      const select = {
        id: true,
        phone: true,
        memberId: true,
        role: true,
      };
      const me = await this.prismaService.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
        select: {
          memberId: true,
          role: true,
        },
      });
      if (me['role'] === Role.PATIENT) {
        select['patient'] = {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
            address: true,
            avatar: true,
            job: true,
            insuranceNumber: true,
            state: true,
            medicalHistory: true,
            doctorId: true,
            carer: true,
          },
        };
      } else {
        select['doctor'] = true;
      }

      const data: any = await this.prismaService.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
        select: select,
      });

      if (me['role'] === Role.DOCTOR) {
        const rating = await this.prismaService.rating.aggregate({
          where: {
            doctorId: me.memberId,
          },
          _avg: {
            rate: true,
          },
        });
        data.doctor['rate'] = customRound(rating?._avg?.rate) ?? 0;
        // data['rate'] = customRound(rating?._avg?.rate) ?? 0;
      }

      return ResponseSuccess(data, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // async uploads(id, file) {
  //   try {
  //     if (!file) throw new BadRequestException(t(MESS_CODE['DATA_NOT_FOUND'], {}));

  //     // console.log(12312321, file.mimetype.match(IMAGE_REGEX));
  //     if (!file.mimetype.match(IMAGE_REGEX)) {
  //       throw new BadRequestException(t(MESS_CODE['IMAGE_NOT_FORMAT'], {}));
  //     }
  //     if (file.size > process.env.MAX_SIZE) {
  //       throw new BadRequestException(t(MESS_CODE['MAX_SIZE_WARNING'], {}));
  //     }

  //     const fileName = `${new Date().getTime()}_${file.originalname}`;
  //     const params: PutObjectCommandInput = {
  //       Bucket: bucket_name,
  //       Key: `${folder_name}/${fileName}`,
  //       Body: file.buffer,
  //       ACL: 'public-read',
  //       ContentType: file.mimetype,
  //     };
  //     try {
  //       const data = await s3Client.send(new PutObjectCommand(params));

  //       const patient

  //       if (data && data?.$metadata?.httpStatusCode === 200) {
  //         const data = await this.prismaService.file.create({
  //           data: {
  //             name: fileName,
  //             url: aws_s3_url + params.Key,
  //           },
  //           select: {
  //             id: true,
  //             name: true,
  //             url: true,
  //           },
  //         });
  //       }
  //     } catch (err) {
  //       throw new BadRequestException(err.message);
  //     }
  //   } catch (error) {
  //     console.log('🚀 ~~~~~~ error:', error.message);
  //     throw new BadRequestException(error.message);
  //   }
  // }

  // async createUser(userId: string, dto: CreateUsersDto) {
  //   try {
  //     const { staffId, decentralizations, ...createUser } = dto;
  //     const staffExist = await this.prismaService.staff.findFirst({
  //       where: {
  //         id: staffId,
  //         isDeleted: false,
  //       },
  //     });
  //     if (!staffExist) throw new BadRequestException(t(MESS_CODE['STAFF_NOT_FOUND'], language));

  //     if (!dto?.username.match(USERNAME_REGEX))
  //       throw new BadRequestException(t(MESS_CODE['INVALID_USERNAME'], language));

  //     const usernameExist = await this.checkUsernameExist(createUser.username);
  //     if (usernameExist) throw new BadRequestException(t(MESS_CODE['USERNAME_EXIST'], language));

  //     const newHashPassword = await this.bcryptService.hash(process.env.DEFAULT_PASSWORD);

  //     const data = await this.prismaService.$transaction(async (prisma) => {
  //       const data = await this.prismaService.user.create({
  //         data: {
  //           ...createUser,
  //           password: newHashPassword,
  //           staff: { connect: { id: staffId } },
  //           createdBy: userId,
  //         },
  //       });

  //       await Promise.all(
  //         decentralizations.map(async (item: CreateUserDecentralization) => {
  //           if (item?.departmentIds?.length) {
  //             for (const id of item.departmentIds) {
  //               const departmentExist = await prisma.department.findFirst({ where: { id: id } });
  //               if (!departmentExist) throw new BadRequestException(t(MESS_CODE['DEPARTMENT_NOT_FOUND'], language));
  //             }
  //           }

  //           const decentralizationExist = await prisma.decentralization.findFirst({
  //             where: {
  //               userId: data.id,
  //               roleId: item.roleId,
  //             },
  //           });

  //           if (!decentralizationExist) {
  //             // Create decentralization
  //             await prisma.decentralization.create({
  //               data: {
  //                 role: { connect: { id: item.roleId } },
  //                 departments: item?.departmentIds?.length
  //                   ? { connect: item.departmentIds.map((item: string) => ({ id: item })) }
  //                   : undefined,
  //                 user: { connect: { id: data.id } },
  //                 createdBy: userId,
  //               },
  //             });
  //           } else {
  //             // Update decentralization
  //             await prisma.decentralization.update({
  //               where: { id: decentralizationExist?.id },
  //               data: {
  //                 role: { connect: { id: item.roleId } },
  //                 departments: item?.departmentIds?.length
  //                   ? { connect: item.departmentIds.map((item: string) => ({ id: item })) }
  //                   : undefined,
  //                 user: { connect: { id: data.id } },
  //                 updatedBy: userId,
  //               },
  //             });
  //           }
  //         }),
  //       );
  //       return await this.prismaService.user.findFirst({
  //         where: { id: data.id },
  //         select: usersSelect,
  //       });
  //     });
  //     return ResponseSuccess(data, MESS_CODE['SUCCESS'], { language });
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }

  async updatePassword(dto: UpdatePasswordDto) {
    try {
      // if (!dto?.newPassword.match(PASSWORD_REGEX)) throw new BadRequestException(t(MESS_CODE['PASSWORD_NOT_INVALID']));
      if (dto.newPassword.length < 6) throw new BadRequestException(t(MESS_CODE['PASSWORD_INVALID']));
      if (dto.newPassword !== dto.confirmNewPassword)
        throw new BadRequestException(t(MESS_CODE['NEW_PASSWORD_NOT_MATCH']));

      const newHashPassword = await this.bcryptService.hash(dto.newPassword);
      const user = await this.prismaService.user.findFirst({ where: { phone: dto.phone } });
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          password: newHashPassword,
        },
      });

      return ResponseSuccess({}, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      // if (!dto.newPassword.match(PASSWORD_REGEX))
      //   throw new BadRequestException(t(MESS_CODE['PASSWORD_NOT_INVALID'], language));
      if (dto.newPassword.length < 6) throw new BadRequestException(t(MESS_CODE['PASSWORD_INVALID']));
      if (dto.newPassword !== dto.confirmNewPassword)
        throw new BadRequestException(t(MESS_CODE['NEW_PASSWORD_NOT_MATCH']));

      const userIdExist = await this.prismaService.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
      });
      if (!userIdExist) throw new BadRequestException(t(MESS_CODE['USER_NOT_FOUND']));

      const hashPassword = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });
      if (!hashPassword) throw new BadRequestException(t(MESS_CODE['USER_NOT_FOUND']));

      const isPasswordMatch = await this.bcryptService.compare(dto.oldPassword, hashPassword.password);
      if (!isPasswordMatch) throw new BadRequestException(t(MESS_CODE['OLD_PASSWORD_NOT_MATCH']));

      const newHashPassword = await this.bcryptService.hash(dto.newPassword);
      await this.prismaService.user.update({
        where: { id: userId },
        data: { password: newHashPassword },
      });
      return ResponseSuccess({}, MESS_CODE['SUCCESS'], {});
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // async deleteUser(userId: string, id: string) {
  //   try {
  //     const userIdExist = await this.checkUserExist(id);
  //     if (!userIdExist) throw new BadRequestException(t(MESS_CODE['USER_NOT_FOUND'], language));

  //     const data = await this.prismaService.user.update({
  //       where: { id },
  //       data: {
  //         isDeleted: true,
  //         deletedBy: userId,
  //       },
  //     });
  //     return ResponseSuccess(data, MESS_CODE['SUCCESS'], { language });
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }
}
