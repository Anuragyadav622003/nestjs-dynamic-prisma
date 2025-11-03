import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../shared/prisma.service';
import { UserRole } from '../shared/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({ 
        where: { email },
        select: { id: true, email: true, password: true, role: true }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Authentication failed for ${email}:`, error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(user: any) {
    try {
      const payload = { 
        email: user.email, 
        sub: user.id, 
        role: user.role 
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(email: string, password: string, role: UserRole = UserRole.Viewer) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User already exists with this email');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      this.logger.log(`New user registered: ${email} with role ${role}`);
      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User already exists with this email');
      }
      this.logger.error('Registration failed:', error);
      throw new Error('Registration failed');
    }
  }
}