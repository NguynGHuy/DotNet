USE DatMonAnOnline;

-- ============================================================
-- 1. TÀI KHOẢN (Mật khẩu giả định đã được mã hóa)
-- Role: 1-Admin, 2-Quán, 3-Khách
-- ============================================================
INSERT INTO TaiKhoan (Email, MatKhau, SoDienThoai, MaRole, DaXacThucEmail) VALUES
('admin@hethong.com', 'hashed_pass_123', '0900000000', 1, 1),
('phuclong@gmail.com', 'hashed_pass_123', '0901111111', 2, 1),
('mixue@gmail.com', 'hashed_pass_123', '0902222222', 2, 1),
('khachhang1@gmail.com', 'hashed_pass_123', '0903333333', 3, 1),
('khachhang2@gmail.com', 'hashed_pass_123', '0904444444', 3, 1);

-- ============================================================
-- 2. KHÁCH HÀNG & NHÀ HÀNG & ĐỊA CHỈ
-- ============================================================
INSERT INTO KhachHang (MaTaiKhoan, HoTen, NgaySinh, GioiTinh, DiemTichLuy) VALUES
(4, 'Nguyễn Văn Khách', '2000-01-01', 'Nam', 150),
(5, 'Trần Thị Hàng', '2002-05-15', 'Nữ', 0);

INSERT INTO NhaHang (MaTaiKhoan, TenNhaHang, MoTa, DiaChiQuan, GioMoCua, GioDongCua, TrangThaiDuyet, DanhGiaTrungBinh) VALUES
(2, 'Phúc Long Coffee & Tea', 'Thương hiệu trà và cà phê nổi tiếng', '123 Lê Lợi, Q1, TP.HCM', '07:00:00', '22:30:00', 'DaDuyet', 4.8),
(3, 'Mixue Ice Cream & Tea', 'Kem và Trà sữa giá rẻ', '456 Nguyễn Trãi, Q5, TP.HCM', '09:00:00', '23:00:00', 'DaDuyet', 4.5);

INSERT INTO DiaChi (MaKhachHang, TenNguoiNhan, SoDienThoaiNhan, DiaChiCuThe, MacDinh) VALUES
(1, 'Nguyễn Văn Khách (Công ty)', '0903333333', 'Tòa nhà Bitexco, Q1, TP.HCM', 1),
(1, 'Nguyễn Văn Khách (Nhà)', '0903333333', 'Hẻm 12 CMT8, Q10, TP.HCM', 0);

-- ============================================================
-- 3. DANH MỤC & MÓN ĂN (Của Phúc Long - MaNhaHang = 1)
-- ============================================================
INSERT INTO DanhMuc (MaNhaHang, TenDanhMuc, ThuTuHienThi) VALUES
(1, 'Trà Sữa', 1),
(1, 'Cà Phê', 2);

INSERT INTO MonAn (MaNhaHang, MaDanhMuc, TenMonAn, MoTa, Gia, HinhAnh) VALUES
(1, 1, 'Trà Sữa Phúc Long', 'Đậm vị trà đặc trưng', 45000, 'ts_phuclong.jpg'),
(1, 1, 'Trà Đào Cam Sả', 'Thanh mát giải nhiệt', 50000, 'tradao.jpg'),
(1, 2, 'Cà Phê Sữa Đá', 'Cà phê rang xay nguyên chất', 35000, 'cf_sua.jpg');

-- ============================================================
-- 4. TOPPING (Thiết lập cho món Trà Sữa)
-- ============================================================
INSERT INTO NhomTopping (MaNhaHang, TenNhom, BatBuocChon, ChonToiDa) VALUES
(1, 'Chọn Size', 1, 1),
(1, 'Topping Thêm', 0, 3);

INSERT INTO Topping (MaNhomTopping, TenTopping, GiaThem) VALUES
(1, 'Size M (Vừa)', 0),
(1, 'Size L (Lớn)', 10000),
(2, 'Trân châu đen', 10000),
(2, 'Thạch lô hội', 8000);

-- Map Topping vào Món "Trà Sữa Phúc Long" (MaMonAn = 1)
INSERT INTO MonAn_NhomTopping (MaMonAn, MaNhomTopping) VALUES
(1, 1),
(1, 2);

-- ============================================================
-- 5. GIỎ HÀNG (Khởi tạo sẵn giỏ hàng trống cho 2 khách)
-- ============================================================
INSERT INTO GioHang (MaKhachHang) VALUES (1), (2);

-- ============================================================
-- 6. ĐƠN HÀNG MẪU (Khách 1 đặt Phúc Long)
-- ============================================================
INSERT INTO DonHang (MaDonHangHienThi, MaKhachHang, MaNhaHang, MaDiaChi, MaTrangThai, TenNguoiNhan, SoDienThoaiNhan, DiaChiGiaoHang, TongTienHang, PhiShip, ThanhTien, GhiChu) VALUES
('DH-PL-000001', 1, 1, 1, 5, 'Nguyễn Văn Khách (Công ty)', '0903333333', 'Tòa nhà Bitexco, Q1, TP.HCM', 65000, 15000, 80000, 'Ít đá, nhiều ngọt');

INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia, ThanhTien) VALUES
(1, 1, 1, 45000, 45000); 

-- Thêm topping (Size L + Trân châu) vào Chi tiết đơn
INSERT INTO ChiTietDonHang_Topping (MaChiTietDonHang, MaTopping, SoLuong, GiaThemLucDat) VALUES
(1, 2, 1, 10000), -- Size L
(1, 3, 1, 10000); -- Trân châu

-- Lịch sử trạng thái đơn hàng (Đã hoàn thành)
INSERT INTO LichSuTrangThaiDonHang (MaDonHang, MaTrangThai, MaTaiKhoan, GhiChu) VALUES
(1, 1, 4, 'Khách hàng đặt đơn'),
(1, 2, 2, 'Quán xác nhận đơn'),
(1, 5, 2, 'Giao hàng thành công');

-- Giao dịch thanh toán (Thanh toán Momo)
INSERT INTO ThanhToan (MaDonHang, MaPhuongThuc, SoTien, TrangThaiThanhToan, MaGiaoDich) VALUES
(1, 2, 80000, 'ThanhCong', 'MOMO_123456789');

-- Khách hàng đánh giá món ăn sau khi nhận
INSERT INTO DanhGiaMonAn (MaKhachHang, MaMonAn, MaDonHang, SoSao, NoiDung) VALUES
(1, 1, 1, 5, 'Trà sữa ngon, giao hàng nhanh!');