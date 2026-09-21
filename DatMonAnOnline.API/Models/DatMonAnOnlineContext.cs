using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace DatMonAnOnline.API.Models;

public partial class DatMonAnOnlineContext : DbContext
{
    public DatMonAnOnlineContext()
    {
    }

    public DatMonAnOnlineContext(DbContextOptions<DatMonAnOnlineContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Chitietdonhang> Chitietdonhangs { get; set; }

    public virtual DbSet<ChitietdonhangTopping> ChitietdonhangToppings { get; set; }

    public virtual DbSet<Chitietgiohang> Chitietgiohangs { get; set; }

    public virtual DbSet<ChitietgiohangTopping> ChitietgiohangToppings { get; set; }

    public virtual DbSet<Danhgiamonan> Danhgiamonans { get; set; }

    public virtual DbSet<Danhgianhahang> Danhgianhahangs { get; set; }

    public virtual DbSet<Danhmuc> Danhmucs { get; set; }

    public virtual DbSet<Diachi> Diachis { get; set; }

    public virtual DbSet<Donhang> Donhangs { get; set; }

    public virtual DbSet<Giohang> Giohangs { get; set; }

    public virtual DbSet<Khachhang> Khachhangs { get; set; }

    public virtual DbSet<Khuyenmai> Khuyenmais { get; set; }

    public virtual DbSet<Lichsutrangthaidonhang> Lichsutrangthaidonhangs { get; set; }

    public virtual DbSet<Monan> Monans { get; set; }

    public virtual DbSet<Nhahang> Nhahangs { get; set; }

    public virtual DbSet<Nhomtopping> Nhomtoppings { get; set; }

    public virtual DbSet<Phuongthucthanhtoan> Phuongthucthanhtoans { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Taikhoan> Taikhoans { get; set; }

    public virtual DbSet<Thanhtoan> Thanhtoans { get; set; }

    public virtual DbSet<Thongbao> Thongbaos { get; set; }

    public virtual DbSet<Topping> Toppings { get; set; }

    public virtual DbSet<Trangthaidonhang> Trangthaidonhangs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseMySql("name=ConnectionStrings:DefaultConnection", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.45-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_unicode_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Chitietdonhang>(entity =>
        {
            entity.HasKey(e => e.MaChiTietDonHang).HasName("PRIMARY");

            entity.ToTable("chitietdonhang");

            entity.HasIndex(e => e.MaDonHang, "FK_ChiTietDonHang_DonHang");

            entity.HasIndex(e => e.MaMonAn, "FK_ChiTietDonHang_MonAn");

            entity.Property(e => e.DonGia).HasPrecision(18);
            entity.Property(e => e.GhiChu).HasMaxLength(255);
            entity.Property(e => e.ThanhTien).HasPrecision(18);

            entity.HasOne(d => d.MaDonHangNavigation).WithMany(p => p.Chitietdonhangs)
                .HasForeignKey(d => d.MaDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietDonHang_DonHang");

            entity.HasOne(d => d.MaMonAnNavigation).WithMany(p => p.Chitietdonhangs)
                .HasForeignKey(d => d.MaMonAn)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietDonHang_MonAn");
        });

        modelBuilder.Entity<ChitietdonhangTopping>(entity =>
        {
            entity.HasKey(e => new { e.MaChiTietDonHang, e.MaTopping })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("chitietdonhang_topping");

            entity.HasIndex(e => e.MaTopping, "FK_CTDHTopping_Topping");

            entity.Property(e => e.GiaThemLucDat).HasPrecision(18);
            entity.Property(e => e.SoLuong).HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaChiTietDonHangNavigation).WithMany(p => p.ChitietdonhangToppings)
                .HasForeignKey(d => d.MaChiTietDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTDHTopping_ChiTietDonHang");

            entity.HasOne(d => d.MaToppingNavigation).WithMany(p => p.ChitietdonhangToppings)
                .HasForeignKey(d => d.MaTopping)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTDHTopping_Topping");
        });

        modelBuilder.Entity<Chitietgiohang>(entity =>
        {
            entity.HasKey(e => e.MaChiTietGioHang).HasName("PRIMARY");

            entity.ToTable("chitietgiohang");

            entity.HasIndex(e => e.MaGioHang, "FK_ChiTietGioHang_GioHang");

            entity.HasIndex(e => e.MaMonAn, "FK_ChiTietGioHang_MonAn");

            entity.Property(e => e.GhiChu).HasMaxLength(200);
            entity.Property(e => e.SoLuong).HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaGioHangNavigation).WithMany(p => p.Chitietgiohangs)
                .HasForeignKey(d => d.MaGioHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietGioHang_GioHang");

            entity.HasOne(d => d.MaMonAnNavigation).WithMany(p => p.Chitietgiohangs)
                .HasForeignKey(d => d.MaMonAn)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietGioHang_MonAn");
        });

        modelBuilder.Entity<ChitietgiohangTopping>(entity =>
        {
            entity.HasKey(e => new { e.MaChiTietGioHang, e.MaTopping })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("chitietgiohang_topping");

            entity.HasIndex(e => e.MaTopping, "FK_CTGHTopping_Topping");

            entity.Property(e => e.GiaThem).HasPrecision(18);
            entity.Property(e => e.SoLuong).HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaChiTietGioHangNavigation).WithMany(p => p.ChitietgiohangToppings)
                .HasForeignKey(d => d.MaChiTietGioHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTGHTopping_ChiTietGioHang");

            entity.HasOne(d => d.MaToppingNavigation).WithMany(p => p.ChitietgiohangToppings)
                .HasForeignKey(d => d.MaTopping)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTGHTopping_Topping");
        });

        modelBuilder.Entity<Danhgiamonan>(entity =>
        {
            entity.HasKey(e => e.MaDanhGia).HasName("PRIMARY");

            entity.ToTable("danhgiamonan");

            entity.HasIndex(e => e.MaDonHang, "FK_DanhGiaMonAn_DonHang");

            entity.HasIndex(e => e.MaMonAn, "FK_DanhGiaMonAn_MonAn");

            entity.HasIndex(e => new { e.MaKhachHang, e.MaMonAn, e.MaDonHang }, "UQ_DanhGiaMonAn").IsUnique();

            entity.Property(e => e.HinhAnh).HasMaxLength(255);
            entity.Property(e => e.NgayDanhGia)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.NoiDung).HasMaxLength(500);

            entity.HasOne(d => d.MaDonHangNavigation).WithMany(p => p.Danhgiamonans)
                .HasForeignKey(d => d.MaDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaMonAn_DonHang");

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.Danhgiamonans)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaMonAn_KhachHang");

            entity.HasOne(d => d.MaMonAnNavigation).WithMany(p => p.Danhgiamonans)
                .HasForeignKey(d => d.MaMonAn)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaMonAn_MonAn");
        });

        modelBuilder.Entity<Danhgianhahang>(entity =>
        {
            entity.HasKey(e => e.MaDanhGia).HasName("PRIMARY");

            entity.ToTable("danhgianhahang");

            entity.HasIndex(e => e.MaDonHang, "FK_DanhGiaNhaHang_DonHang");

            entity.HasIndex(e => e.MaNhaHang, "FK_DanhGiaNhaHang_NhaHang");

            entity.HasIndex(e => new { e.MaKhachHang, e.MaNhaHang, e.MaDonHang }, "UQ_DanhGiaNhaHang").IsUnique();

            entity.Property(e => e.NgayDanhGia)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.NoiDung).HasMaxLength(500);

            entity.HasOne(d => d.MaDonHangNavigation).WithMany(p => p.Danhgianhahangs)
                .HasForeignKey(d => d.MaDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaNhaHang_DonHang");

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.Danhgianhahangs)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaNhaHang_KhachHang");

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Danhgianhahangs)
                .HasForeignKey(d => d.MaNhaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaNhaHang_NhaHang");
        });

        modelBuilder.Entity<Danhmuc>(entity =>
        {
            entity.HasKey(e => e.MaDanhMuc).HasName("PRIMARY");

            entity.ToTable("danhmuc");

            entity.HasIndex(e => e.MaNhaHang, "FK_DanhMuc_NhaHang");

            entity.Property(e => e.TenDanhMuc).HasMaxLength(100);

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Danhmucs)
                .HasForeignKey(d => d.MaNhaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhMuc_NhaHang");
        });

        modelBuilder.Entity<Diachi>(entity =>
        {
            entity.HasKey(e => e.MaDiaChi).HasName("PRIMARY");

            entity.ToTable("diachi");

            entity.HasIndex(e => e.MaKhachHang, "FK_DiaChi_KhachHang");

            entity.Property(e => e.DiaChiCuThe).HasMaxLength(255);
            entity.Property(e => e.GhiChu).HasMaxLength(100);
            entity.Property(e => e.SoDienThoaiNhan).HasMaxLength(15);
            entity.Property(e => e.TenNguoiNhan).HasMaxLength(100);

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.Diachis)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DiaChi_KhachHang");
        });

        modelBuilder.Entity<Donhang>(entity =>
        {
            entity.HasKey(e => e.MaDonHang).HasName("PRIMARY");

            entity.ToTable("donhang");

            entity.HasIndex(e => e.MaDiaChi, "FK_DonHang_DiaChi");

            entity.HasIndex(e => e.MaKhachHang, "FK_DonHang_KhachHang");

            entity.HasIndex(e => e.MaKhuyenMai, "FK_DonHang_KhuyenMai");

            entity.HasIndex(e => e.MaNhaHang, "FK_DonHang_NhaHang");

            entity.HasIndex(e => e.MaTrangThai, "FK_DonHang_TrangThai");

            entity.HasIndex(e => e.MaDonHangHienThi, "MaDonHangHienThi").IsUnique();

            entity.Property(e => e.DiaChiGiaoHang).HasMaxLength(255);
            entity.Property(e => e.GhiChu).HasMaxLength(300);
            entity.Property(e => e.LyDoHuy).HasMaxLength(500);
            entity.Property(e => e.MaDonHangHienThi).HasMaxLength(50);
            entity.Property(e => e.PhiShip).HasPrecision(18);
            entity.Property(e => e.SoDienThoaiNhan).HasMaxLength(15);
            entity.Property(e => e.SoTienGiam).HasPrecision(18);
            entity.Property(e => e.TenNguoiNhan).HasMaxLength(100);
            entity.Property(e => e.ThanhTien).HasPrecision(18);
            entity.Property(e => e.ThoiGianDat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ThoiGianGiaoDuKien).HasColumnType("datetime");
            entity.Property(e => e.ThoiGianGiaoThucTe).HasColumnType("datetime");
            entity.Property(e => e.TongTienHang).HasPrecision(18);

            entity.HasOne(d => d.MaDiaChiNavigation).WithMany(p => p.Donhangs)
                .HasForeignKey(d => d.MaDiaChi)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_DonHang_DiaChi");

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.Donhangs)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonHang_KhachHang");

            entity.HasOne(d => d.MaKhuyenMaiNavigation).WithMany(p => p.Donhangs)
                .HasForeignKey(d => d.MaKhuyenMai)
                .HasConstraintName("FK_DonHang_KhuyenMai");

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Donhangs)
                .HasForeignKey(d => d.MaNhaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonHang_NhaHang");

            entity.HasOne(d => d.MaTrangThaiNavigation).WithMany(p => p.Donhangs)
                .HasForeignKey(d => d.MaTrangThai)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonHang_TrangThai");
        });

