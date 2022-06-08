import { Static, Type } from '@sinclair/typebox';

export const LoginRequestSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
});

export type LoginRequest = Static<typeof LoginRequestSchema>;
