const express = require('express');
const db = require('./../modules/connect-db');
const upload = require('./../modules/upload-imgs');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const router = express.Router();

async function getListData(req, res){
    const perPage = 5; // 每一頁最多幾筆
    // 用戶要看第幾頁
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if(page<1){
        return res.redirect('/members/list');
    }
    
    const conditions = {};  // 傳到 ejs 的條件
    let search = req.query.search ? req.query.search : '';
    search = search.trim(); // 去掉頭尾空白
    let sqlWhere = ' WHERE 1 ';
    if(search){
        sqlWhere += ` AND \`name\` LIKE ${db.escape('%'+search+'%')} `;
        conditions.search = search;
    }

    // 輸出
    const output = {
        // success: false,
        perPage,
        page,
        totalRows: 0,
        totalPages: 0,
        rows: [],
        conditions
    };

    const t_sql = `SELECT COUNT(1) num FROM members ${sqlWhere} `;
    // return res.send(t_sql); // 除錯用
    const [rs1] = await db.query(t_sql);
    const totalRows = rs1[0].num;
    // let totalPages = 0;
    if(totalRows) {
        output.totalPages = Math.ceil(totalRows/perPage);
        output.totalRows = totalRows;
        if(page > output.totalPages){
            // 到最後一頁
            return res.redirect(`/members/list?page=${output.totalPages}`);
        }

        // const sql = `SELECT * FROM \`members\` ${sqlWhere} ORDER BY sid DESC LIMIT ${perPage*(page-1)}, ${perPage} `;
        const sql =`SELECT * FROM \`members\` ${sqlWhere} ORDER BY m_sid DESC`;
        const [rs2] = await db.query(sql);
        rs2.forEach(el=>{
            let str = res.locals.toDateString(el.birthday);
            if(str === 'Invalid date'){
                el.birthday = '沒有輸入資料';
            } else {
                el.birthday = str;
            }

        });
        output.rows = rs2;
    }

    return output.rows;
}
async function getorderData(req, res){
    
    let sqlWhere = ' WHERE 1 ';
    

    // 輸出
    const output = {
        // success: false,
        // perPage,
        // page,
        // totalRows: 0,
        // totalPages: 0,
        rows: [],
        // conditions
    };

    const t_sql = `SELECT COUNT(1) num FROM members ${sqlWhere} `;
    // return res.send(t_sql); // 除錯用
    const [rs1] = await db.query(t_sql);
    const totalRows = rs1[0].num;
    

        
        const sql =`SELECT m.m_sid,m.order_amount,o.*,tp.* FROM \`members\` m
                        JOIN \`orders\` o
                        ON m.m_sid=o.users_sid
                        JOIN \`order_details_products\` tp
                        ON o.o_sid=tp.order_sid
                        ORDER BY m.m_sid DESC`;
        /* 
        SELECT * FROM `members` m
        JOIN `orders` o
        ON m.m_sid=o.users_sid
        JOIN `order_details_products` tp
        ON o.sid=tp.order_sid
        ORDER BY m.m_sid DESC
        */
        const [rs2] = await db.query(sql);
        
        rs2.forEach(el=>{
            // let str = res.locals.toDateString(el.birthday);
            let str2 = res.locals.toDatetimeString(el.order_date);
            if(str2 === 'Invalid date'){
                el.order_date = '沒有輸入資料';
            } else {
                // el.birthday = str;
                el.order_date = str2;
            }
        });

       
        
        
        const resultData = [];

        const dict = {};
        for(let i of rs2){
            dict[i.o_sid] = i;
            // 訂單編號
        }

        
        let ar1= [];
        for(let i of rs2){
            const parent = dict[i.order_sid];
                if(! parent.list) {
                    parent.list = [];
                }
            // console.log('parent--',parent);
            // 每個{}在array的哪個位置
            
 
            resultData.push(parent);
            console.log(parent);
            // let pLength = Object.keys(parent).length;
            // console.log('object長度:',pLength);
            // console.log('array長度:',rs2.length);
            // let p= i.product_sid;
            // console.log('p:',p);
            
            // console.log(i["order_sid"]);
       
            
            // if(parent["order_sid"]!=parent["order_sid"]){

            // }else{

            // }
           
            const ps={};
            ps["order_sid"]=i.order_sid;
            ps["product_sid"]=i.product_sid;
            ps["product_price"]=i.product_price;
            ps["product_quantity"]=i.product_quantity;
            console.log('ps--',ps);
            

            // parent.list.push('7');
            
            if(parent.order_sid==ps.order_sid){
                parent.list.push(ps);
                // resultData.push(ps);
            }
            // for(let k of parent)

            // switch(i.o_sid){
            //     case 111:
            //         parent.list={'order_sid':i.order_sid,'order_date':i.order_date,'product_sid':i.product_sid};
            //         resultData.push(i);
            //     break;
                
            // }
        }
        // list塞入要的資料

        // console.log(resultData);
        // output.rows = orderObj;
        // output.rows = rs2;
        output.rows = resultData;

    // }

    return output.rows;
}

