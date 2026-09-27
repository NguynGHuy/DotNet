import "./App.css";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

import Header from "./components/Header";
import HomeEntry from "./pages/HomeEntry";
import RestaurantDetail from "./pages/RestaurantDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AddressPage from "./pages/Address";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";
import Promotions from "./pages/Promotions";
import AdminAccounts from "./pages/AdminAccounts";
import AdminLayout from "./pages/AdminLayout";
import AdminHome from "./pages/AdminHome";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminPromotions from "./pages/AdminPromotions";

function AppContent() {
    const location = useLocation();
    const isAdminArea =
        location.pathname === "/admin" ||
        location.pathname.startsWith("/admin/");

    return (
        <>
            {!isAdminArea && <Header />}

            <Routes>
                <Route path="/" element={<HomeEntry />} />
                <Route path="/dang-nhap" element={<Login />} />
                <Route path="/dang-ky" element={<Register />} />
                <Route path="/nha-hang/:id" element={<RestaurantDetail />} />
                <Route path="/ho-so" element={<Profile />} />
                <Route path="/dia-chi" element={<AddressPage />} />

                <Route path="/gio-hang" element={<Cart />} />
                <Route path="/thanh-toan" element={<Checkout />} />
                <Route path="/don-hang" element={<Orders />} />

                <Route path="/thong-bao" element={<Notifications />} />
                <Route path="/quan/khuyen-mai" element={<Promotions />} />

                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminHome />} />
                    <Route path="tai-khoan" element={<AdminAccounts />} />
                    <Route path="nha-hang" element={<AdminRestaurants />} />
                    <Route path="khuyen-mai" element={<AdminPromotions />} />
                    <Route path="thong-bao" element={<Notifications />} />
                </Route>
            </Routes>
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