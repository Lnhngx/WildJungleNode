const express = require('express');
const db = require('./../modules/connect-db');
const upload = require('./../modules/upload-imgs');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const nodemailer = require("nodemailer");

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
// async function getorderData(req, res){

//     // 輸出
//     const output = {
//         // success: false,
//         // perPage,
//         // page,
//         // totalRows: 0,
//         // totalPages: 0,
//         rows: [],
//         // conditions
//     };
//     // return res.json('123');
//     // let sqlWhere = ' WHERE 1 ';
//     // const t_sql = `SELECT COUNT(1) num FROM members ${sqlWhere} `;
//     // // return res.send(t_sql); // 除錯用
//     // const [rs1] = await db.query(t_sql);
//     // const totalRows = rs1[0].num;


//     const sql ="SELECT m.`m_sid`,m.`email`,o.`amount`,o.`order_sid`,o.`order_date`,tp.`room_sid`,tp.`start`,tp.`end` FROM `members` m JOIN `orders` o ON m.`m_sid`=o.`users_sid` JOIN `orders_details_live` tp ON o.`order_sid`=tp.`orders_sid` ORDER BY m.`m_sid` DESC";

//         /* 
//         SELECT * FROM `members` m
//         JOIN `orders` o
//         ON m.m_sid=o.users_sid
//         JOIN `order_details_products` tp
//         ON o.sid=tp.order_sid
//         ORDER BY m.m_sid DESC
//         */
    
//     const [rs2] = await db.query(sql);
//     rs2.forEach(el=>{
//         // let str = res.locals.toDateString(el.birthday);
//         let str2 = res.locals.toDatetimeString(el.order_date);
//         if(str2 === 'Invalid date'){
//             el.order_date = '沒有輸入資料';
//         } else {
//             // el.birthday = str;
//             el.order_date = str2;
//         }
//     });
//     return res.json(rs2)
    
    
    
//     const resultData = [];

//     const dict = {};
//     for(let i of rs2){
//         dict[i.o_sid] = i;
//         // 訂單編號
//     }

    
//     let ar1= [];
//     for(let i of rs2){
//         const parent = dict[i.order_sid];
//             if(! parent.list) {
//                 parent.list = [];
//             }
//         // console.log('parent--',parent);
//         // 每個{}在array的哪個位置
        

//         resultData.push(parent);
//         console.log(parent);
//         // let pLength = Object.keys(parent).length;
//         // console.log('object長度:',pLength);
//         // console.log('array長度:',rs2.length);
//         // let p= i.product_sid;
//         // console.log('p:',p);
        
//         // console.log(i["order_sid"]);
    
        
//         // if(parent["order_sid"]!=parent["order_sid"]){

//         // }else{

//         // }
        
//         const ps={};
//         ps["order_sid"]=i.order_sid;
//         ps["product_sid"]=i.product_sid;
//         ps["product_price"]=i.product_price;
//         ps["product_quantity"]=i.product_quantity;
//         console.log('ps--',ps);
        

//         // parent.list.push('7');
        
//         if(parent.order_sid==ps.order_sid){
//             parent.list.push(ps);
//             // resultData.push(ps);
//         }
//         // for(let k of parent)

//         // switch(i.o_sid){
//         //     case 111:
//         //         parent.list={'order_sid':i.order_sid,'order_date':i.order_date,'product_sid':i.product_sid};
//         //         resultData.push(i);
//         //     break;
            
//         // }
//     }
//     // list塞入要的資料

//     // console.log(resultData);
//     // output.rows = orderObj;
//     // output.rows = rs2;
//     output.rows = resultData;

//     // }

//     return output.rows;
// }

async function getsidData(req,res){
    const output={
        success:false,
        error:''
    }
    const sid=req.params.sid;
    // SELECT `m_sid`,`email`,`m_name`,`gender`,`password`,`birthday`,`m_address` FROM `members` WHERE 1
    const sql=`SELECT m_sid,email,m_name,gender,password,birthday,m_address FROM members WHERE m_sid=${sid}`
    const [rs]=await db.query(sql)
    if(!rs.length){
        console.log(rs);
        output.error='沒有此筆資料';
    }
    output.success=true
    output.info=rs[0]

    return output;
}



