import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { CreateUserDto, UpdateEmployeeProfileDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        employee: {
          create: {
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
          },
        },
      },
      include: {
        employee: true,
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        employee: true,
      },
    });

    return users.map(({ password, ...user }) => user);
  }
}
