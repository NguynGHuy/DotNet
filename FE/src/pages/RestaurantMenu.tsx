import {
    useEffect,
    useState
} from "react";

import {
    getMonAns,
    createMonAn,
    updateMonAn,
    updateTrangThaiMonAn,
    deleteMonAn,
    type MonAn
} from "../services/menuService";

import {
    getDanhMucs,
    type DanhMuc
} from "../services/categoryService";

import {
    getCurrentUser
} from "../services/userService";


interface CurrentUser {

    nhaHang?: {

        maNhaHang: number;

    };

}



function RestaurantMenu() {


    const [monAns, setMonAns]
        = useState<MonAn[]>([]);


    const [danhMucs, setDanhMucs]
        = useState<DanhMuc[]>([]);



    const [loading, setLoading]
        = useState(true);



    const [error, setError]
        = useState("");



    const [maNhaHang, setMaNhaHang]
        = useState<number | null>(null);



    const [showForm, setShowForm]
        = useState(false);



    const [maDanhMuc, setMaDanhMuc]
        = useState(0);


    const [tenMonAn, setTenMonAn]
        = useState("");



    const [moTa, setMoTa]
        = useState("");



    const [gia, setGia]
        = useState(0);



    const [editId, setEditId]
        = useState<number | null>(null);



    const [editMaDanhMuc, setEditMaDanhMuc]
        = useState(0);



    const [editTenMonAn, setEditTenMonAn]
        = useState("");



    const [editMoTa, setEditMoTa]
        = useState("");



    const [editGia, setEditGia]
        = useState(0);




    const loadData = async () => {

        try {

            setLoading(true);

            const user =
                await getCurrentUser() as CurrentUser;


            const id =
                user.nhaHang?.maNhaHang;


            if (!id) {

                throw new Error(
                    "Không tìm thấy nhà hàng"
                );

            }


            setMaNhaHang(id);



            const [
                menuData,
                categoryData

            ] = await Promise.all([

                getMonAns(id),

                getDanhMucs(id)

            ]);



            setMonAns(menuData);

            setDanhMucs(categoryData);



        }
        catch (err) {

            console.error(err);

            setError(
                "Không tải được dữ liệu món ăn."
            );

        }
        finally {

            setLoading(false);

        }

    };




    useEffect(() => {

        loadData();

    }, []);





    const resetCreateForm = () => {

        setMaDanhMuc(0);

        setTenMonAn("");

        setMoTa("");

        setGia(0);

        setShowForm(false);

    };





    const handleCreate = async () => {


        if (maDanhMuc <= 0) {

            alert(
                "Vui lòng chọn danh mục."
            );

            return;

        }



        if (!tenMonAn.trim()) {

            alert(
                "Vui lòng nhập tên món ăn."
            );

            return;

        }



        try {


            await createMonAn({

                maDanhMuc,

                tenMonAn,

                moTa,

                gia,

                hinhAnh: null

            });



            resetCreateForm();


            await loadData();



        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể tạo món ăn."
            );


        }


    };





    const openEdit = (
        item: MonAn
    ) => {


        setEditId(
            item.maMonAn
        );


        setEditMaDanhMuc(
            item.maDanhMuc
        );


        setEditTenMonAn(
            item.tenMonAn
        );


        setEditMoTa(
            item.moTa ?? ""
        );


        setEditGia(
            item.gia
        );


    };





    const cancelEdit = () => {

        setEditId(null);

        setEditMaDanhMuc(0);

        setEditTenMonAn("");

        setEditMoTa("");

        setEditGia(0);

    };





    const handleUpdate = async () => {


        if (editId === null) {

            return;

        }



        try {


            await updateMonAn(

                editId,

                {

                    maDanhMuc: editMaDanhMuc,

                    tenMonAn: editTenMonAn,

                    moTa: editMoTa,

                    gia: editGia,

                    hinhAnh: null

                }

            );



            cancelEdit();


            await loadData();



        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể cập nhật món ăn."
            );


        }


    };





    const handleToggle = async (
        item: MonAn
    ) => {


        try {


            await updateTrangThaiMonAn(

                item.maMonAn,

                !item.trangThai

            );


            await loadData();



        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể cập nhật trạng thái."
            );


        }


    };





    const handleDelete = async (
        id: number
    ) => {


        const ok =
            window.confirm(
                "Bạn có chắc muốn xóa món này?"
            );


        if (!ok) {

            return;

        }



        try {


            await deleteMonAn(id);


            await loadData();



        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể xóa món ăn."
            );


        }


    };





    return (

        <div>


            <h1>
                Quản lý món ăn
            </h1>



            <button
                onClick={() =>
                    setShowForm(true)
                }
            >

                + Thêm món ăn

            </button>




            {
                showForm && (

                    <div>


                        <h3>
                            Thêm món ăn
                        </h3>



                        <select

                            value={maDanhMuc}

                            onChange={
                                e =>
                                    setMaDanhMuc(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        >

                            <option value={0}>

                                Chọn danh mục

                            </option>



                            {
                                danhMucs.map(item => (

                                    <option

                                        key={
                                            item.maDanhMuc
                                        }

                                        value={
                                            item.maDanhMuc
                                        }

                                    >

                                        {
                                            item.tenDanhMuc
                                        }


                                    </option>

                                ))
                            }


                        </select>



                        <input

                            placeholder="Tên món ăn"

                            value={tenMonAn}

                            onChange={
                                e =>
                                    setTenMonAn(
                                        e.target.value
                                    )
                            }

                        />



                        <textarea

                            placeholder="Mô tả"

                            value={moTa}

                            onChange={
                                e =>
                                    setMoTa(
                                        e.target.value
                                    )
                            }

                        />



                        <input

                            type="number"

                            placeholder="Giá"

                            value={gia}

                            onChange={
                                e =>
                                    setGia(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        />



                        <button
                            onClick={
                                handleCreate
                            }
                        >

                            Lưu

                        </button>



                        <button
                            onClick={
                                resetCreateForm
                            }
                        >

                            Hủy

                        </button>


                    </div>

                )
            }







            {
                editId !== null && (

                    <div>


                        <h3>
                            Sửa món ăn
                        </h3>



                        <select

                            value={editMaDanhMuc}

                            onChange={
                                e =>
                                    setEditMaDanhMuc(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        >


                            {
                                danhMucs.map(item => (

                                    <option

                                        key={
                                            item.maDanhMuc
                                        }

                                        value={
                                            item.maDanhMuc
                                        }

                                    >

                                        {
                                            item.tenDanhMuc
                                        }


                                    </option>

                                ))
                            }


                        </select>



                        <input

                            value={editTenMonAn}

                            onChange={
                                e =>
                                    setEditTenMonAn(
                                        e.target.value
                                    )
                            }

                        />



                        <textarea

                            value={editMoTa}

                            onChange={
                                e =>
                                    setEditMoTa(
                                        e.target.value
                                    )
                            }

                        />



                        <input

                            type="number"

                            value={editGia}

                            onChange={
                                e =>
                                    setEditGia(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        />



                        <button
                            onClick={
                                handleUpdate
                            }
                        >

                            Cập nhật

                        </button>



                        <button
                            onClick={
                                cancelEdit
                            }
                        >

                            Hủy

                        </button>


                    </div>

                )
            }







            {
                loading && (

                    <p>
                        Đang tải...
                    </p>

                )
            }





            {
                error && (

                    <p>

                        {error}

                    </p>

                )
            }





            {
                monAns.map(item => (

                    <div

                        key={
                            item.maMonAn
                        }

                    >


                        <h3>

                            {
                                item.tenMonAn
                            }

                        </h3>



                        <p>

                            Danh mục:
                            {" "}
                            {
                                item.tenDanhMuc
                            }

                        </p>



                        <p>

                            Giá:
                            {" "}
                            {
                                item.gia.toLocaleString()
                            }

                            đ

                        </p>



                        <p>

                            {
                                item.trangThai

                                    ?

                                    "Đang bán"

                                    :

                                    "Ngừng bán"

                            }

                        </p>



                        <button

                            onClick={() =>
                                openEdit(item)
                            }

                        >

                            Sửa

                        </button>



                        <button

                            onClick={() =>
                                handleToggle(item)
                            }

                        >

                            Bật / Tắt

                        </button>



                        <button

                            onClick={() =>
                                handleDelete(
                                    item.maMonAn
                                )
                            }

                        >

                            Xóa

                        </button>



                    </div>

                ))
            }



        </div>

    );

}


export default RestaurantMenu;