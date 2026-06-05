import { TranslationSchema } from "../types";

export const toast: TranslationSchema["toast"] = {
  cvSaved: "Lưu CV thành công!",
  cvDeleted: "Đã xóa CV thành công!",
  upgradeRequired: "Mẫu thiết kế này là mẫu Premium. Vui lòng nâng cấp tài khoản!",
  aiCreditsExhausted: "Đã hết lượt AI. Vui lòng nạp thêm lượt!",
  duplicateSuccess: "Nhân bản CV thành công!",
  deleteFailed: "Không thể xóa CV.",
  duplicateFailed: "Không thể nhân bản CV.",
  profileSuccess: "Họ tên đã được cập nhật thành công!",
  profileFailed: "Không thể cập nhật hồ sơ.",
  loadCvFailed: "Không thể tải cấu trúc CV từ Cloud.",
  saveFailed: "Không thể tự động sao lưu cấu trúc CV.",
};
