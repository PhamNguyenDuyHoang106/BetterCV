import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  priceId?: string;

  @IsOptional()
  @IsIn(['PRO', 'PREMIUM'])
  tier?: 'PRO' | 'PREMIUM';

  /** PRO: gói tháng (lưu subscription 30 ngày). PREMIUM: trả một lần. */
  @IsOptional()
  @IsIn(['subscription', 'payment'])
  mode?: 'subscription' | 'payment';

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
