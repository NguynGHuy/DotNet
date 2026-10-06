-- ============================================================
-- DAT MON AN ONLINE - TAO MOI VA KHOI PHUC DU LIEU
-- Nguon: DatabaseDatMonAnOnline.sql nguoi dung gui ngay 05/10/2026.
-- Danh cho MySQL 8.0.16+ (can CHECK duoc thuc thi).
-- 28 bang = 24 bang goc + HopDongNhaHang + HoanTien
--          + DoiSoatNhaHang + ChiTietDoiSoat.
--
-- CACH CHAY:
-- 1. Database DatMonAnOnline phai CHUA TON TAI (ban da DROP).
-- 2. Mo file nay trong MySQL Workbench, chay toan bo MOT LAN.
-- 3. KHONG chay tiep script ALTER/migration cu.
-- 4. Ket qua cuoi file: TongSoBang = 28, cac chi so loi = 0.
--
-- AN TOAN:
-- Khong co DROP DATABASE / DROP TABLE, khong tat FOREIGN_KEY_CHECKS,
-- khong tat SAFE_UPDATES, khong can bang tam hay quyen LOCK TABLES.
-- Neu database da ton tai: dung lai, khong chay phan con lai.
-- DDL cua MySQL khong rollback ca file. Neu loi, dung lai va gui loi;
-- khong tu dong chay lai tren database da tao mot phan.
--
-- DU LIEU:
-- Giu du lieu goc, ID, AUTO_INCREMENT va chuoi mat khau nhu ban dump.
-- Khong khoi phuc 4 gio RONG cu vi chua gan nha hang.
-- Khong mat mon hay topping trong gio (hai bang chi tiet goc rong).
-- Khong tao gia hop dong da ky, giao dich hoan tien hay ky doi soat.
-- Don cu chua co hop dong: MaHopDong NULL, phi nen tang 0.
-- Hop dong va thu phi moi can backend xu ly; SQL khong thay the API.
-- File chua thong tin tai khoan; khong dua len repository cong khai.
-- ============================================================

CREATE DATABASE `DatMonAnOnline`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `DatMonAnOnline`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- A. TAO BANG THEO THU TU CHA -> CON
-- ============================================================

