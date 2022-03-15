require('dotenv').config()
const fetch = require('node-fetch');
const axios = require('axios')
const express = require('express')
const cors = require('cors')
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const multer = require('multer');
const moment = require('moment-timezone')
// const upload = multer({ dest: 'tmp_uploads/' })
const upload = require(__dirname + '/modules/upload-imgs');
const fs = require('fs').promises;
const db = require('./modules/connect-db');
const sessionStore = new MysqlStore({}, db);
const app = express();
const corsOptions = {
    credentials: true,
    origin: function (origin, cb) {
        cb(null, true)
        //都沒有錯誤，都允許
    }
};

require('./routes/members');


app.use(cors(corsOptions));

app.set('view engine', 'ejs');
// app.get('/a.html', (req, res)=>{
//     res.send(`<h2>動態內容</h2><p>${Math.random()}</p>`)
// });

//Top-Level middleware 
app.use(express.urlencoded({ extended: false }));// application/x-www-form-urlencoded
app.use(express.json()); // application/json
app.use(express.static('public'));
app.use('/joi', express.static('node_modules/joi/dist/'));

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'qwerqwer',//加密用字串
    store: sessionStore,
    cookie: {
        maxAge: 1200000,
        //domain:'.alan.com'
    }//存活時間 單位是毫秒（20分鐘）
}));


//自訂的middleware
app.use((req, res, next) => {
    res.locals.alan = '哈囉';
    //template helper functions 樣板輔助函示
    res.locals.toDateString = date => moment(date).format('YYYY-MM-DD');
    res.locals.toDatetimeString = date => moment(date).format('YYYY-MM-DD HH:mm:ss');

    next();
})


app.get('/', (req, res) => {
    res.render('home', { name: 'WildJungle' });
});
// 定義路由



app.use('/members', require('./routes/members') );

//會員
app.get('/orders', async (req, res) => {
    const sql = "SELECT * FROM `orders` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//購物車
app.get('/animal-touch', async (req, res) => {
    const sql = "SELECT * FROM `animal_touch` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//活動
app.get('/products', async (req, res) => {
    const sql = "SELECT * FROM `products` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//商品
app.get('/game', async (req, res) => {
    const sql = "SELECT `question`.`sid`,`name`,`qcontent`,`acontent`,`yesno` FROM `question` JOIN `answer` WHERE `question_sid` = `question`.`sid`";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//遊戲
app.get('/roomdetail', async (req, res) => {
    const sql = "SELECT * FROM `roomdetail` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//住宿
app.get('/tour', async (req, res) => {
    const sql = "SELECT * FROM `address_1` WHERE 1";

    const [results, fields] = await db.query(sql);

    res.json(results);
})
//園區導覽




// 放在所有路由的後面
app.use((req, res) => {
    res.status(404).send(`<h2>404-找不到網頁</h2>`)
    // 設定狀態碼
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`server started: ${port} -`, new Date());
})