// 取得房型訂單資料
router.get('/api/orders', async (req, res) => {
    const sql ="SELECT m.`m_sid`,m.`email`,o.`amount`,o.`order_sid`,o.`order_date`,tp.`room_sid`,tp.`start`,tp.`end` FROM `members` m JOIN `orders` o ON m.`m_sid`=o.`users_sid` JOIN `orders_details_live` tp ON o.`order_sid`=tp.`orders_sid` ORDER BY m.`m_sid` DESC";
    const [rs2] = await db.query(sql);
    rs2.forEach(el=>{
        // let str = res.locals.toDateString(el.birthday);
        let str2 = res.locals.toDatetimeString(el.order_date);
        if(str2 === 'Invalid date'){
            el.order_date = '沒有輸入資料';
        } else {
            el.order_date = str2;
        }
    });

    return res.json(rs2)
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

// 取得對應sid的會員資料
router.get('/edit/:sid', async (req, res)=>{
    res.json(await getsidData(req, res));
});
// 修改
router.post('/edit/:sid', async (req, res)=>{
    const output={
        success:false,
        error:'',
        info:''
    }
    console.log(res.locals.auth);
    // 取得前端帶來的token解密
    // {m_sid:row.m_sid, email}
    if(res.locals.auth && res.locals.auth.email){
        // return res.json({success:true, info:res.locals.auth.email})
        let {name,gender,password,birthday,address}=req.body
        const email=res.locals.auth.email;
        const m_sid=res.locals.auth.m_sid;

        // 取原先資料庫加密過後的密碼
        const selectPass="SELECT password FROM members WHERE m_sid="+`${m_sid}`
        const [rs1]=await db.query(selectPass);
        // console.log(selectPass)
        // console.log(rs1[0])
        
        if(password===""){
            // return res.json(birthday)
            const [rs]=await db.query(`UPDATE members SET m_name=?,gender=?,birthday=?,m_address=?  WHERE m_sid=${m_sid}`,[name,gender,birthday,address])
            // return res.json(rs)
            // return res.json(req.body)
            if(rs.changedRows!==0){
                output.success=true;
                output.status=500;
                return res.json(rs)
            }else{
                output.error='沒有變更'
                output.status=501;
                return res.json(rs)
            }


        }else{
            // 進來有值先比對
            // return res.json(password)
            if(bcrypt.compareSync(password,rs1[0].password)){
                // 密碼相同就不更新密碼
                // return res.json(password)
                const [rs2]=await db.query(`UPDATE members SET m_name=?,gender=?,birthday=?,m_address=?  WHERE m_sid=${m_sid}`,[name,gender,birthday,address])
                // return res.json(rs)
                if(rs2.changedRows!==0){
                    output.success=true;
                    output.status=600;
                    return res.json(output);
                }else{
                    output.error='沒有變更'
                    output.status=601;
                    return res.json(output);
                }

                
            }else{
                // 比對為不同密碼就加密
                password=bcrypt.hashSync(password);
                // return res.json(password)
                const [rs3]=await db.query(`UPDATE members SET m_name=?,gender=?,password=?,birthday=?,m_address=?  WHERE m_sid=${m_sid}`,[name,gender,password,birthday,address])
                // return res.json(rs)
                if(rs3.changedRows!==0){
                    output.success=true;
                    output.status=300;
                    return res.json(output)
                }else{
                    output.error='沒有變更'
                    output.status=301;
                    return res.json(output)
                }
            }

        }

        
    } else {
       return res.json({success: false, error: '沒有授權'});
    }
    // return res.json(req.body)
    
    
        
    // res.json(rs)
    // res.json(output)
});
// 註冊
router.post('/signup', upload.none(),async (req, res)=>{
    // return res.json(req.body)
    const output={
            success:false,
            error:''
        };

    const sql2="SELECT email FROM members WHERE 1"
    const [rs2]=await db.query(sql2)
    let newAr=[]

    rs2.forEach((el)=>{
        if(el.email===req.body.email){
        newAr.push(el)
        }
    })
    
    // return res.json(newAr[0].email)
    // return res.json(newAr.length)

    // 沒有相同帳號的話
    if(!newAr.length){

        try{
            const sql = "INSERT INTO members ( `email`, `m_name`,`gender` ,`birthday`,`password`) VALUES (?,?,?,?,?)";
            
            const [result]=await db.query(sql,[
                req.body.email,
                req.body.name,
                req.body.gender,
                req.body.birthday || '',
                bcrypt.hashSync(req.body.password),
            ]);
            console.log('result:',result);
            output.success=!!result.affectedRows;
            output.result=result;
            console.log('result:',result.insertId);
        }catch(error){
            console.log('error:',error)
            output.error='無法註冊'
        }
        // 可成功註冊就寄信給用戶
        if(output.success){
            let testAccount = await nodemailer.createTestAccount();
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                user: process.env.TYSU_SENDEMAIL, // Gmail 帳號
                pass:process.env.TYSU_SENDEMAIL_PASS, // Gmail 的應用程式的密碼
                },
            });
            let info = await transporter.sendMail({
                from: '"Wild Jungle" <wildjungle2022@gmail.com>', // 發送者
                to: 'wildjungle2022@gmail.com', // 收件者(req.body.email)
                subject: "Welcome! 歡迎您加入 Wild Jungle", // 主旨
                text: `Hello ${req.body.name}! 您已成功加入會員，前往登入`, // 預計會顯示的文字
                html: `<h3>Hello ${req.body.name}! 您已成功加入會員，<a href="http://localhost:3000/members/login">前往登入</a></h3>`, // html body 實際顯示出來的結果
            });
            
            console.log("Message sent: %s", info.messageId);
            
        }

    }else{
        // 有相同帳號的話
        output.error='已有此帳號'
    }

    res.json(output);

});

