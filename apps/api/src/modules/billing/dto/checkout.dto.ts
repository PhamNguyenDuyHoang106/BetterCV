import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class CheckoutDto {
  /**
   * Prefer sending tier+mode (server resolves Stripe price IDs).
   * `priceId` is kept for backward compatibility.
   */
  @IsOptional()
  @IsString()
  priceId?: string;

  @IsOptional()
  @IsIn(['PRO', 'PREMIUM'])
  tier?: 'PRO' | 'PREMIUM';

  @IsOptional()
  @IsIn(['subscription', 'payment'])
  mode?: 'subscription' | 'payment';

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}
