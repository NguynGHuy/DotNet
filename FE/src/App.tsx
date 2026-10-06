import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

import Header from "./components/Header";
import LatestCartBar from "./components/LatestCartBar";

import HomeEntry from "./pages/HomeEntry";
import RestaurantDetail from "./pages/RestaurantDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AddressPage from "./pages/Address";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

import Notifications from "./pages/Notifications";
import Promotions from "./pages/Promotions";

import AdminAccounts from "./pages/AdminAccounts";
import AdminLayout from "./pages/AdminLayout";
import AdminHome from "./pages/AdminHome";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminPromotions from "./pages/AdminPromotions";

import QuanLayout from "./pages/RestaurantLayout";
import QuanHome from "./pages/RestaurantHome";
import QuanRestaurantInfo from "./pages/RestaurantInfo";
import QuanRestaurantStatus from "./pages/RestaurantStatus";
import RestaurantOrders from "./pages/RestaurantOrders";
import RestaurantOrderDetail from "./pages/RestaurantOrderDetail";
import RestaurantCategory from "./pages/RestaurantCategory";
import RestaurantMenu from "./pages/RestaurantMenu";
import RestaurantTopping from "./pages/RestaurantTopping";
import Restaurants from "./pages/Restaurants";
import RegisterRestaurant from "./pages/RegisterRestaurant";

import Footer from "./components/Footer";

function AppContent() {
    const location = useLocation();

    const isAdminArea =
        location.pathname === "/admin" ||
        location.pathname.startsWith("/admin/");

    const isQuanArea =
        location.pathname === "/quan" ||
        location.pathname.startsWith("/quan/");

    const showLatestCart =
        location.pathname === "/" ||
        location.pathname === "/nha-hang";

    return (
        <>
            {!isAdminArea && !isQuanArea && <Header />}

            <Routes>

                {/* =========================
                    PUBLIC
                ========================= */}

                <Route
                    path="/"
                    element={<HomeEntry />}
                />

                <Route
                    path="/dang-nhap"
                    element={<Login />}
                />

                <Route
                    path="/dang-ky"
                    element={<Register />}
                />
                <Route
                    path="/dang-ky-nha-hang"
                    element={<RegisterRestaurant />}
                />

                <Route
                    path="/nha-hang/:id"
                    element={<RestaurantDetail />}
                />


                {/* =========================
                    KHÁCH HÀNG
                ========================= */}

                <Route
                    path="/ho-so"
                    element={<Profile />}
                />

                <Route
                    path="/dia-chi"
                    element={<AddressPage />}
                />

                <Route
                    path="/gio-hang"
                    element={<Cart />}
                />

                <Route
                    path="/thanh-toan"
                    element={<Checkout />}
                />

                <Route
                    path="/don-hang"
                    element={<Orders />}
                />
                < Route
                    path = "/don-hang/:id"
                    element = {<OrderDetail />}
                />

                <Route
                    path="/thong-bao"
                    element={<Notifications />}
                />



                {/* =========================
                    QUAN - CHỦ NHÀ HÀNG
                ========================= */}
                <Route
                    path="/nha-hang"
                    element={<Restaurants />}
                />
                <Route
                    path="/quan"
                    element={<QuanLayout />}
                >
                    <Route
                        index
                        element={<QuanHome />}
                    />
                    <Route
                        path="thong-tin"
                        element={<QuanRestaurantInfo />}
                    />
                    <Route
                        path="trang-thai"
                        element={<QuanRestaurantStatus />}
                    />
                    {/* =========================
                            NGƯỜI 2 - MÓN ĂN
                        ========================= */}

                        <Route
                            path="danh-muc"
                            element={<RestaurantCategory />}
                        />

                        <Route
                            path="menu"
                            element={<RestaurantMenu />}
                        />

                        <Route
                            path="topping"
                            element={<RestaurantTopping />}
                        />

                        {/* ========================= */}

                    <Route
                        path="don-hang"
                        element={<RestaurantOrders />}
                    />
                    <Route
                        path="don-hang/:id"
                        element={<RestaurantOrderDetail />}
                    />

                    <Route
                        path="khuyen-mai"
                        element={<Promotions />}
                    />

                    <Route
                        path="thong-bao"
                        element={<Notifications />}
                    />
                </Route>


                {/* =========================
                    ADMIN
                ========================= */}

                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={<AdminHome />}
                    />

                    <Route
                        path="tai-khoan"
                        element={<AdminAccounts />}
                    />

                    <Route
                        path="nha-hang"
                        element={<AdminRestaurants />}
                    />

                    <Route
                        path="khuyen-mai"
                        element={<AdminPromotions />}
                    />

                    <Route
                        path="thong-bao"
                        element={<Notifications />}
                    />
                </Route>

            </Routes>
            {showLatestCart && <LatestCartBar />}
            {!isAdminArea && !isQuanArea && <Footer />}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
