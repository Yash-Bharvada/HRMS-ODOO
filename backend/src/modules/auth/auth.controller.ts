import {
  Controller,
  Post,
  Body,
  UseFilters,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";
import { JwtGuard } from "@common/guards/jwt.guard";
import { User, RequestUser } from "@common/decorators/user.decorator";

@Controller("authentication")
@UseFilters(AllExceptionsFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      throw new UnauthorizedException("Invalid email or password");
    }
  }

  @Post("refresh")
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refreshToken);
    } catch (error) {
      throw new UnauthorizedException("Failed to refresh token");
    }
  }

  @Post("logout")
  @UseGuards(JwtGuard)
  async logout(
    @User() user: RequestUser,
    @Body("refreshToken") refreshToken: string
  ) {
    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    try {
      await this.authService.logout(refreshToken);
      return { message: "Logged out successfully" };
    } catch (error) {
      throw new UnauthorizedException("Failed to logout");
    }
  }
}
