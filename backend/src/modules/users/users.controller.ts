import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/user.dto";
import { JwtGuard } from "@common/guards/jwt.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { Roles } from "@common/decorators/roles.decorator";
import { Role } from "@common/enums/role.enum";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("users")
@UseFilters(AllExceptionsFilter)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getUserById(@Param("id") id: string) {
    return this.usersService.getUserById(id);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
