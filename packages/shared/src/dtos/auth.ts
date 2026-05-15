export type AuthTokensDto = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type RegisterRequestDto = {
  email: string;
  password: string;
  fullName: string;
};
