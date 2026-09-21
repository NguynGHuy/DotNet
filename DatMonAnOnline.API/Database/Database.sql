-- ============================================================
-- DATABASE: HE THONG DAT MON AN ONLINE
-- 25 BANG - 3 ROLE: KHACH HANG, QUAN (NHA HANG), ADMIN
-- Quan tu giao hang cho khach, khong su dung role Shipper rieng
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS DatMonAnOnline
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE DatMonAnOnline;

-- ============================================================
-- NHOM 1: TAI KHOAN & PHAN QUYEN
-- ============================================================

CREATE TABLE `Role` (
    MaRole      INT AUTO_INCREMENT PRIMARY KEY,
    TenRole     VARCHAR(50) NOT NULL UNIQUE,
    MoTa        VARCHAR(200) NULL
) ENGINE=InnoDB;

CREATE TABLE TaiKhoan (
    MaTaiKhoan      INT AUTO_INCREMENT PRIMARY KEY,
    Email           VARCHAR(100) NOT NULL UNIQUE,
    MatKhau         VARCHAR(255) NOT NULL,
    SoDienThoai     VARCHAR(15) NULL UNIQUE,
    MaRole          INT NOT NULL,
    TrangThai       TINYINT(1) NOT NULL DEFAULT 1,
    DaXacThucEmail  TINYINT(1) NOT NULL DEFAULT 0,
    NgayTao         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    AnhDaiDien      VARCHAR(255) NULL,
    CONSTRAINT FK_TaiKhoan_Role FOREIGN KEY (MaRole) REFERENCES `Role`(MaRole)
) ENGINE=InnoDB;

CREATE TABLE KhachHang (
    MaKhachHang     INT AUTO_INCREMENT PRIMARY KEY,
    MaTaiKhoan      INT NOT NULL UNIQUE,
    HoTen           VARCHAR(100) NOT NULL,
    NgaySinh        DATE NULL,
    GioiTinh        VARCHAR(10) NULL,
    DiemTichLuy     INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_KhachHang_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
) ENGINE=InnoDB;

CREATE TABLE NhaHang (
    MaNhaHang           INT AUTO_INCREMENT PRIMARY KEY,
    MaTaiKhoan          INT NOT NULL UNIQUE,
    TenNhaHang          VARCHAR(150) NOT NULL,
    MoTa                VARCHAR(500) NULL,
    DiaChiQuan          VARCHAR(255) NOT NULL,
    AnhBia              VARCHAR(255) NULL,
    GioMoCua            TIME NULL,
    GioDongCua          TIME NULL,
    TrangThaiDuyet      VARCHAR(20) NOT NULL DEFAULT 'ChoDuyet',
    TrangThaiHoatDong   ENUM('MoCua','DongCua','TamNgung') NOT NULL DEFAULT 'MoCua',
    DanhGiaTrungBinh    FLOAT NOT NULL DEFAULT 0,
    PhiShipMacDinh      DECIMAL(18,0) NOT NULL DEFAULT 15000,
    CONSTRAINT FK_NhaHang_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
) ENGINE=InnoDB;

CREATE TABLE DiaChi (
    MaDiaChi            INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang         INT NOT NULL,
    TenNguoiNhan        VARCHAR(100) NOT NULL,
    SoDienThoaiNhan     VARCHAR(15) NOT NULL,
    DiaChiCuThe         VARCHAR(255) NOT NULL,
    GhiChu              VARCHAR(100) NULL,
    MacDinh             TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT FK_DiaChi_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
) ENGINE=InnoDB;

-- ============================================================
-- NHOM 2: MON AN & DANH MUC
-- ============================================================

CREATE TABLE DanhMuc (
    MaDanhMuc       INT AUTO_INCREMENT PRIMARY KEY,
    MaNhaHang       INT NOT NULL,
    TenDanhMuc      VARCHAR(100) NOT NULL,
    ThuTuHienThi    INT NULL,
    CONSTRAINT FK_DanhMuc_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang)
) ENGINE=InnoDB;

