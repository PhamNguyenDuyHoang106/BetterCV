import { IsString, IsUrl } from "class-validator";

export class CheckoutDto {
  @IsString()
  priceId!: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}