// 刪除

router.get('/api/list', async (req, res)=>{
    res.json(await getListData(req, res));
});
router.get('/api/orders', async (req, res)=>{
    res.json(await getorderData(req, res));
});

// 取得等級的json檔
router.get('/grade/list', async (req, res)=>{
    const sql="SELECT * FROM grade"
    const [rs]=await db.query(sql);
    res.json(rs)
});

// 取得信用卡資料
// 123456 // $2a$10$9nFkUVAoDtY1CdMo1JbWre/C.v3G0XJp9mkWevOHG8CFmWivHiSCy
router.get('/creditcard/:sid', async (req, res)=>{
    const output={
        success:false,
        error:'',
        info:''
    }
    if(res.locals.auth && res.locals.auth.email){
        const sid=req.params.sid;
        const sql=`SELECT * FROM credit_card WHERE m_id=${sid}`
        const [rs]=await db.query(sql);

        let newObj={}
        rs.map((v,i)=>{
            return newObj.m_sid=v.m_id
        })
        let list=[]
        rs.map((v,i)=>{
            list.push({"credit_sid":v.credit_sid,"credit_num":v.credit_num,"credit_date":v.credit_date,"credit_code":v.credit_code})
        })
        newObj.list=list
        return res.json(newObj);
        // {
        //     "m_sid": 8,
        //     "list": [
        //         {
        //             "credit_sid": 1,
        //             "credit_num": "562178451234",
        //             "credit_date": "0227",
        //             "credit_code": 756
        //         },
        //         {
        //             "credit_sid": 4,
        //             "credit_num": "562178451234",
        //             "credit_date": "1224",
        //             "credit_code": 756
        //         }
        //     ]
        // }

    }else{
        return res.json({success: false, error: '沒有授權'});
    
    }
    
});

// 房間的訂單資料
router.get('/orders/:sid', async (req, res)=>{
    const output={
        success:false,
        error:'',
        info:''
    }
    // if(res.locals.auth && res.locals.auth.email){
        const sid=req.params.sid;
        const sql=`SELECT * FROM orders WHERE m_sid=${sid}`
        const [rs]=await db.query(sql);
        // return res.json(rs)

        // "SELECT m.`m_sid`, o.`amount`, o.`order_sid`, o.`order_date`, tl.`room_count`, tl.`start`,tl.`end`, rd.`room_name`, rd.`price`, p.`method` FROM `members` m JOIN `orders` o ON m.`m_sid`=o.`m_sid` JOIN `orders_details_live` tl ON o.`order_sid`=tl.`orders_sid` JOIN `roomdetail` rd ON rd.`sid`=tl.`room_sid` JOIN `payment` p ON p.`payment_sid`=o.`payment_sid` ORDER BY m.`m_sid` DESC"
        const sql2 =`SELECT m.\`m_sid\`, o.\`amount\`, o.\`order_sid\`, o.\`order_date\`, tl.\`room_count\`, tl.\`start\`,tl.\`end\`, rd.\`room_name\`, rd.\`price\`, p.\`method\` FROM \`members\` m JOIN \`orders\` o ON m.\`m_sid\`=o.\`m_sid\` JOIN \`orders_details_live\` tl ON o.\`order_sid\`=tl.\`orders_sid\` JOIN \`roomdetail\` rd ON rd.\`sid\`=tl.\`room_sid\` JOIN \`payment\` p ON p.\`payment_sid\`=o.\`payment_sid\` WHERE m.\`m_sid\`=${sid} ORDER BY m.\`m_sid\` DESC `;
        const [rs2] = await db.query(sql2);
        // [{
        //         "m_sid": 1,
        //         "amount": 9000,
        //         "order_sid": 1,
        //         "order_date": "2021-10-24",
        //         "room_count": 2,
        //         "start": "2021-11-29",
        //         "end": "2021-12-01",
        //         "room_name": "冰原3人房型",
        //         "price": "4500",
        //         "method": "現金"
        // }]

        // rs2.forEach(el=>{
        //     // let str = res.locals.toDateString(el.birthday);
        //     let str2 = res.locals.toDatetimeString(el.order_date);
        //     if(str2 === 'Invalid date'){
        //         el.order_date = '沒有輸入資料';
        //     } else {
        //         el.order_date = str2;
        //     }
        // });

        return res.json(rs2)




    // }else{
    //     return res.json({success: false, error: '沒有授權'});
    
    // }
    
});



// router.get('/add', async (req, res)=>{
//     res.render('address-book/add');
// });
// // multipart/form-data
// router.post('/add2', upload.none(), async (req, res)=>{
//     res.json(req.body);
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