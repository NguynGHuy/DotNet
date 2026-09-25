import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRestaurants } from "../services/restaurantService";

interface Restaurant {
    maNhaHang: number;
    tenNhaHang: string;
    moTa?: string;
    diaChiQuan?: string;
    anhBia?: string | null;
    danhGiaTrungBinh?: number;
    phiShipMacDinh?: number;
    gioMoCua?: string;
    gioDongCua?: string;
    trangThaiHoatDong?: string;
}

function Home() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        getRestaurants()
            .then((data) => {
                console.log("Danh sách nhà hàng:", data);
                setRestaurants(data);
            })
            .catch((error) => {
                console.error(error);
                setError("Không thể tải danh sách nhà hàng.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.tenNhaHang
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <main className= "home" >
            <div className="loading-container" >
                <div className="loading-spinner" > </div>
                    < p > Đang tải nhà hàng...</p>
                        </div>
                        </main>
    );
    }

    if (error) {
        return (
            <main className= "home" >
            <div className="home-error" >
                <span>⚠️</span>
                    < p > { error } </p>
                    </div>
                    </main>
    );
    }

    return (
        <main className= "home" >

        {/* =========================
          HERO
      ========================= */}

        < section className = "hero" >
            <div className="hero-content" >

                <span className="hero-badge" >
            🍽️ Đặt món dễ dàng
        </span>

        <h2>
            Đói bụng rồi ?
        <br />
        < span > Đặt món ngay thôi! 😋</span>
            </h2>

            <p>
            Khám phá những nhà hàng yêu thích và
            thưởng thức món ngon ngay tại nhà.
          </p>

        < div className = "search-box" >
            <span className="search-icon" >🔍</span>

                < input
    type = "text"
    placeholder = "Tìm kiếm nhà hàng..."
    value = { search }
    onChange = {(e) => setSearch(e.target.value)
}
            />

{
    search && (
        <button
                className="search-clear"
    onClick = {() => setSearch("")
}
              >
                ✕
</button>
            )}
</div>

    </div>

    < div className = "hero-image" >
          🍔
</div>
    </section>

{/* =========================
          RESTAURANTS
      ========================= */}

<section className="restaurant-section" >

    <div className="section-header" >
        <div>
        <h2>Nhà hàng nổi bật </h2>
            <p>
              Khám phá những địa điểm ăn uống dành cho bạn
    </p>
    </div>

    < span className = "restaurant-count" >
    { filteredRestaurants.length } nhà hàng
        </span>
        </div>

{
    filteredRestaurants.length === 0 ? (
        <div className= "empty-result" >
        <div>🔍</div>

            < h3 > Không tìm thấy nhà hàng </h3>

                <p>
              Thử tìm kiếm với tên nhà hàng khác.
            </p>
        </div>
        ) : (
        <div className= "restaurant-list" >

        {
            filteredRestaurants.map((restaurant) => {

                const isOpen =
                    restaurant.trangThaiHoatDong === "MoCua";

                return (
                    <div
                  className= "restaurant-card"
                key = { restaurant.maNhaHang }
                    >

                {/* Image */ }

                    < div className = "restaurant-image" >

                    {
                        restaurant.anhBia ? (
                            <img
                        src= { restaurant.anhBia }
                        alt={ restaurant.tenNhaHang }
                        />
                    ) : (
                            <div className="restaurant-image-placeholder" >
                        🍽️
                            </div>
                        )
}

<span
                      className={
    isOpen
        ? "restaurant-status open"
        : "restaurant-status closed"
}
                    >
{
    isOpen
    ? "● Đang mở cửa"
        : "● Đóng cửa"
}
    </span>

    </div>

{/* Content */ }

<div className="restaurant-content" >

    <div className="restaurant-title-row" >

        <h3>
        { restaurant.tenNhaHang }
        </h3>

{
    restaurant.danhGiaTrungBinh !== undefined && (
        <span className="restaurant-rating" >
                          ⭐ { restaurant.danhGiaTrungBinh.toFixed(1) }
    </span>
                      )
}

</div>

    < p className = "restaurant-description" >
    {
        restaurant.moTa ||
            "Khám phá những món ăn hấp dẫn tại nhà hàng."
    }
        </p>

        < div className = "restaurant-info" >

            <span>
                        📍{ " " }
{
    restaurant.diaChiQuan ||
    "Chưa có địa chỉ"
}
</span>

{
    restaurant.phiShipMacDinh !== undefined && (
        <span>
                          🛵{ " " }
    {
        restaurant.phiShipMacDinh.toLocaleString(
            "vi-VN"
        )
    } { " " }
    đ
        </span>
                      )
}

</div>

{
    restaurant.gioMoCua &&
    restaurant.gioDongCua && (
        <p className="restaurant-hours" >
                          🕐 { restaurant.gioMoCua.slice(0, 5) }
    { " - " }
    { restaurant.gioDongCua.slice(0, 5) }
    </p>
                      )
}

<Link
                      to={ `/nha-hang/${restaurant.maNhaHang}` }
className = "restaurant-button"
    >
    Xem nhà hàng
        <span>→</span>
            </Link>

            </div>

            </div>
              );
            })}

</div>
        )}

</section>

    </main>
  );
}

export default Home;