CREATE TABLE MonAn (
    MaMonAn             INT AUTO_INCREMENT PRIMARY KEY,
    MaNhaHang           INT NOT NULL,
    MaDanhMuc           INT NOT NULL,
    TenMonAn            VARCHAR(150) NOT NULL,
    MoTa                VARCHAR(500) NULL,
    Gia                 DECIMAL(18,0) NOT NULL,
    HinhAnh             VARCHAR(255) NULL,
    TrangThai           TINYINT(1) NOT NULL DEFAULT 1,
    DanhGiaTrungBinh    FLOAT NOT NULL DEFAULT 0,
    CONSTRAINT FK_MonAn_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang),
    CONSTRAINT FK_MonAn_DanhMuc FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
) ENGINE=InnoDB;

CREATE TABLE NhomTopping (
    MaNhomTopping   INT AUTO_INCREMENT PRIMARY KEY,
    MaNhaHang       INT NOT NULL,
    TenNhom         VARCHAR(100) NOT NULL,
    BatBuocChon     TINYINT(1) NOT NULL DEFAULT 0,
    ChonToiDa       INT NULL,
    CONSTRAINT FK_NhomTopping_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang)
) ENGINE=InnoDB;

CREATE TABLE Topping (
    MaTopping       INT AUTO_INCREMENT PRIMARY KEY,
    MaNhomTopping   INT NOT NULL,
    TenTopping      VARCHAR(100) NOT NULL,
    GiaThem         DECIMAL(18,0) NOT NULL DEFAULT 0,
    TrangThai       TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT FK_Topping_NhomTopping FOREIGN KEY (MaNhomTopping) REFERENCES NhomTopping(MaNhomTopping)
) ENGINE=InnoDB;

CREATE TABLE MonAn_NhomTopping (
    MaMonAn         INT NOT NULL,
    MaNhomTopping   INT NOT NULL,
    PRIMARY KEY (MaMonAn, MaNhomTopping),
    CONSTRAINT FK_MonAnNhomTopping_MonAn FOREIGN KEY (MaMonAn) REFERENCES MonAn(MaMonAn),
    CONSTRAINT FK_MonAnNhomTopping_NhomTopping FOREIGN KEY (MaNhomTopping) REFERENCES NhomTopping(MaNhomTopping)
) ENGINE=InnoDB;

-- ============================================================
-- NHOM 3: GIO HANG
-- ============================================================

CREATE TABLE GioHang (
    MaGioHang       INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang     INT NOT NULL UNIQUE,
    NgayCapNhat     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_GioHang_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
) ENGINE=InnoDB;

CREATE TABLE ChiTietGioHang (
    MaChiTietGioHang    INT AUTO_INCREMENT PRIMARY KEY,
    MaGioHang           INT NOT NULL,
    MaMonAn             INT NOT NULL,
    SoLuong             INT NOT NULL DEFAULT 1,
    GhiChu              VARCHAR(200) NULL,
    CONSTRAINT FK_ChiTietGioHang_GioHang FOREIGN KEY (MaGioHang) REFERENCES GioHang(MaGioHang),
    CONSTRAINT FK_ChiTietGioHang_MonAn FOREIGN KEY (MaMonAn) REFERENCES MonAn(MaMonAn)
) ENGINE=InnoDB;

CREATE TABLE ChiTietGioHang_Topping (
    MaChiTietGioHang    INT NOT NULL,
    MaTopping           INT NOT NULL,
    SoLuong             INT NOT NULL DEFAULT 1,
    GiaThem             DECIMAL(18,0) NOT NULL,
    PRIMARY KEY (MaChiTietGioHang, MaTopping),
    CONSTRAINT FK_CTGHTopping_ChiTietGioHang FOREIGN KEY (MaChiTietGioHang) REFERENCES ChiTietGioHang(MaChiTietGioHang),
    CONSTRAINT FK_CTGHTopping_Topping FOREIGN KEY (MaTopping) REFERENCES Topping(MaTopping)
) ENGINE=InnoDB;

-- ============================================================
-- NHOM 4: DON HANG
-- ============================================================

CREATE TABLE TrangThaiDonHang (
    MaTrangThai     INT AUTO_INCREMENT PRIMARY KEY,
    TenTrangThai    VARCHAR(50) NOT NULL UNIQUE,
    ThuTu           INT NULL
) ENGINE=InnoDB;

