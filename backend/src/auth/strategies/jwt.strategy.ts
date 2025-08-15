import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtUser = { userId: string; email: string };

type JwtPayload = { sub: string; email: string; iat?: number; exp?: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'devsecret',
    });
  }

  validate(payload: JwtPayload): JwtUser {
    return { userId: String(payload.sub), email: String(payload.email) };
  }
}
