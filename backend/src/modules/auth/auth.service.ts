import { Injectable, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { authConfig } from "@config/auth.config";
import { CreateUserDto } from "../users/dto/user.dto";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject("PrismaClient") private prisma: PrismaClient
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return this.generateTokens(user.id, user.role);
  }

  async signup(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new Error("Email already in use");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user with employee profile
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role || 'EMPLOYEE',
        employee: {
          create: {
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            department: createUserDto.department || 'General',
            phone: createUserDto.phone,
            address: createUserDto.address,
          },
        },
      },
      include: {
        employee: true,
      },
    });

    // Generate tokens for immediate login
    return this.generateTokens(user.id, user.role);
  }

  async generateTokens(userId: string, role: string) {
    const accessToken = this.jwtService.sign(
      { userId, role },
      {
        secret: authConfig.jwtSecret,
        expiresIn: authConfig.jwtExpirationTime,
      }
    );

    const refreshToken = this.jwtService.sign(
      { userId },
      {
        secret: authConfig.jwtSecret,
        expiresIn: "7d",
      }
    );

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found after creation");
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: authConfig.jwtSecret,
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error("Refresh token expired or invalid");
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return this.generateTokens(user.id, user.role);
    } catch (error) {
      throw new Error("Failed to refresh token");
    }
  }

  async logout(token: string) {
    await this.prisma.refreshToken.delete({
      where: { token },
    });
  }
}