CREATE TABLE KhuyenMai (
    MaKhuyenMai         INT AUTO_INCREMENT PRIMARY KEY,
    MaNhaHang           INT NULL,
    MaCode              VARCHAR(30) NOT NULL UNIQUE,
    MoTa                VARCHAR(200) NULL,
    LoaiGiam            VARCHAR(20) NOT NULL,
    GiaTriGiam          DECIMAL(18,0) NOT NULL,
    GiamToiDa           DECIMAL(18,0) NULL,
    DonHangToiThieu     DECIMAL(18,0) NOT NULL DEFAULT 0,
    SoLuong             INT NOT NULL,
    SoLuongDaDung       INT NOT NULL DEFAULT 0,
    NgayBatDau          DATETIME NOT NULL,
    NgayKetThuc         DATETIME NOT NULL,
    TrangThai           TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT FK_KhuyenMai_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang),
    CONSTRAINT CK_KhuyenMai_LoaiGiam CHECK (LoaiGiam IN ('PhanTram', 'SoTien'))
) ENGINE=InnoDB;

CREATE TABLE DonHang (
    MaDonHang           INT AUTO_INCREMENT PRIMARY KEY,
    MaDonHangHienThi    VARCHAR(50) NOT NULL UNIQUE,
    MaKhachHang         INT NOT NULL,
    MaNhaHang           INT NOT NULL,
    MaDiaChi            INT NULL,
    MaTrangThai         INT NOT NULL,
    MaKhuyenMai         INT NULL,
    ThoiGianDat         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ThoiGianGiaoDuKien  DATETIME NULL,
    ThoiGianGiaoThucTe  DATETIME NULL,
    TenNguoiNhan        VARCHAR(100) NOT NULL,
    SoDienThoaiNhan     VARCHAR(15) NOT NULL,
    DiaChiGiaoHang      VARCHAR(255) NOT NULL,
    TongTienHang        DECIMAL(18,0) NOT NULL,
    PhiShip             DECIMAL(18,0) NOT NULL DEFAULT 0,
    SoTienGiam          DECIMAL(18,0) NOT NULL DEFAULT 0,
    ThanhTien           DECIMAL(18,0) NOT NULL,
    GhiChu              VARCHAR(300) NULL,
    LyDoHuy             VARCHAR(500) NULL,
    CONSTRAINT FK_DonHang_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DonHang_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang),
    CONSTRAINT FK_DonHang_DiaChi FOREIGN KEY (MaDiaChi) REFERENCES DiaChi(MaDiaChi) ON DELETE SET NULL,
    CONSTRAINT FK_DonHang_TrangThai FOREIGN KEY (MaTrangThai) REFERENCES TrangThaiDonHang(MaTrangThai),
    CONSTRAINT FK_DonHang_KhuyenMai FOREIGN KEY (MaKhuyenMai) REFERENCES KhuyenMai(MaKhuyenMai)
) ENGINE=InnoDB;

CREATE TABLE ChiTietDonHang (
    MaChiTietDonHang    INT AUTO_INCREMENT PRIMARY KEY,
    MaDonHang           INT NOT NULL,
    MaMonAn             INT NOT NULL,
    SoLuong             INT NOT NULL,
    DonGia              DECIMAL(18,0) NOT NULL,
    ThanhTien           DECIMAL(18,0) NOT NULL,
    GhiChu              VARCHAR(255) NULL,
    CONSTRAINT FK_ChiTietDonHang_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_ChiTietDonHang_MonAn FOREIGN KEY (MaMonAn) REFERENCES MonAn(MaMonAn)
) ENGINE=InnoDB;

CREATE TABLE ChiTietDonHang_Topping (
    MaChiTietDonHang    INT NOT NULL,
    MaTopping           INT NOT NULL,
    SoLuong             INT NOT NULL DEFAULT 1,
    GiaThemLucDat       DECIMAL(18,0) NOT NULL,
    PRIMARY KEY (MaChiTietDonHang, MaTopping),
    CONSTRAINT FK_CTDHTopping_ChiTietDonHang FOREIGN KEY (MaChiTietDonHang) REFERENCES ChiTietDonHang(MaChiTietDonHang),
    CONSTRAINT FK_CTDHTopping_Topping FOREIGN KEY (MaTopping) REFERENCES Topping(MaTopping)
) ENGINE=InnoDB;

CREATE TABLE LichSuTrangThaiDonHang (
    MaLichSu        INT AUTO_INCREMENT PRIMARY KEY,
    MaDonHang       INT NOT NULL,
    MaTrangThai     INT NOT NULL,
    MaTaiKhoan      INT NOT NULL,
    ThoiGianTao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    GhiChu          VARCHAR(200) NULL,
    CONSTRAINT FK_LichSu_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_LichSu_TrangThai FOREIGN KEY (MaTrangThai) REFERENCES TrangThaiDonHang(MaTrangThai),
    CONSTRAINT FK_LichSu_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
) ENGINE=InnoDB;

