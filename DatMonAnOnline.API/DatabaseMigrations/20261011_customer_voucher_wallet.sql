-- Chạy một lần trên database DatMonAnOnline trước khi sử dụng Kho voucher.
-- Bảng lưu quan hệ voucher mà từng khách hàng đã chủ động lưu.

CREATE TABLE IF NOT EXISTS khachhang_khuyenmai
(
    MaKhachHang INT NOT NULL,
    MaKhuyenMai INT NOT NULL,
    NgayLuu DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (MaKhachHang, MaKhuyenMai),
    KEY FK_KhachHangKhuyenMai_KhuyenMai (MaKhuyenMai),
    CONSTRAINT FK_KhachHangKhuyenMai_KhachHang
        FOREIGN KEY (MaKhachHang)
        REFERENCES khachhang (MaKhachHang)
        ON DELETE CASCADE,
    CONSTRAINT FK_KhachHangKhuyenMai_KhuyenMai
        FOREIGN KEY (MaKhuyenMai)
        REFERENCES khuyenmai (MaKhuyenMai)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
