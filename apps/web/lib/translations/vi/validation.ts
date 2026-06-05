import { TranslationSchema } from "../types";

export const validation: TranslationSchema["validation"] = {
  required: "Trường này là bắt buộc.",
  invalidEmail: "Vui lòng nhập địa chỉ email hợp lệ.",
  passwordTooShort: "Mật khẩu phải dài tối thiểu 6 ký tự.",
  nameRequired: "Vui lòng nhập họ tên.",
  emailRequired: "Vui lòng nhập email.",
  passwordRequired: "Vui lòng nhập mật khẩu.",
};
