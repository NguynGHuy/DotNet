import { quanApiFetch } from "./quanApi";


export interface DanhMuc {

    maDanhMuc: number;

    maNhaHang: number;

    tenDanhMuc: string;

    thuTuHienThi: number;

}



// GET danh sách danh mục

export const getDanhMucs = async (
    maNhaHang: number
): Promise<DanhMuc[]> => {


    const data = await quanApiFetch(
        `/danh-muc?maNhaHang=${maNhaHang}`
    );


    return data;

};




// POST tạo danh mục

export const createDanhMuc = async (

    tenDanhMuc: string,

    thuTuHienThi: number = 0

) => {


    return quanApiFetch(

        "/danh-muc",

        {

            method: "POST",

            body: JSON.stringify({

                tenDanhMuc,

                thuTuHienThi

            })

        }

    );


};




// PUT cập nhật danh mục

export const updateDanhMuc = async (

    id: number,

    tenDanhMuc: string,

    thuTuHienThi: number

) => {


    return quanApiFetch(

        `/danh-muc/${id}`,

        {

            method: "PUT",

            body: JSON.stringify({

                tenDanhMuc,

                thuTuHienThi

            })

        }

    );


};




// DELETE xóa danh mục

export const deleteDanhMuc = async (

    id: number

) => {


    return quanApiFetch(

        `/danh-muc/${id}`,

        {

            method: "DELETE"

        }

    );


};