-- ============================================================
-- NHOM 5: THANH TOAN
-- ============================================================

CREATE TABLE PhuongThucThanhToan (
    MaPhuongThuc    INT AUTO_INCREMENT PRIMARY KEY,
    TenPhuongThuc   VARCHAR(50) NOT NULL UNIQUE,
    TrangThai       TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE ThanhToan (
    MaThanhToan             INT AUTO_INCREMENT PRIMARY KEY,
    MaDonHang               INT NOT NULL,
    MaPhuongThuc            INT NOT NULL,
    SoTien                  DECIMAL(18,0) NOT NULL,
    TrangThaiThanhToan      VARCHAR(20) NOT NULL DEFAULT 'ChoThanhToan',
    MaGiaoDich              VARCHAR(100) NULL,
    ThoiGianThanhToan       DATETIME NULL,
    CONSTRAINT FK_ThanhToan_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_ThanhToan_PhuongThuc FOREIGN KEY (MaPhuongThuc) REFERENCES PhuongThucThanhToan(MaPhuongThuc)
) ENGINE=InnoDB;

-- ============================================================
-- NHOM 6: DANH GIA & THONG BAO
-- ============================================================

CREATE TABLE DanhGiaMonAn (
    MaDanhGia       INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang     INT NOT NULL,
    MaMonAn         INT NOT NULL,
    MaDonHang       INT NOT NULL,
    SoSao           TINYINT NOT NULL,
    NoiDung         VARCHAR(500) NULL,
    HinhAnh         VARCHAR(255) NULL,
    NgayDanhGia     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_DanhGiaMonAn_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DanhGiaMonAn_MonAn FOREIGN KEY (MaMonAn) REFERENCES MonAn(MaMonAn),
    CONSTRAINT FK_DanhGiaMonAn_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT CK_DanhGiaMonAn_SoSao CHECK (SoSao BETWEEN 1 AND 5),
    CONSTRAINT UQ_DanhGiaMonAn UNIQUE (MaKhachHang, MaMonAn, MaDonHang)
) ENGINE=InnoDB;

CREATE TABLE DanhGiaNhaHang (
    MaDanhGia       INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang     INT NOT NULL,
    MaNhaHang       INT NOT NULL,
    MaDonHang       INT NOT NULL,
    SoSao           TINYINT NOT NULL,
    NoiDung         VARCHAR(500) NULL,
    NgayDanhGia     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_DanhGiaNhaHang_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DanhGiaNhaHang_NhaHang FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang),
    CONSTRAINT FK_DanhGiaNhaHang_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT CK_DanhGiaNhaHang_SoSao CHECK (SoSao BETWEEN 1 AND 5),
    CONSTRAINT UQ_DanhGiaNhaHang UNIQUE (MaKhachHang, MaNhaHang, MaDonHang)
) ENGINE=InnoDB;

CREATE TABLE ThongBao (
    MaThongBao      INT AUTO_INCREMENT PRIMARY KEY,
    MaTaiKhoan      INT NOT NULL,
    TieuDe          VARCHAR(150) NOT NULL,
    NoiDung         VARCHAR(500) NOT NULL,
    Loai            VARCHAR(30) NULL,
    DaDoc           TINYINT(1) NOT NULL DEFAULT 0,
    NgayTao         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
) ENGINE=InnoDB;

-- ============================================================
-- DU LIEU MAU CO BAN
-- ============================================================

INSERT INTO `Role` (TenRole, MoTa) VALUES
('Admin', 'Quan tri he thong'),
('Quan', 'Chu nha hang / quan an'),
('KhachHang', 'Nguoi dat mon');

INSERT INTO TrangThaiDonHang (TenTrangThai, ThuTu) VALUES
('ChoXacNhan', 1),
('DaXacNhan', 2),
('DangChuanBi', 3),
('DangGiao', 4),
('HoanThanh', 5),
('DaHuy', 6);

INSERT INTO PhuongThucThanhToan (TenPhuongThuc) VALUES
('COD'),
('Momo'),
('VNPay'),
('ZaloPay');
