import {
    useEffect,
    useState
} from "react";


import {
    getCurrentUser
} from "../services/userService";


import {
    getNhomToppings,
    createNhomTopping,
    updateNhomTopping,
    deleteNhomTopping,

    getToppings,
    createTopping,
    updateTopping,
    updateTrangThaiTopping,
    deleteTopping,

    type NhomTopping,
    type Topping

} from "../services/toppingService";



interface CurrentUser {

    nhaHang?: {

        maNhaHang: number;

    };

}



function RestaurantTopping() {


    const [nhomToppings, setNhomToppings]
        = useState<NhomTopping[]>([]);


    const [toppings, setToppings]
        = useState<Topping[]>([]);



    const [selectedNhom, setSelectedNhom]
        = useState<number>(0);



    const [loading, setLoading]
        = useState(true);



    const [error, setError]
        = useState("");



    // =========================
    // FORM NHÓM
    // =========================


    const [tenNhom, setTenNhom]
        = useState("");


    const [batBuocChon, setBatBuocChon]
        = useState(false);


    const [chonToiDa, setChonToiDa]
        = useState(1);



    const [editNhomId, setEditNhomId]
        = useState<number | null>(null);




    // =========================
    // FORM TOPPING
    // =========================


    const [tenTopping, setTenTopping]
        = useState("");


    const [giaThem, setGiaThem]
        = useState(0);



    const [editToppingId, setEditToppingId]
        = useState<number | null>(null);




    const [showNhomForm, setShowNhomForm]
        = useState(false);



    const [showToppingForm, setShowToppingForm]
        = useState(false);




    // =========================
    // LOAD
    // =========================


    useEffect(() => {

        loadNhom();

    }, []);




    const getMaNhaHang = async () => {


        const user =
            await getCurrentUser() as CurrentUser;


        const maNhaHang =
            user.nhaHang?.maNhaHang;


        if (!maNhaHang) {

            throw new Error(
                "Không tìm thấy nhà hàng"
            );

        }


        return maNhaHang;

    };




    const loadNhom = async () => {


        try {


            setLoading(true);


            const maNhaHang =
                await getMaNhaHang();



            const data =
                await getNhomToppings(
                    maNhaHang
                );



            setNhomToppings(data);



            if (data.length > 0) {


                const id =
                    data[0].maNhomTopping;


                setSelectedNhom(id);


                loadToppings(id);


            }


        }
        catch (err) {


            console.error(err);


            setError(
                "Không tải được nhóm topping"
            );


        }
        finally {


            setLoading(false);


        }


    };




    const loadToppings = async (
        maNhomTopping: number
    ) => {


        try {


            const data =
                await getToppings(
                    maNhomTopping
                );


            setToppings(data);


        }
        catch (err) {


            console.error(err);


        }


    };

    // =========================
    // NHÓM TOPPING
    // =========================


    const handleCreateNhom = async () => {


        if (!tenNhom.trim()) {

            alert(
                "Tên nhóm topping không được trống"
            );

            return;

        }



        try {


            await createNhomTopping({

                tenNhom:
                    tenNhom.trim(),

                batBuocChon,

                chonToiDa

            });



            setTenNhom("");

            setBatBuocChon(false);

            setChonToiDa(1);

            setShowNhomForm(false);


            await loadNhom();


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể tạo nhóm topping"
            );


        }


    };





    const handleEditNhom = (
        item: NhomTopping
    ) => {


        setEditNhomId(
            item.maNhomTopping
        );


        setTenNhom(
            item.tenNhom
        );


        setBatBuocChon(
            item.batBuocChon
        );


        setChonToiDa(
            item.chonToiDa
        );


    };





    const handleUpdateNhom = async () => {


        if (editNhomId === null)
            return;



        try {


            await updateNhomTopping(

                editNhomId,

                {

                    tenNhom:
                        tenNhom.trim(),


                    batBuocChon,


                    chonToiDa

                }

            );



            setEditNhomId(null);


            setTenNhom("");

            setBatBuocChon(false);

            setChonToiDa(1);



            await loadNhom();


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể cập nhật nhóm topping"
            );


        }


    };





    const handleDeleteNhom = async (
        id: number
    ) => {


        if (
            !window.confirm(
                "Bạn có chắc muốn xóa nhóm topping?"
            )
        )
            return;



        try {


            await deleteNhomTopping(id);



            if (selectedNhom === id) {

                setSelectedNhom(0);

                setToppings([]);

            }



            await loadNhom();


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể xóa nhóm topping"
            );


        }


    };






    // =========================
    // TOPPING
    // =========================




    const handleCreateTopping = async () => {


        if (selectedNhom === 0) {

            alert(
                "Vui lòng chọn nhóm topping"
            );

            return;

        }



        if (!tenTopping.trim()) {

            alert(
                "Tên topping không được trống"
            );

            return;

        }



        if (giaThem < 0) {

            alert(
                "Giá thêm không hợp lệ"
            );

            return;

        }




        try {


            await createTopping({

                maNhomTopping:
                    selectedNhom,


                tenTopping:
                    tenTopping.trim(),


                giaThem

            });




            setTenTopping("");

            setGiaThem(0);

            setShowToppingForm(false);



            await loadToppings(
                selectedNhom
            );


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể tạo topping"
            );


        }


    };






    const handleEditTopping = (
        item: Topping
    ) => {


        setEditToppingId(
            item.maTopping
        );


        setTenTopping(
            item.tenTopping
        );


        setGiaThem(
            item.giaThem
        );


    };





    const handleUpdateTopping = async () => {


        if (editToppingId === null)
            return;



        try {


            await updateTopping(

                editToppingId,

                {

                    tenTopping:
                        tenTopping.trim(),


                    giaThem

                }

            );



            setEditToppingId(null);


            setTenTopping("");

            setGiaThem(0);



            await loadToppings(
                selectedNhom
            );


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể cập nhật topping"
            );


        }


    };






    const handleToggle = async (
        item: Topping
    ) => {


        try {


            await updateTrangThaiTopping(

                item.maTopping,

                !item.trangThai

            );



            await loadToppings(
                selectedNhom
            );


        }
        catch (err) {


            console.error(err);


        }


    };






    const handleDeleteTopping = async (
        id: number
    ) => {


        if (
            !window.confirm(
                "Bạn có chắc muốn xóa topping?"
            )
        )
            return;




        try {


            await deleteTopping(id);



            await loadToppings(
                selectedNhom
            );


        }
        catch (err) {


            console.error(err);


            alert(
                "Không thể xóa topping"
            );


        }


    };
    return (

        <div>


            <h1>
                Quản lý topping
            </h1>



            {
                loading &&
                <p>
                    Đang tải...
                </p>
            }



            {
                error &&
                <p>
                    {error}
                </p>
            }



            <hr />



            {/* =========================
                NHÓM TOPPING
            ========================= */}


            <h2>
                Nhóm topping
            </h2>



            <button

                onClick={() => {

                    setShowNhomForm(
                        !showNhomForm
                    );

                    setEditNhomId(null);

                    setTenNhom("");

                }}

            >

                {
                    showNhomForm
                        ?
                        "Đóng"
                        :
                        "+ Thêm nhóm"
                }

            </button>




            {
                showNhomForm &&

                <div>


                    <input

                        placeholder="Tên nhóm"

                        value={tenNhom}

                        onChange={
                            e =>
                                setTenNhom(
                                    e.target.value
                                )
                        }

                    />



                    <label>

                        <input

                            type="checkbox"

                            checked={batBuocChon}

                            onChange={
                                e =>
                                    setBatBuocChon(
                                        e.target.checked
                                    )
                            }

                        />

                        Bắt buộc chọn

                    </label>




                    <input

                        type="number"

                        min={1}

                        value={chonToiDa}

                        onChange={
                            e =>
                                setChonToiDa(
                                    Number(
                                        e.target.value
                                    )
                                )
                        }

                    />



                    <button

                        onClick={
                            handleCreateNhom
                        }

                    >

                        Lưu nhóm

                    </button>


                </div>

            }





            {
                editNhomId !== null &&


                <div>


                    <h3>
                        Sửa nhóm topping
                    </h3>


                    <input

                        value={tenNhom}

                        onChange={
                            e =>
                                setTenNhom(
                                    e.target.value
                                )
                        }

                    />



                    <label>

                        <input

                            type="checkbox"

                            checked={batBuocChon}

                            onChange={
                                e =>
                                    setBatBuocChon(
                                        e.target.checked
                                    )
                            }

                        />

                        Bắt buộc chọn

                    </label>




                    <input

                        type="number"

                        min={1}

                        value={chonToiDa}

                        onChange={
                            e =>
                                setChonToiDa(
                                    Number(
                                        e.target.value
                                    )
                                )
                        }

                    />



                    <button

                        onClick={
                            handleUpdateNhom
                        }

                    >

                        Lưu sửa

                    </button>



                    <button

                        onClick={() => {

                            setEditNhomId(null);

                            setTenNhom("");

                        }}

                    >

                        Hủy

                    </button>


                </div>

            }





            {
                nhomToppings.map(item => (


                    <div

                        key={
                            item.maNhomTopping
                        }

                    >



                        <button


                            onClick={() => {


                                setSelectedNhom(

                                    item.maNhomTopping

                                );


                                loadToppings(

                                    item.maNhomTopping

                                );


                            }}


                        >

                            {item.tenNhom}

                        </button>




                        <button

                            onClick={() =>
                                handleEditNhom(item)
                            }

                        >

                            Sửa

                        </button>




                        <button

                            onClick={() =>
                                handleDeleteNhom(
                                    item.maNhomTopping
                                )
                            }

                        >

                            Xóa

                        </button>



                    </div>


                ))

            }





            <hr />




            {/* =========================
                TOPPING
            ========================= */}



            <h2>
                Danh sách topping
            </h2>




            <button

                onClick={() => {


                    setShowToppingForm(
                        !showToppingForm
                    );


                    setEditToppingId(null);


                    setTenTopping("");

                    setGiaThem(0);


                }}

            >

                {
                    showToppingForm
                        ?
                        "Đóng"
                        :
                        "+ Thêm topping"
                }


            </button>






            {
                showToppingForm &&


                <div>



                    <input

                        placeholder="Tên topping"

                        value={tenTopping}

                        onChange={
                            e =>
                                setTenTopping(
                                    e.target.value
                                )
                        }


                    />




                    <input

                        type="number"

                        min={0}

                        placeholder="Giá thêm"

                        value={giaThem}

                        onChange={
                            e =>
                                setGiaThem(
                                    Number(
                                        e.target.value
                                    )
                                )
                        }

                    />




                    <button

                        onClick={
                            handleCreateTopping
                        }

                    >

                        Lưu topping

                    </button>



                </div>

            }






            {
                editToppingId !== null &&


                <div>


                    <h3>
                        Sửa topping
                    </h3>




                    <input

                        value={tenTopping}

                        onChange={
                            e =>
                                setTenTopping(
                                    e.target.value
                                )
                        }


                    />




                    <input

                        type="number"

                        min={0}

                        value={giaThem}

                        onChange={
                            e =>
                                setGiaThem(
                                    Number(
                                        e.target.value
                                    )
                                )
                        }

                    />




                    <button

                        onClick={
                            handleUpdateTopping
                        }

                    >

                        Lưu sửa

                    </button>




                    <button

                        onClick={() => {

                            setEditToppingId(null);

                            setTenTopping("");

                            setGiaThem(0);

                        }}

                    >

                        Hủy

                    </button>


                </div>

            }







            {
                toppings.map(item => (



                    <div

                        key={
                            item.maTopping
                        }

                    >




                        <h3>

                            {item.tenTopping}

                        </h3>




                        <p>

                            Giá thêm:

                            {" "}

                            {item.giaThem}

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
                                handleEditTopping(item)
                            }

                        >

                            Sửa

                        </button>





                        <button

                            onClick={() =>
                                handleToggle(item)
                            }

                        >

                            Bật/Tắt

                        </button>





                        <button

                            onClick={() =>
                                handleDeleteTopping(
                                    item.maTopping
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


export default RestaurantTopping;