-- 01. role
CREATE TABLE `role` (
  `MaRole` int NOT NULL AUTO_INCREMENT,
  `TenRole` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaRole`),
  UNIQUE KEY `TenRole` (`TenRole`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 02. taikhoan
CREATE TABLE `taikhoan` (
  `MaTaiKhoan` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MatKhau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaRole` int NOT NULL,
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1',
  `DaXacThucEmail` tinyint(1) NOT NULL DEFAULT '0',
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AnhDaiDien` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaTaiKhoan`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `SoDienThoai` (`SoDienThoai`),
  KEY `FK_TaiKhoan_Role` (`MaRole`),
  CONSTRAINT `FK_TaiKhoan_Role` FOREIGN KEY (`MaRole`) REFERENCES `role` (`MaRole`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 03. khachhang
CREATE TABLE `khachhang` (
  `MaKhachHang` int NOT NULL AUTO_INCREMENT,
  `MaTaiKhoan` int NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiemTichLuy` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaKhachHang`),
  UNIQUE KEY `MaTaiKhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_KhachHang_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 04. nhahang
CREATE TABLE `nhahang` (
  `MaNhaHang` int NOT NULL AUTO_INCREMENT,
  `MaTaiKhoan` int NOT NULL,
  `TenNhaHang` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiaChiQuan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `AnhBia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `GioMoCua` time DEFAULT NULL,
  `GioDongCua` time DEFAULT NULL,
  `TrangThaiDuyet` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ChoDuyet',
  `TrangThaiHoatDong` enum('MoCua','DongCua','TamNgung') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MoCua',
  `DanhGiaTrungBinh` float NOT NULL DEFAULT '0',
  `PhiShipMacDinh` decimal(18,0) NOT NULL DEFAULT '15000',
  PRIMARY KEY (`MaNhaHang`),
  UNIQUE KEY `MaTaiKhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_NhaHang_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 05. hopdongnhahang
CREATE TABLE `hopdongnhahang` (
  `MaHopDong` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int NOT NULL,
  `SoHopDong` varchar(50) NOT NULL,
  `NguoiDaiDien` varchar(100) NOT NULL,
  `ChucVuNguoiDaiDien` varchar(100) DEFAULT NULL,
  `SoGiayToNguoiDaiDien` varchar(30) DEFAULT NULL,
  `MaSoThue` varchar(30) DEFAULT NULL,
  `SoGiayPhepKinhDoanh` varchar(50) DEFAULT NULL,
  `FileGiayPhepKinhDoanh` varchar(500) DEFAULT NULL,
  `FileGiayToNguoiDaiDien` varchar(500) DEFAULT NULL,
  `FileHopDong` varchar(500) DEFAULT NULL,
  `PhienBanDieuKhoan` varchar(50) NOT NULL DEFAULT '1.0',
  `TyLePhiNenTang` decimal(5,2) NOT NULL DEFAULT 5.00,
  `NgayBatDau` date NOT NULL,
  `NgayKetThuc` date NOT NULL,
  `ThoiGianKy` datetime DEFAULT NULL,
  `TrangThai` enum('Nhap','ChoKy','ChoDuyet','HieuLuc','HetHan','TuChoi','ChamDut')
    NOT NULL DEFAULT 'Nhap',
  `MaTaiKhoanDuyet` int DEFAULT NULL,
  `ThoiGianDuyet` datetime DEFAULT NULL,
  `LyDoTuChoi` varchar(500) DEFAULT NULL,
  `LyDoChamDut` varchar(500) DEFAULT NULL,
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `NgayCapNhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaHopDong`),
  UNIQUE KEY `UQ_HopDong_SoHopDong` (`SoHopDong`),
  UNIQUE KEY `UQ_HopDong_Ma_NhaHang` (`MaHopDong`,`MaNhaHang`),
  KEY `IX_HopDong_NhaHang_TrangThai` (`MaNhaHang`,`TrangThai`),
  KEY `IX_HopDong_NgayKetThuc` (`NgayKetThuc`),
  CONSTRAINT `FK_HopDongNhaHang_NhaHang`
    FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`),
  CONSTRAINT `FK_HopDongNhaHang_NguoiDuyet`
    FOREIGN KEY (`MaTaiKhoanDuyet`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `CK_HopDong_TyLePhi` CHECK (`TyLePhiNenTang` BETWEEN 0 AND 100),
  CONSTRAINT `CK_HopDong_ThoiHan` CHECK (`NgayKetThuc` > `NgayBatDau`),
  CONSTRAINT `CK_HopDong_HieuLuc` CHECK (
    `TrangThai` <> 'HieuLuc'
    OR (`ThoiGianKy` IS NOT NULL AND `ThoiGianDuyet` IS NOT NULL
      AND `MaTaiKhoanDuyet` IS NOT NULL AND `FileHopDong` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 06. diachi
CREATE TABLE `diachi` (
  `MaDiaChi` int NOT NULL AUTO_INCREMENT,
  `MaKhachHang` int NOT NULL,
  `TenNguoiNhan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoaiNhan` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiaChiCuThe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MacDinh` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaDiaChi`),
  KEY `FK_DiaChi_KhachHang` (`MaKhachHang`),
  CONSTRAINT `FK_DiaChi_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 07. danhmuc
CREATE TABLE `danhmuc` (
  `MaDanhMuc` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int NOT NULL,
  `TenDanhMuc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThuTuHienThi` int DEFAULT NULL,
  PRIMARY KEY (`MaDanhMuc`),
  KEY `FK_DanhMuc_NhaHang` (`MaNhaHang`),
  CONSTRAINT `FK_DanhMuc_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 08. monan
CREATE TABLE `monan` (
  `MaMonAn` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int NOT NULL,
  `MaDanhMuc` int NOT NULL,
  `TenMonAn` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gia` decimal(18,0) NOT NULL,
  `HinhAnh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1',
  `DanhGiaTrungBinh` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaMonAn`),
  KEY `FK_MonAn_NhaHang` (`MaNhaHang`),
  KEY `FK_MonAn_DanhMuc` (`MaDanhMuc`),
  CONSTRAINT `FK_MonAn_DanhMuc` FOREIGN KEY (`MaDanhMuc`) REFERENCES `danhmuc` (`MaDanhMuc`),
  CONSTRAINT `FK_MonAn_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 09. nhomtopping
CREATE TABLE `nhomtopping` (
  `MaNhomTopping` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int NOT NULL,
  `TenNhom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `BatBuocChon` tinyint(1) NOT NULL DEFAULT '0',
  `ChonToiDa` int DEFAULT NULL,
  PRIMARY KEY (`MaNhomTopping`),
  KEY `FK_NhomTopping_NhaHang` (`MaNhaHang`),
  CONSTRAINT `FK_NhomTopping_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. topping
CREATE TABLE `topping` (
  `MaTopping` int NOT NULL AUTO_INCREMENT,
  `MaNhomTopping` int NOT NULL,
  `TenTopping` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaThem` decimal(18,0) NOT NULL DEFAULT '0',
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaTopping`),
  KEY `FK_Topping_NhomTopping` (`MaNhomTopping`),
  CONSTRAINT `FK_Topping_NhomTopping` FOREIGN KEY (`MaNhomTopping`) REFERENCES `nhomtopping` (`MaNhomTopping`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. monan_nhomtopping
CREATE TABLE `monan_nhomtopping` (
  `MaMonAn` int NOT NULL,
  `MaNhomTopping` int NOT NULL,
  PRIMARY KEY (`MaMonAn`,`MaNhomTopping`),
  KEY `FK_MonAnNhomTopping_NhomTopping` (`MaNhomTopping`),
  CONSTRAINT `FK_MonAnNhomTopping_MonAn` FOREIGN KEY (`MaMonAn`) REFERENCES `monan` (`MaMonAn`),
  CONSTRAINT `FK_MonAnNhomTopping_NhomTopping` FOREIGN KEY (`MaNhomTopping`) REFERENCES `nhomtopping` (`MaNhomTopping`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. giohang
CREATE TABLE `giohang` (
  `MaGioHang` int NOT NULL AUTO_INCREMENT,
  `MaKhachHang` int NOT NULL,
  `NgayCapNhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `MaNhaHang` int NOT NULL,
  PRIMARY KEY (`MaGioHang`),
  UNIQUE KEY `UQ_GioHang_KhachHang_NhaHang` (`MaKhachHang`,`MaNhaHang`),
  CONSTRAINT `FK_GioHang_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`),
  KEY `FK_GioHang_NhaHang` (`MaNhaHang`),
  CONSTRAINT `FK_GioHang_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. chitietgiohang
CREATE TABLE `chitietgiohang` (
  `MaChiTietGioHang` int NOT NULL AUTO_INCREMENT,
  `MaGioHang` int NOT NULL,
  `MaMonAn` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `GhiChu` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaChiTietGioHang`),
  KEY `FK_ChiTietGioHang_GioHang` (`MaGioHang`),
  KEY `FK_ChiTietGioHang_MonAn` (`MaMonAn`),
  CONSTRAINT `FK_ChiTietGioHang_GioHang` FOREIGN KEY (`MaGioHang`) REFERENCES `giohang` (`MaGioHang`),
  CONSTRAINT `FK_ChiTietGioHang_MonAn` FOREIGN KEY (`MaMonAn`) REFERENCES `monan` (`MaMonAn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. chitietgiohang_topping
CREATE TABLE `chitietgiohang_topping` (
  `MaChiTietGioHang` int NOT NULL,
  `MaTopping` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `GiaThem` decimal(18,0) NOT NULL,
  PRIMARY KEY (`MaChiTietGioHang`,`MaTopping`),
  KEY `FK_CTGHTopping_Topping` (`MaTopping`),
  CONSTRAINT `FK_CTGHTopping_ChiTietGioHang` FOREIGN KEY (`MaChiTietGioHang`) REFERENCES `chitietgiohang` (`MaChiTietGioHang`),
  CONSTRAINT `FK_CTGHTopping_Topping` FOREIGN KEY (`MaTopping`) REFERENCES `topping` (`MaTopping`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. trangthaidonhang
CREATE TABLE `trangthaidonhang` (
  `MaTrangThai` int NOT NULL AUTO_INCREMENT,
  `TenTrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThuTu` int DEFAULT NULL,
  PRIMARY KEY (`MaTrangThai`),
  UNIQUE KEY `TenTrangThai` (`TenTrangThai`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. khuyenmai
CREATE TABLE `khuyenmai` (
  `MaKhuyenMai` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int DEFAULT NULL,
  `MaCode` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LoaiGiam` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaTriGiam` decimal(18,0) NOT NULL,
  `GiamToiDa` decimal(18,0) DEFAULT NULL,
  `DonHangToiThieu` decimal(18,0) NOT NULL DEFAULT '0',
  `SoLuong` int NOT NULL,
  `SoLuongDaDung` int NOT NULL DEFAULT '0',
  `NgayBatDau` datetime NOT NULL,
  `NgayKetThuc` datetime NOT NULL,
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaKhuyenMai`),
  UNIQUE KEY `MaCode` (`MaCode`),
  KEY `FK_KhuyenMai_NhaHang` (`MaNhaHang`),
  CONSTRAINT `FK_KhuyenMai_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`),
  CONSTRAINT `CK_KhuyenMai_LoaiGiam` CHECK ((`LoaiGiam` in (_utf8mb4'PhanTram',_utf8mb4'SoTien')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. donhang
CREATE TABLE `donhang` (
  `MaDonHang` int NOT NULL AUTO_INCREMENT,
  `MaDonHangHienThi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhachHang` int NOT NULL,
  `MaNhaHang` int NOT NULL,
  `MaDiaChi` int DEFAULT NULL,
  `MaTrangThai` int NOT NULL,
  `MaKhuyenMai` int DEFAULT NULL,
  `ThoiGianDat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ThoiGianGiaoDuKien` datetime DEFAULT NULL,
  `ThoiGianGiaoThucTe` datetime DEFAULT NULL,
  `TenNguoiNhan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoaiNhan` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiaChiGiaoHang` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TongTienHang` decimal(18,0) NOT NULL,
  `PhiShip` decimal(18,0) NOT NULL DEFAULT '0',
  `SoTienGiam` decimal(18,0) NOT NULL DEFAULT '0',
  `ThanhTien` decimal(18,0) NOT NULL,
  `GhiChu` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LyDoHuy` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaHopDong` int DEFAULT NULL,
  `TyLePhiNenTang` decimal(5,2) NOT NULL DEFAULT 0,
  `GiamGiaNhaHang` decimal(18,0) NOT NULL DEFAULT 0,
  `GiamGiaHeThong` decimal(18,0) NOT NULL DEFAULT 0,
  `PhiNenTang` decimal(18,0) NOT NULL DEFAULT 0,
  `SoTienNhaHangNhan` decimal(18,0) NOT NULL DEFAULT 0,
  PRIMARY KEY (`MaDonHang`),
  UNIQUE KEY `MaDonHangHienThi` (`MaDonHangHienThi`),
  KEY `FK_DonHang_KhachHang` (`MaKhachHang`),
  KEY `FK_DonHang_NhaHang` (`MaNhaHang`),
  KEY `FK_DonHang_DiaChi` (`MaDiaChi`),
  KEY `FK_DonHang_TrangThai` (`MaTrangThai`),
  KEY `FK_DonHang_KhuyenMai` (`MaKhuyenMai`),
  CONSTRAINT `FK_DonHang_DiaChi` FOREIGN KEY (`MaDiaChi`) REFERENCES `diachi` (`MaDiaChi`) ON DELETE SET NULL,
  CONSTRAINT `FK_DonHang_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`),
  CONSTRAINT `FK_DonHang_KhuyenMai` FOREIGN KEY (`MaKhuyenMai`) REFERENCES `khuyenmai` (`MaKhuyenMai`),
  CONSTRAINT `FK_DonHang_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`),
  CONSTRAINT `FK_DonHang_TrangThai` FOREIGN KEY (`MaTrangThai`) REFERENCES `trangthaidonhang` (`MaTrangThai`),
  UNIQUE KEY `UQ_DonHang_Ma_NhaHang` (`MaDonHang`,`MaNhaHang`),
  KEY `IX_DonHang_HopDong_NhaHang` (`MaHopDong`,`MaNhaHang`),
  CONSTRAINT `FK_DonHang_HopDong_NhaHang`
    FOREIGN KEY (`MaHopDong`,`MaNhaHang`)
    REFERENCES `hopdongnhahang` (`MaHopDong`,`MaNhaHang`),
  CONSTRAINT `CK_DonHang_TyLePhi` CHECK (`TyLePhiNenTang` BETWEEN 0 AND 100),
  CONSTRAINT `CK_DonHang_PhiVaGiamGia` CHECK (
    `PhiNenTang` >= 0 AND `GiamGiaNhaHang` >= 0
    AND `GiamGiaHeThong` >= 0 AND `SoTienNhaHangNhan` >= 0
  )
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. chitietdonhang
CREATE TABLE `chitietdonhang` (
  `MaChiTietDonHang` int NOT NULL AUTO_INCREMENT,
  `MaDonHang` int NOT NULL,
  `MaMonAn` int NOT NULL,
  `SoLuong` int NOT NULL,
  `DonGia` decimal(18,0) NOT NULL,
  `ThanhTien` decimal(18,0) NOT NULL,
  `GhiChu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaChiTietDonHang`),
  KEY `FK_ChiTietDonHang_DonHang` (`MaDonHang`),
  KEY `FK_ChiTietDonHang_MonAn` (`MaMonAn`),
  CONSTRAINT `FK_ChiTietDonHang_DonHang` FOREIGN KEY (`MaDonHang`) REFERENCES `donhang` (`MaDonHang`),
  CONSTRAINT `FK_ChiTietDonHang_MonAn` FOREIGN KEY (`MaMonAn`) REFERENCES `monan` (`MaMonAn`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. chitietdonhang_topping
CREATE TABLE `chitietdonhang_topping` (
  `MaChiTietDonHang` int NOT NULL,
  `MaTopping` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `GiaThemLucDat` decimal(18,0) NOT NULL,
  PRIMARY KEY (`MaChiTietDonHang`,`MaTopping`),
  KEY `FK_CTDHTopping_Topping` (`MaTopping`),
  CONSTRAINT `FK_CTDHTopping_ChiTietDonHang` FOREIGN KEY (`MaChiTietDonHang`) REFERENCES `chitietdonhang` (`MaChiTietDonHang`),
  CONSTRAINT `FK_CTDHTopping_Topping` FOREIGN KEY (`MaTopping`) REFERENCES `topping` (`MaTopping`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. lichsutrangthaidonhang
CREATE TABLE `lichsutrangthaidonhang` (
  `MaLichSu` int NOT NULL AUTO_INCREMENT,
  `MaDonHang` int NOT NULL,
  `MaTrangThai` int NOT NULL,
  `MaTaiKhoan` int NOT NULL,
  `ThoiGianTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `GhiChu` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLichSu`),
  KEY `FK_LichSu_DonHang` (`MaDonHang`),
  KEY `FK_LichSu_TrangThai` (`MaTrangThai`),
  KEY `FK_LichSu_TaiKhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_LichSu_DonHang` FOREIGN KEY (`MaDonHang`) REFERENCES `donhang` (`MaDonHang`),
  CONSTRAINT `FK_LichSu_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_LichSu_TrangThai` FOREIGN KEY (`MaTrangThai`) REFERENCES `trangthaidonhang` (`MaTrangThai`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. phuongthucthanhtoan
CREATE TABLE `phuongthucthanhtoan` (
  `MaPhuongThuc` int NOT NULL AUTO_INCREMENT,
  `TenPhuongThuc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TrangThai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaPhuongThuc`),
  UNIQUE KEY `TenPhuongThuc` (`TenPhuongThuc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. thanhtoan
CREATE TABLE `thanhtoan` (
  `MaThanhToan` int NOT NULL AUTO_INCREMENT,
  `MaDonHang` int NOT NULL,
  `MaPhuongThuc` int NOT NULL,
  `SoTien` decimal(18,0) NOT NULL,
  `TrangThaiThanhToan` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ChoThanhToan',
  `MaGiaoDich` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  PRIMARY KEY (`MaThanhToan`),
  KEY `FK_ThanhToan_DonHang` (`MaDonHang`),
  KEY `FK_ThanhToan_PhuongThuc` (`MaPhuongThuc`),
  CONSTRAINT `FK_ThanhToan_DonHang` FOREIGN KEY (`MaDonHang`) REFERENCES `donhang` (`MaDonHang`),
  CONSTRAINT `FK_ThanhToan_PhuongThuc` FOREIGN KEY (`MaPhuongThuc`) REFERENCES `phuongthucthanhtoan` (`MaPhuongThuc`),
  UNIQUE KEY `UQ_ThanhToan_Ma_DonHang` (`MaThanhToan`,`MaDonHang`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. hoantien
CREATE TABLE `hoantien` (
  `MaHoanTien` int NOT NULL AUTO_INCREMENT,
  `MaThanhToan` int NOT NULL,
  `MaDonHang` int NOT NULL,
  `MaTaiKhoanYeuCau` int DEFAULT NULL,
  `MaTaiKhoanXuLy` int DEFAULT NULL,
  `SoTienHoan` decimal(18,0) NOT NULL,
  `LyDoHoan` varchar(500) NOT NULL,
  `KenhHoanTien` enum('MoMo','ZaloPay','VNPay','ChuyenKhoan','ThuCong') NOT NULL,
  `TrangThai` enum('ChoXuLy','DangXuLy','ThanhCong','ThatBai') NOT NULL DEFAULT 'ChoXuLy',
  `MaYeuCauHoan` varchar(100) NOT NULL,
  `MaGiaoDichHoan` varchar(100) DEFAULT NULL,
  `NoiDungLoi` varchar(500) DEFAULT NULL,
  `ThoiGianYeuCau` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ThoiGianXuLy` datetime DEFAULT NULL,
  `ThoiGianHoanThanh` datetime DEFAULT NULL,
  `NgayCapNhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaHoanTien`),
  UNIQUE KEY `UQ_HoanTien_ThanhToan` (`MaThanhToan`),
  UNIQUE KEY `UQ_HoanTien_MaYeuCau` (`MaYeuCauHoan`),
  UNIQUE KEY `UQ_HoanTien_Kenh_MaGiaoDich` (`KenhHoanTien`,`MaGiaoDichHoan`),
  KEY `IX_HoanTien_DonHang` (`MaDonHang`),
  KEY `IX_HoanTien_TrangThai` (`TrangThai`),
  CONSTRAINT `FK_HoanTien_ThanhToan_DonHang`
    FOREIGN KEY (`MaThanhToan`,`MaDonHang`)
    REFERENCES `thanhtoan` (`MaThanhToan`,`MaDonHang`),
  CONSTRAINT `FK_HoanTien_NguoiYeuCau`
    FOREIGN KEY (`MaTaiKhoanYeuCau`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_HoanTien_NguoiXuLy`
    FOREIGN KEY (`MaTaiKhoanXuLy`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `CK_HoanTien_SoTien` CHECK (`SoTienHoan` > 0),
  CONSTRAINT `CK_HoanTien_ThanhCong` CHECK (
    `TrangThai` <> 'ThanhCong' OR `ThoiGianHoanThanh` IS NOT NULL
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. doisoatnhahang
CREATE TABLE `doisoatnhahang` (
  `MaDoiSoat` int NOT NULL AUTO_INCREMENT,
  `MaNhaHang` int NOT NULL,
  `MaTaiKhoanDuyet` int DEFAULT NULL,
  `TuNgay` date NOT NULL,
  `DenNgay` date NOT NULL,
  `TongSoDon` int NOT NULL DEFAULT 0,
  `TongTienHang` decimal(18,0) NOT NULL DEFAULT 0,
  `TongGiamGiaNhaHang` decimal(18,0) NOT NULL DEFAULT 0,
  `TongGiamGiaHeThong` decimal(18,0) NOT NULL DEFAULT 0,
  `TongPhiShip` decimal(18,0) NOT NULL DEFAULT 0,
  `TongPhiNenTang` decimal(18,0) NOT NULL DEFAULT 0,
  `TongTienHoan` decimal(18,0) NOT NULL DEFAULT 0,
  `TongTienNhaHangNhan` decimal(18,0) NOT NULL DEFAULT 0,
  `TongTienNhaHangDaThu` decimal(18,0) NOT NULL DEFAULT 0,
  `SoTienCanDoiSoat` decimal(18,0)
    GENERATED ALWAYS AS (`TongTienNhaHangNhan` - `TongTienNhaHangDaThu`) STORED,
  `TrangThai` enum('MoiTao','ChoXacNhan','DaXacNhan','DaThanhToan','TranhChap')
    NOT NULL DEFAULT 'MoiTao',
  `MaGiaoDichDoiSoat` varchar(100) DEFAULT NULL,
  `GhiChu` varchar(500) DEFAULT NULL,
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `NgayXacNhan` datetime DEFAULT NULL,
  `NgayThanhToan` datetime DEFAULT NULL,
  PRIMARY KEY (`MaDoiSoat`),
  UNIQUE KEY `UQ_DoiSoat_Ky` (`MaNhaHang`,`TuNgay`,`DenNgay`),
  UNIQUE KEY `UQ_DoiSoat_Ma_NhaHang` (`MaDoiSoat`,`MaNhaHang`),
  KEY `IX_DoiSoat_NhaHang_TrangThai` (`MaNhaHang`,`TrangThai`),
  CONSTRAINT `FK_DoiSoat_NhaHang`
    FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`),
  CONSTRAINT `FK_DoiSoat_NguoiDuyet`
    FOREIGN KEY (`MaTaiKhoanDuyet`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `CK_DoiSoat_ThoiGian` CHECK (`DenNgay` >= `TuNgay`),
  CONSTRAINT `CK_DoiSoat_SoLieu` CHECK (
    `TongSoDon` >= 0 AND `TongTienHang` >= 0
    AND `TongGiamGiaNhaHang` >= 0 AND `TongGiamGiaHeThong` >= 0
    AND `TongPhiShip` >= 0 AND `TongPhiNenTang` >= 0
    AND `TongTienHoan` >= 0 AND `TongTienNhaHangNhan` >= 0
    AND `TongTienNhaHangDaThu` >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. chitietdoisoat
CREATE TABLE `chitietdoisoat` (
  `MaChiTietDoiSoat` int NOT NULL AUTO_INCREMENT,
  `MaDoiSoat` int NOT NULL,
  `MaDonHang` int NOT NULL,
  `MaNhaHang` int NOT NULL,
  `TongTienHang` decimal(18,0) NOT NULL,
  `GiamGiaNhaHang` decimal(18,0) NOT NULL DEFAULT 0,
  `GiamGiaHeThong` decimal(18,0) NOT NULL DEFAULT 0,
  `PhiShip` decimal(18,0) NOT NULL DEFAULT 0,
  `TyLePhiNenTang` decimal(5,2) NOT NULL DEFAULT 0,
  `PhiNenTang` decimal(18,0) NOT NULL DEFAULT 0,
  `SoTienHoan` decimal(18,0) NOT NULL DEFAULT 0,
  `SoTienNhaHangNhan` decimal(18,0) NOT NULL DEFAULT 0,
  `TienNhaHangDaThu` decimal(18,0) NOT NULL DEFAULT 0,
  `SoTienCanDoiSoat` decimal(18,0)
    GENERATED ALWAYS AS (`SoTienNhaHangNhan` - `TienNhaHangDaThu`) STORED,
  `NgayThem` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaChiTietDoiSoat`),
  UNIQUE KEY `UQ_ChiTietDoiSoat_DonHang` (`MaDonHang`),
  KEY `IX_ChiTietDoiSoat_Ky_NhaHang` (`MaDoiSoat`,`MaNhaHang`),
  KEY `IX_ChiTietDoiSoat_DonHang_NhaHang` (`MaDonHang`,`MaNhaHang`),
  CONSTRAINT `FK_ChiTietDoiSoat_Ky_NhaHang`
    FOREIGN KEY (`MaDoiSoat`,`MaNhaHang`)
    REFERENCES `doisoatnhahang` (`MaDoiSoat`,`MaNhaHang`),
  CONSTRAINT `FK_ChiTietDoiSoat_DonHang_NhaHang`
    FOREIGN KEY (`MaDonHang`,`MaNhaHang`)
    REFERENCES `donhang` (`MaDonHang`,`MaNhaHang`),
  CONSTRAINT `CK_ChiTietDoiSoat_TyLePhi` CHECK (`TyLePhiNenTang` BETWEEN 0 AND 100),
  CONSTRAINT `CK_ChiTietDoiSoat_SoTien` CHECK (
    `TongTienHang` >= 0 AND `GiamGiaNhaHang` >= 0
    AND `GiamGiaHeThong` >= 0 AND `PhiShip` >= 0
    AND `PhiNenTang` >= 0 AND `SoTienHoan` >= 0
    AND `SoTienNhaHangNhan` >= 0 AND `TienNhaHangDaThu` >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. danhgiamonan
CREATE TABLE `danhgiamonan` (
  `MaDanhGia` int NOT NULL AUTO_INCREMENT,
  `MaKhachHang` int NOT NULL,
  `MaMonAn` int NOT NULL,
  `MaDonHang` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NoiDung` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HinhAnh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayDanhGia` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDanhGia`),
  UNIQUE KEY `UQ_DanhGiaMonAn` (`MaKhachHang`,`MaMonAn`,`MaDonHang`),
  KEY `FK_DanhGiaMonAn_MonAn` (`MaMonAn`),
  KEY `FK_DanhGiaMonAn_DonHang` (`MaDonHang`),
  CONSTRAINT `FK_DanhGiaMonAn_DonHang` FOREIGN KEY (`MaDonHang`) REFERENCES `donhang` (`MaDonHang`),
  CONSTRAINT `FK_DanhGiaMonAn_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`),
  CONSTRAINT `FK_DanhGiaMonAn_MonAn` FOREIGN KEY (`MaMonAn`) REFERENCES `monan` (`MaMonAn`),
  CONSTRAINT `CK_DanhGiaMonAn_SoSao` CHECK ((`SoSao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. danhgianhahang
CREATE TABLE `danhgianhahang` (
  `MaDanhGia` int NOT NULL AUTO_INCREMENT,
  `MaKhachHang` int NOT NULL,
  `MaNhaHang` int NOT NULL,
  `MaDonHang` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NoiDung` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayDanhGia` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDanhGia`),
  UNIQUE KEY `UQ_DanhGiaNhaHang` (`MaKhachHang`,`MaNhaHang`,`MaDonHang`),
  KEY `FK_DanhGiaNhaHang_NhaHang` (`MaNhaHang`),
  KEY `FK_DanhGiaNhaHang_DonHang` (`MaDonHang`),
  CONSTRAINT `FK_DanhGiaNhaHang_DonHang` FOREIGN KEY (`MaDonHang`) REFERENCES `donhang` (`MaDonHang`),
  CONSTRAINT `FK_DanhGiaNhaHang_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`),
  CONSTRAINT `FK_DanhGiaNhaHang_NhaHang` FOREIGN KEY (`MaNhaHang`) REFERENCES `nhahang` (`MaNhaHang`),
  CONSTRAINT `CK_DanhGiaNhaHang_SoSao` CHECK ((`SoSao` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. thongbao
CREATE TABLE `thongbao` (
  `MaThongBao` int NOT NULL AUTO_INCREMENT,
  `MaTaiKhoan` int NOT NULL,
  `TieuDe` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NoiDung` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Loai` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DaDoc` tinyint(1) NOT NULL DEFAULT '0',
  `DuongDan` varchar(255) DEFAULT NULL,
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaThongBao`),
  KEY `FK_ThongBao_TaiKhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_ThongBao_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- B. KHOI PHUC DU LIEU GOC (khong thay doi mat khau)
-- ============================================================
-- Cac INSERT co danh sach cot cu the de tranh lech cot khi mo rong.
-- FK duoc bat suot qua trinh; loi du lieu khong bi bo qua.
START TRANSACTION;

INSERT INTO `role` (`MaRole`, `TenRole`, `MoTa`)
VALUES (1,'Admin','Quan tri he thong'),(2,'Quan','Chu nha hang / quan an'),(3,'KhachHang','Nguoi dat mon');

INSERT INTO `taikhoan` (`MaTaiKhoan`, `Email`, `MatKhau`, `SoDienThoai`, `MaRole`, `TrangThai`, `DaXacThucEmail`, `NgayTao`, `AnhDaiDien`)
VALUES (1,'admin@hethong.com','hashed_pass_123','0900000000',1,1,1,'2026-09-25 13:47:21',NULL),(2,'phuclong@gmail.com','hashed_pass_123','0901111111',2,1,1,'2026-09-25 13:47:21',NULL),(3,'mixue@gmail.com','hashed_pass_123','0902222222',2,1,1,'2026-09-25 13:47:21',NULL),(4,'khachhang1@gmail.com','hashed_pass_123','0903333333',3,1,1,'2026-09-25 13:47:21',NULL),(5,'khachhang2@gmail.com','hashed_pass_123','0904444444',3,1,1,'2026-09-25 13:47:21',NULL),(6,'danhgarena2005@gmail.com','PBKDF2$100000$3I4kde5o/BZBfSvT3JtVOg==$XVU5sN3OhXPwCN2NBGDEoKJ89o4ARMurEvjGCOAW/rs=','0123456789',3,1,0,'2026-09-25 13:53:36',NULL),(7,'nhahangtest@gmail.com','PBKDF2$100000$5wnU52NdHSKxh1SdTlw6Xw==$GuxGNpGi57IX1Smici3KUlsxAq0vRl9LvXkY6pDPVIk=','0909999998',2,1,1,'2026-09-27 19:30:27',NULL),(8,'admintest@gmail.com','PBKDF2$100000$5wnU52NdHSKxh1SdTlw6Xw==$GuxGNpGi57IX1Smici3KUlsxAq0vRl9LvXkY6pDPVIk=','0909999999',1,1,1,'2026-09-27 20:39:38',NULL),(9,'khach1@gmail.com','PBKDF2$100000$LDgKVpNA2HKPV74uw/9anQ==$tHe3n+xu4vUJI0r0+PnMGlIlqC9/OXttQO6hH35Wuk4=','0123456798',3,1,0,'2026-09-27 23:10:13',NULL);

INSERT INTO `khachhang` (`MaKhachHang`, `MaTaiKhoan`, `HoTen`, `NgaySinh`, `GioiTinh`, `DiemTichLuy`)
VALUES (1,4,'Nguyễn Văn Khách','2000-01-01','Nam',150),(2,5,'Trần Thị Hàng','2002-05-15','Nữ',0),(3,6,'Nguyễn Minh Danh','2025-03-12','Nam',0),(4,9,'NPC','2001-11-09','Nam',0);

INSERT INTO `nhahang` (`MaNhaHang`, `MaTaiKhoan`, `TenNhaHang`, `MoTa`, `DiaChiQuan`, `AnhBia`, `GioMoCua`, `GioDongCua`, `TrangThaiDuyet`, `TrangThaiHoatDong`, `DanhGiaTrungBinh`, `PhiShipMacDinh`)
VALUES (1,2,'Phúc Long Coffee & Tea','Thương hiệu trà và cà phê nổi tiếng','123 Lê Lợi, Q1, TP.HCM',NULL,'07:00:00','22:30:00','DaDuyet','MoCua',4.8,15000),(2,3,'Mixue Ice Cream & Tea','Kem và Trà sữa giá rẻ','456 Nguyễn Trãi, Q5, TP.HCM',NULL,'09:00:00','23:00:00','DaDuyet','MoCua',4.5,15000),(3,7,'Nhà Hàng Test 123','Nhà hàng dùng để test tài khoản','123 Nguyễn Huệ, Quận 1, TP.HCM',NULL,'08:00:00','00:00:00','DaDuyet','TamNgung',5,15000),(5,4,'The Coffee House','Không gian cà phê hiện đại, trẻ trung','45 Nguyễn Huệ, Q1, TP.HCM',NULL,'07:30:00','22:00:00','DaDuyet','MoCua',0,15000);

INSERT INTO `diachi` (`MaDiaChi`, `MaKhachHang`, `TenNguoiNhan`, `SoDienThoaiNhan`, `DiaChiCuThe`, `GhiChu`, `MacDinh`)
VALUES (1,1,'Nguyễn Văn Khách (Công ty)','0903333333','Tòa nhà Bitexco, Q1, TP.HCM',NULL,1),(2,1,'Nguyễn Văn Khách (Nhà)','0903333333','Hẻm 12 CMT8, Q10, TP.HCM',NULL,0);

INSERT INTO `danhmuc` (`MaDanhMuc`, `MaNhaHang`, `TenDanhMuc`, `ThuTuHienThi`)
VALUES (1,1,'Trà Sữa',1),(2,1,'Cà Phê',2);

INSERT INTO `monan` (`MaMonAn`, `MaNhaHang`, `MaDanhMuc`, `TenMonAn`, `MoTa`, `Gia`, `HinhAnh`, `TrangThai`, `DanhGiaTrungBinh`)
VALUES (1,1,1,'Trà Sữa Phúc Long','Đậm vị trà đặc trưng',45000,'ts_phuclong.jpg',1,0),(2,1,1,'Trà Đào Cam Sả','Thanh mát giải nhiệt',50000,'tradao.jpg',1,0),(3,1,2,'Cà Phê Sữa Đá','Cà phê rang xay nguyên chất',35000,'cf_sua.jpg',1,0);

INSERT INTO `nhomtopping` (`MaNhomTopping`, `MaNhaHang`, `TenNhom`, `BatBuocChon`, `ChonToiDa`)
VALUES (1,1,'Chọn Size',1,1),(2,1,'Topping Thêm',0,3);

INSERT INTO `topping` (`MaTopping`, `MaNhomTopping`, `TenTopping`, `GiaThem`, `TrangThai`)
VALUES (1,1,'Size M (Vừa)',0,1),(2,1,'Size L (Lớn)',10000,1),(3,2,'Trân châu đen',10000,1),(4,2,'Thạch lô hội',8000,1);

INSERT INTO `monan_nhomtopping` (`MaMonAn`, `MaNhomTopping`)
VALUES (1,1),(1,2);

INSERT INTO `trangthaidonhang` (`MaTrangThai`, `TenTrangThai`, `ThuTu`)
VALUES (1,'ChoXacNhan',1),(2,'DaXacNhan',2),(3,'DangChuanBi',3),(4,'DangGiao',4),(5,'HoanThanh',5),(6,'DaHuy',6);

INSERT INTO `khuyenmai` (`MaKhuyenMai`, `MaNhaHang`, `MaCode`, `MoTa`, `LoaiGiam`, `GiaTriGiam`, `GiamToiDa`, `DonHangToiThieu`, `SoLuong`, `SoLuongDaDung`, `NgayBatDau`, `NgayKetThuc`, `TrangThai`)
VALUES (1,3,'TEST','Mã để test','PhanTram',18,50000,100,100,0,'2026-09-26 19:38:00','2026-09-28 19:38:00',1),(2,3,'TEST 1','aaaaaaa','SoTien',20,111111,100000,36,0,'2026-09-06 19:42:00','2026-10-08 19:43:00',1),(3,NULL,'ADMINKM','Admin tạo mã toàn hệ thống','SoTien',100000,100000,1000000,100,0,'2026-09-02 21:18:00','2026-09-30 21:18:00',1),(4,NULL,'ADTEST2','aaaaaaa','PhanTram',10,11111,11111,100,0,'2026-09-08 21:30:00','2026-10-06 21:30:00',1),(5,NULL,'MAGIAMGIA·','GIẢM·','PhanTram',99,NULL,0,1,0,'2026-09-28 13:17:00','2026-09-29 13:17:00',1);

-- Don cu: 65.000 tien hang + 15.000 ship; khong ap phi hoi to.
INSERT INTO `donhang` (`MaDonHang`, `MaDonHangHienThi`, `MaKhachHang`, `MaNhaHang`, `MaDiaChi`, `MaTrangThai`, `MaKhuyenMai`, `ThoiGianDat`, `ThoiGianGiaoDuKien`, `ThoiGianGiaoThucTe`, `TenNguoiNhan`, `SoDienThoaiNhan`, `DiaChiGiaoHang`, `TongTienHang`, `PhiShip`, `SoTienGiam`, `ThanhTien`, `GhiChu`, `LyDoHuy`, `SoTienNhaHangNhan`)
VALUES (1,'DH-PL-000001',1,1,1,5,NULL,'2026-09-25 13:47:21',NULL,NULL,'Nguyễn Văn Khách (Công ty)','0903333333','Tòa nhà Bitexco, Q1, TP.HCM',65000,15000,0,80000,'Ít đá, nhiều ngọt',NULL,80000);

INSERT INTO `chitietdonhang` (`MaChiTietDonHang`, `MaDonHang`, `MaMonAn`, `SoLuong`, `DonGia`, `ThanhTien`, `GhiChu`)
VALUES (1,1,1,1,45000,45000,NULL);

INSERT INTO `chitietdonhang_topping` (`MaChiTietDonHang`, `MaTopping`, `SoLuong`, `GiaThemLucDat`)
VALUES (1,2,1,10000),(1,3,1,10000);

INSERT INTO `lichsutrangthaidonhang` (`MaLichSu`, `MaDonHang`, `MaTrangThai`, `MaTaiKhoan`, `ThoiGianTao`, `GhiChu`)
VALUES (1,1,1,4,'2026-09-25 13:47:22','Khách hàng đặt đơn'),(2,1,2,2,'2026-09-25 13:47:22','Quán xác nhận đơn'),(3,1,5,2,'2026-09-25 13:47:22','Giao hàng thành công');

INSERT INTO `phuongthucthanhtoan` (`MaPhuongThuc`, `TenPhuongThuc`, `TrangThai`)
VALUES (1,'COD',1),(2,'Momo',1),(3,'VNPay',1),(4,'ZaloPay',1);

INSERT INTO `thanhtoan` (`MaThanhToan`, `MaDonHang`, `MaPhuongThuc`, `SoTien`, `TrangThaiThanhToan`, `MaGiaoDich`, `ThoiGianThanhToan`)
VALUES (1,1,2,80000,'ThanhCong','MOMO_123456789',NULL);

INSERT INTO `danhgiamonan` (`MaDanhGia`, `MaKhachHang`, `MaMonAn`, `MaDonHang`, `SoSao`, `NoiDung`, `HinhAnh`, `NgayDanhGia`)
VALUES (1,1,1,1,5,'Trà sữa ngon, giao hàng nhanh!',NULL,'2026-09-25 13:47:22');

COMMIT;

-- ============================================================
-- C. QUY TAC BACKEND CAN BO SUNG
-- ============================================================
-- 1. Hop dong:
--    Chi Admin duoc duyet. Moi quan toi da 1 hop dong HieuLuc tai
--    mot thoi diem (kiem tra trong transaction khi duyet/gia han).
--    HieuLuc phai kem ngay trong khoang NgayBatDau..NgayKetThuc.
--    Ho so dang Nhap duoc phep thieu giay to; kiem tra day du khi nop.
--    Khong coi file upload hay checkbox la tu dong bao dam phap ly.
--
-- 2. Gio hang:
--    Them mon -> tim/tao gio theo (MaKhachHang, MaNhaHang cua mon).
--    Khong tao gio tai luc dang ky tai khoan.
--    Moi mon phai cung nha hang voi gio; BE bat buoc kiem tra.
--    Thanh toan 1 gio -> 1 don; chi xoa chi tiet cua gio vua dat.
--    Khong xoa cac gio cua nha hang khac.
--
-- 3. Snapshot phi va giam gia:
--    SoTienGiam = GiamGiaNhaHang + GiamGiaHeThong.
--    CoSoTinhPhi = TongTienHang - GiamGiaNhaHang (khong tinh ship).
--    PhiNenTang = ROUND(CoSoTinhPhi * TyLePhiNenTang / 100, 0).
--    SoTienNhaHangNhan = TongTienHang - GiamGiaNhaHang
--                       + PhiShip - PhiNenTang.
--    Gia dinh phi ship thuoc nha hang. Voucher he thong do he thong
--    chi tra; khong tru them vao so tien nha hang duoc huong.
--    Sao chep MaHopDong, ty le phi va so tien vao don khi tao don.
--    Chi ghi nhan phi/doanh thu khi HoanThanh; DaHuy thi phi = 0,
--    SoTienNhaHangNhan = 0. Khong tinh lai don cu theo hop dong moi.
--
-- 4. Hoan tien (pham vi: hoan toan bo 1 lan / 1 thanh toan):
--    Chi tao khi thanh toan ThanhCong va yeu cau huy duoc chap nhan.
--    SoTienHoan = so tien thuc da thu cua ThanhToan.
--    COD chua thu tien / online chua thanh cong: khong hoan.
--    MaYeuCauHoan la UUID/ma duy nhat do backend sinh; retry cung ma
--    de tranh hoan lap. Retry cap nhat ban ghi cu, khong INSERT moi.
--    Dung transaction + khoa ban ghi de kiem tra trang thai/so tien.
--    FK ghep dam bao MaThanhToan va MaDonHang thuoc cung giao dich.
--    Khong xoa/sua giao dich thu tien goc thanh ThatBai khi hoan.
--    Goi cong thanh toan ngoai DB transaction; webhook hop le moi
--    xac nhan ket qua. SQL nay khong tu chuyen tien that.
--
-- 5. Doi soat:
--    Chi gom don HoanThanh, da thu tien va chua duoc doi soat.
--    UNIQUE MaDonHang ngan tinh 1 don vao hai ky.
--    Hai FK ghep ngan gan don cua quan A vao ky cua quan B.
--    Pham vi nay khong xu ly dieu chinh sau khi ky da chot.
--    TongTienNhaHangNhan la QUYEN LOI, khong phai luon chuyen them.
--    TongTienNhaHangDaThu la tien quan da truc tiep thu (vi du COD).
--    SoTienCanDoiSoat = TongTienNhaHangNhan - TongTienNhaHangDaThu.
--      > 0: he thong tra quan; < 0: quan nop lai he thong; = 0: can bang.
--    Hai cot SoTienCanDoiSoat la GENERATED: khong INSERT/UPDATE truc tiep.
--    Tong so o bang ky do backend tinh tu chi tiet trong transaction.
--
-- 6. Du lieu cu duoc bao toan, nhung ban goc co diem can kiem tra:
--    MaNhaHang=5 dang dung MaTaiKhoan=4 co role KhachHang.
--    Mot so tai khoan mau co MatKhau='hashed_pass_123' (placeholder);
--    script KHONG biet va KHONG thay doi mat khau that cua ban.
--    Hop dong moi dang rong: sau khi them kiem tra hop dong vao BE,
--    cac quan cu can hoan tat ho so/duyet hop dong truoc khi nhan don.

-- ============================================================
-- D. KIEM TRA SAU KHI CHAY
-- ============================================================
SELECT COUNT(*) AS TongSoBang
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';

SELECT 'tai khoan' AS Loai, COUNT(*) AS SoLuong FROM taikhoan
UNION ALL SELECT 'khach hang', COUNT(*) FROM khachhang
UNION ALL SELECT 'nha hang', COUNT(*) FROM nhahang
UNION ALL SELECT 'mon an', COUNT(*) FROM monan
UNION ALL SELECT 'don hang', COUNT(*) FROM donhang
UNION ALL SELECT 'gio hang', COUNT(*) FROM giohang;

SELECT COUNT(*) AS GioBiTrung
FROM (
  SELECT MaKhachHang, MaNhaHang FROM giohang
  GROUP BY MaKhachHang, MaNhaHang HAVING COUNT(*) > 1
) g;

SELECT COUNT(*) AS MonKhacNhaHangCuaGio
FROM chitietgiohang ct
JOIN giohang g ON g.MaGioHang = ct.MaGioHang
JOIN monan m ON m.MaMonAn = ct.MaMonAn
WHERE g.MaNhaHang <> m.MaNhaHang;

SELECT COUNT(*) AS SoDonLechTongGiamGia
FROM donhang
WHERE SoTienGiam <> GiamGiaNhaHang + GiamGiaHeThong;

SELECT 'Hoan tat: 28 bang. Hay cap nhat/scaffold EF Core va sua backend + frontend.' AS KetQua;
