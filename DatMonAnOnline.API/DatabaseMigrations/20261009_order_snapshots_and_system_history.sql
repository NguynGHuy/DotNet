-- Chạy một lần trên database DatMonAnOnline trước khi khởi động API mới.
-- Các cột nullable giữ tương thích với dữ liệu đơn hàng cũ.

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donhang'
       AND COLUMN_NAME = 'TenNhaHangLucDat') = 0,
    'ALTER TABLE donhang ADD COLUMN TenNhaHangLucDat VARCHAR(150) NULL AFTER MaNhaHang',
    'SELECT 1'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chitietdonhang'
       AND COLUMN_NAME = 'TenMonAnLucDat') = 0,
    'ALTER TABLE chitietdonhang ADD COLUMN TenMonAnLucDat VARCHAR(150) NULL AFTER MaMonAn',
    'SELECT 1'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chitietdonhang_topping'
       AND COLUMN_NAME = 'TenToppingLucDat') = 0,
    'ALTER TABLE chitietdonhang_topping ADD COLUMN TenToppingLucDat VARCHAR(100) NULL AFTER MaTopping',
    'SELECT 1'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

-- Cho phép lịch sử do hệ thống tự động tạo mà không giả danh khách/quán/admin.
ALTER TABLE lichsutrangthaidonhang
    MODIFY COLUMN MaTaiKhoan INT NULL;

-- Snapshot dữ liệu hiện tại cho các đơn cũ; đơn mới sẽ ghi đúng tên tại thời điểm đặt.
UPDATE donhang d
JOIN nhahang n ON n.MaNhaHang = d.MaNhaHang
SET d.TenNhaHangLucDat = n.TenNhaHang
WHERE d.TenNhaHangLucDat IS NULL;

UPDATE chitietdonhang ct
JOIN monan m ON m.MaMonAn = ct.MaMonAn
SET ct.TenMonAnLucDat = m.TenMonAn
WHERE ct.TenMonAnLucDat IS NULL;

UPDATE chitietdonhang_topping ctt
JOIN topping t ON t.MaTopping = ctt.MaTopping
SET ctt.TenToppingLucDat = t.TenTopping
WHERE ctt.TenToppingLucDat IS NULL;