router.get('/', async (req, res) => {
    const sql = "SELECT * FROM `members` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})

router.get('/login', async (req, res)=>{
    res.json('login');
});
// 登入
router.post('/login', async (req, res)=>{
    // return res.json(req.body);
    const {email,password}=req.body;
    const [rs] = await db.query(`SELECT * FROM members WHERE email=?`,[email]);
    // 有加密密碼，故無法由SQL同時判斷密碼是否符合

    const output = {
        success: false,
        error: '',
        info: null,
        token: '',
        code: 0,
        bodyData: req.body
    };
    if(! rs.length){
        output.error='帳密錯誤';
        output.code=401;
        return res.json(output);
    }
  
    const row=rs[0];

    const compareResuly=await bcrypt.compare(password, row.password);
    if(! compareResuly){
        output.error='帳密錯誤';
        output.code=402;
        return res.json(output);
    }
    
    output.success = true;
    output.token = jwt.sign({m_sid:row.m_sid, email}, process.env.JWT_KEY);
    output.account = {
        m_sid: row.m_sid,
        email: row.email,
        m_name: row.m_name,
    };

    res.json(output);

   
});

// 修改
// 註冊
router.post('/signup', async (req, res)=>{
    const [rs] = await db.query(`INSERT * INTO members WHERE email=?`,[email]);
});
// 刪除

router.get('/api/list', async (req, res)=>{
    res.json(await getListData(req, res));
});
router.get('/api/orders', async (req, res)=>{
    res.json(await getorderData(req, res));
});

// router.get('/add', async (req, res)=>{
//     res.render('address-book/add');
// });
// // multipart/form-data
// router.post('/add2', upload.none(), async (req, res)=>{
//     res.json(req.body);
// });
// // application/x-www-form-urlencoded
// // application/json
// router.post('/add', async (req, res)=>{
//     const output = {
//         success: false,
//         error: ''
//     };
//     /*
//     const sql = "INSERT INTO address_book SET ?";
//     const obj = {...req.body, created_at: new Date()};

//     const [result] = await db.query(sql, [obj]);
//     console.log(result);
//     */

//     // TODO: 資料格式檢查
//     const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?, ?, ?, ?, ?, NOW())";
//     const [result] = await db.query(sql, [
//         req.body.name,
//         req.body.email,
//         req.body.mobile,
//         req.body.birthday || null,
//         req.body.address,
//     ]);
//     console.log(result);
//     output.success = !! result.affectedRows;
//     output.result = result;

//     res.json(output);
// });
// router.get('/delete/:sid', async (req, res)=>{
//     // req.get('Referer') // 從哪裡來
//     const sql = "DELETE FROM address_book WHERE sid=?";
//     const [result] = await db.query(sql, [req.params.sid]);
//     res.redirect('/address-book/list');
// });

// router.get('/edit/:sid', async (req, res)=>{
//     const sql = "SELECT * FROM address_book WHERE sid=?";
//     const [rs] = await db.query(sql, [req.params.sid]);

//     if(! rs.length){
//         return res.redirect('/address-book/list');
//     }

//     res.render('address-book/edit', rs[0]);
// });

// router.post('/edit/:sid', async (req, res)=>{
//     const output = {
//         success: false,
//         error: ''
//     };

//     const sql = "UPDATE `address_book` SET ? WHERE sid=?";


//     const [result] = await db.query(sql, [req.body, req.params.sid]);

//     console.log(result);
//     output.success = !! result.changedRows;
//     output.result = result;

//     res.json(output);
// });

module.exports = router;