        modelBuilder.Entity<Giohang>(entity =>
        {
            entity.HasKey(e => e.MaGioHang).HasName("PRIMARY");

            entity.ToTable("giohang");

            entity.HasIndex(e => e.MaKhachHang, "MaKhachHang").IsUnique();

            entity.Property(e => e.NgayCapNhat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.MaKhachHangNavigation).WithOne(p => p.Giohang)
                .HasForeignKey<Giohang>(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GioHang_KhachHang");
        });

        modelBuilder.Entity<Khachhang>(entity =>
        {
            entity.HasKey(e => e.MaKhachHang).HasName("PRIMARY");

            entity.ToTable("khachhang");

            entity.HasIndex(e => e.MaTaiKhoan, "MaTaiKhoan").IsUnique();

            entity.Property(e => e.GioiTinh).HasMaxLength(10);
            entity.Property(e => e.HoTen).HasMaxLength(100);

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithOne(p => p.Khachhang)
                .HasForeignKey<Khachhang>(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KhachHang_TaiKhoan");
        });

        modelBuilder.Entity<Khuyenmai>(entity =>
        {
            entity.HasKey(e => e.MaKhuyenMai).HasName("PRIMARY");

            entity.ToTable("khuyenmai");

            entity.HasIndex(e => e.MaNhaHang, "FK_KhuyenMai_NhaHang");

            entity.HasIndex(e => e.MaCode, "MaCode").IsUnique();

            entity.Property(e => e.DonHangToiThieu).HasPrecision(18);
            entity.Property(e => e.GiaTriGiam).HasPrecision(18);
            entity.Property(e => e.GiamToiDa).HasPrecision(18);
            entity.Property(e => e.LoaiGiam).HasMaxLength(20);
            entity.Property(e => e.MaCode).HasMaxLength(30);
            entity.Property(e => e.MoTa).HasMaxLength(200);
            entity.Property(e => e.NgayBatDau).HasColumnType("datetime");
            entity.Property(e => e.NgayKetThuc).HasColumnType("datetime");
            entity.Property(e => e.TrangThai)
                .IsRequired()
                .HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Khuyenmais)
                .HasForeignKey(d => d.MaNhaHang)
                .HasConstraintName("FK_KhuyenMai_NhaHang");
        });

        modelBuilder.Entity<Lichsutrangthaidonhang>(entity =>
        {
            entity.HasKey(e => e.MaLichSu).HasName("PRIMARY");

            entity.ToTable("lichsutrangthaidonhang");

            entity.HasIndex(e => e.MaDonHang, "FK_LichSu_DonHang");

            entity.HasIndex(e => e.MaTaiKhoan, "FK_LichSu_TaiKhoan");

            entity.HasIndex(e => e.MaTrangThai, "FK_LichSu_TrangThai");

            entity.Property(e => e.GhiChu).HasMaxLength(200);
            entity.Property(e => e.ThoiGianTao)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.MaDonHangNavigation).WithMany(p => p.Lichsutrangthaidonhangs)
                .HasForeignKey(d => d.MaDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSu_DonHang");

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithMany(p => p.Lichsutrangthaidonhangs)
                .HasForeignKey(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSu_TaiKhoan");

            entity.HasOne(d => d.MaTrangThaiNavigation).WithMany(p => p.Lichsutrangthaidonhangs)
                .HasForeignKey(d => d.MaTrangThai)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSu_TrangThai");
        });

        modelBuilder.Entity<Monan>(entity =>
        {
            entity.HasKey(e => e.MaMonAn).HasName("PRIMARY");

            entity.ToTable("monan");

            entity.HasIndex(e => e.MaDanhMuc, "FK_MonAn_DanhMuc");

            entity.HasIndex(e => e.MaNhaHang, "FK_MonAn_NhaHang");

            entity.Property(e => e.Gia).HasPrecision(18);
            entity.Property(e => e.HinhAnh).HasMaxLength(255);
            entity.Property(e => e.MoTa).HasMaxLength(500);
            entity.Property(e => e.TenMonAn).HasMaxLength(150);
            entity.Property(e => e.TrangThai)
                .IsRequired()
                .HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaDanhMucNavigation).WithMany(p => p.Monans)
                .HasForeignKey(d => d.MaDanhMuc)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MonAn_DanhMuc");

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Monans)
                .HasForeignKey(d => d.MaNhaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MonAn_NhaHang");

            entity.HasMany(d => d.MaNhomToppings).WithMany(p => p.MaMonAns)
                .UsingEntity<Dictionary<string, object>>(
                    "MonanNhomtopping",
                    r => r.HasOne<Nhomtopping>().WithMany()
                        .HasForeignKey("MaNhomTopping")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_MonAnNhomTopping_NhomTopping"),
                    l => l.HasOne<Monan>().WithMany()
                        .HasForeignKey("MaMonAn")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_MonAnNhomTopping_MonAn"),
                    j =>
                    {
                        j.HasKey("MaMonAn", "MaNhomTopping")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("monan_nhomtopping");
                        j.HasIndex(new[] { "MaNhomTopping" }, "FK_MonAnNhomTopping_NhomTopping");
                    });
        });

        modelBuilder.Entity<Nhahang>(entity =>
        {
            entity.HasKey(e => e.MaNhaHang).HasName("PRIMARY");

            entity.ToTable("nhahang");

            entity.HasIndex(e => e.MaTaiKhoan, "MaTaiKhoan").IsUnique();

            entity.Property(e => e.AnhBia).HasMaxLength(255);
            entity.Property(e => e.DiaChiQuan).HasMaxLength(255);
            entity.Property(e => e.GioDongCua).HasColumnType("time");
            entity.Property(e => e.GioMoCua).HasColumnType("time");
            entity.Property(e => e.MoTa).HasMaxLength(500);
            entity.Property(e => e.PhiShipMacDinh)
                .HasPrecision(18)
                .HasDefaultValueSql("'15000'");
            entity.Property(e => e.TenNhaHang).HasMaxLength(150);
            entity.Property(e => e.TrangThaiDuyet)
                .HasMaxLength(20)
                .HasDefaultValueSql("'ChoDuyet'");
            entity.Property(e => e.TrangThaiHoatDong)
                .HasDefaultValueSql("'MoCua'")
                .HasColumnType("enum('MoCua','DongCua','TamNgung')");

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithOne(p => p.Nhahang)
                .HasForeignKey<Nhahang>(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NhaHang_TaiKhoan");
        });

        modelBuilder.Entity<Nhomtopping>(entity =>
        {
            entity.HasKey(e => e.MaNhomTopping).HasName("PRIMARY");

            entity.ToTable("nhomtopping");

            entity.HasIndex(e => e.MaNhaHang, "FK_NhomTopping_NhaHang");

            entity.Property(e => e.TenNhom).HasMaxLength(100);

            entity.HasOne(d => d.MaNhaHangNavigation).WithMany(p => p.Nhomtoppings)
                .HasForeignKey(d => d.MaNhaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NhomTopping_NhaHang");
        });

        modelBuilder.Entity<Phuongthucthanhtoan>(entity =>
        {
            entity.HasKey(e => e.MaPhuongThuc).HasName("PRIMARY");

            entity.ToTable("phuongthucthanhtoan");

            entity.HasIndex(e => e.TenPhuongThuc, "TenPhuongThuc").IsUnique();

            entity.Property(e => e.TenPhuongThuc).HasMaxLength(50);
            entity.Property(e => e.TrangThai)
                .IsRequired()
                .HasDefaultValueSql("'1'");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.MaRole).HasName("PRIMARY");

            entity.ToTable("role");

            entity.HasIndex(e => e.TenRole, "TenRole").IsUnique();

            entity.Property(e => e.MoTa).HasMaxLength(200);
            entity.Property(e => e.TenRole).HasMaxLength(50);
        });

        modelBuilder.Entity<Taikhoan>(entity =>
        {
            entity.HasKey(e => e.MaTaiKhoan).HasName("PRIMARY");

            entity.ToTable("taikhoan");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.MaRole, "FK_TaiKhoan_Role");

            entity.HasIndex(e => e.SoDienThoai, "SoDienThoai").IsUnique();

            entity.Property(e => e.AnhDaiDien).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.MatKhau).HasMaxLength(255);
            entity.Property(e => e.NgayTao)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.SoDienThoai).HasMaxLength(15);
            entity.Property(e => e.TrangThai)
                .IsRequired()
                .HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaRoleNavigation).WithMany(p => p.Taikhoans)
                .HasForeignKey(d => d.MaRole)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaiKhoan_Role");
        });

        modelBuilder.Entity<Thanhtoan>(entity =>
        {
            entity.HasKey(e => e.MaThanhToan).HasName("PRIMARY");

            entity.ToTable("thanhtoan");

            entity.HasIndex(e => e.MaDonHang, "FK_ThanhToan_DonHang");

            entity.HasIndex(e => e.MaPhuongThuc, "FK_ThanhToan_PhuongThuc");

            entity.Property(e => e.MaGiaoDich).HasMaxLength(100);
            entity.Property(e => e.SoTien).HasPrecision(18);
            entity.Property(e => e.ThoiGianThanhToan).HasColumnType("datetime");
            entity.Property(e => e.TrangThaiThanhToan)
                .HasMaxLength(20)
                .HasDefaultValueSql("'ChoThanhToan'");

            entity.HasOne(d => d.MaDonHangNavigation).WithMany(p => p.Thanhtoans)
                .HasForeignKey(d => d.MaDonHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ThanhToan_DonHang");

            entity.HasOne(d => d.MaPhuongThucNavigation).WithMany(p => p.Thanhtoans)
                .HasForeignKey(d => d.MaPhuongThuc)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ThanhToan_PhuongThuc");
        });

        modelBuilder.Entity<Thongbao>(entity =>
        {
            entity.HasKey(e => e.MaThongBao).HasName("PRIMARY");

            entity.ToTable("thongbao");

            entity.HasIndex(e => e.MaTaiKhoan, "FK_ThongBao_TaiKhoan");

            entity.Property(e => e.Loai).HasMaxLength(30);
            entity.Property(e => e.NgayTao)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.NoiDung).HasMaxLength(500);
            entity.Property(e => e.TieuDe).HasMaxLength(150);

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithMany(p => p.Thongbaos)
                .HasForeignKey(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ThongBao_TaiKhoan");
        });

        modelBuilder.Entity<Topping>(entity =>
        {
            entity.HasKey(e => e.MaTopping).HasName("PRIMARY");

            entity.ToTable("topping");

            entity.HasIndex(e => e.MaNhomTopping, "FK_Topping_NhomTopping");

            entity.Property(e => e.GiaThem).HasPrecision(18);
            entity.Property(e => e.TenTopping).HasMaxLength(100);
            entity.Property(e => e.TrangThai)
                .IsRequired()
                .HasDefaultValueSql("'1'");

            entity.HasOne(d => d.MaNhomToppingNavigation).WithMany(p => p.Toppings)
                .HasForeignKey(d => d.MaNhomTopping)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Topping_NhomTopping");
        });

        modelBuilder.Entity<Trangthaidonhang>(entity =>
        {
            entity.HasKey(e => e.MaTrangThai).HasName("PRIMARY");

            entity.ToTable("trangthaidonhang");

            entity.HasIndex(e => e.TenTrangThai, "TenTrangThai").IsUnique();

            entity.Property(e => e.TenTrangThai).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
