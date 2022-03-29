require("dotenv").config();
const fetch = require("node-fetch");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MysqlStore = require("express-mysql-session")(session);
const multer = require("multer");
const moment = require("moment-timezone");
// const upload = multer({ dest: 'tmp_uploads/' })
const upload = require(__dirname + "/modules/upload-imgs");
const fs = require("fs").promises;
const db = require("./modules/connect-db");
const sessionStore = new MysqlStore({}, db);
const app = express();
const jwt = require("jsonwebtoken");
const corsOptions = {
  credentials: true,
  origin: function (origin, cb) {
    cb(null, true);
    //都沒有錯誤，都允許
  },
};
// 聊天機器人連線
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: {} });
io.on("connection", (socket) => {
  console.log(`id ${socket.id} is connected`);
  let currentRoom = "";
  socket.on("join", (room, cb) => {
    currentRoom = room;
    socket.join(room);
    cb(`你已進入${room}`);
  });
  socket.on("room message", (msg) => {
    socket.to(currentRoom).emit("room message", msg);
  });
  // 以下程式碼拿來呈現離線用
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

require("./routes/members");

app.use(cors(corsOptions));

app.set("view engine", "ejs");
// app.get('/a.html', (req, res)=>{
//     res.send(`<h2>動態內容</h2><p>${Math.random()}</p>`)
// });

//Top-Level middleware
app.use(express.urlencoded({ extended: false })); // application/x-www-form-urlencoded
app.use(express.json()); // application/json
app.use(express.static("public"));
app.use("/joi", express.static("node_modules/joi/dist/"));

app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "qwerqwer", //加密用字串
    store: sessionStore,
    cookie: {
        maxAge: 1200000,
        //domain:'.alan.com'
    }//存活時間 單位是毫秒（20分鐘）
}));



app.use("/roomplatform", require("./routes/roomplatform"));

//自訂的middleware
app.use((req, res, next) => {
  res.locals.alan = "哈囉";
  //template helper functions 樣板輔助函示
  res.locals.toDateString = (date) => moment(date).format("YYYY-MM-DD");
  res.locals.toDatetimeString = (date) =>
    moment(date).format("YYYY-MM-DD HH:mm:ss");

  // JWT
  res.locals.auth = null;
  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7);
    try {
      const payload = jwt.verify(auth, process.env.JWT_KEY);
      res.locals.auth = payload;
    } catch (ex) {
      console.log(ex);
    }
  }

  next();
});

app.get("/", (req, res) => {
  res.render("home", { name: "WildJungle" });
});
// 定義路由

app.use('/roomplatform', require('./routes/roomplatform') );

app.use('/members', require('./routes/members') );

//會員
app.get("/orders", async (req, res) => {
  const sql = "SELECT * FROM `orders` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//購物車
app.get("/animal-touch", async (req, res) => {
  const sql = "SELECT * FROM `animal_touch` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//活動

//商品
app.get("/products", async (req, res) => {
  const sql = "SELECT * FROM `products` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//商品的標籤
app.get("/productslabel", async (req, res) => {
  const sql = "SELECT * FROM `productslabel` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//商品圖片
app.get("/productspic", async (req, res) => {
  const sql = "SELECT * FROM `productspic` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//商品評價星星


app.get("/productsreview", async (req, res) => {
  const sql = "SELECT * FROM `productsreview` ORDER BY `ReviewSid` DESC ";

  const [results, fields] = await db.query(sql);

  res.json(results);
});

app.get("/productsmemberreview", async (req, res) => {
  const sql = "SELECT `m_name` ,`m_sid` ,`memberSid`, `ProductsReview`FROM `members`, `productsreview`  WHERE `m_sid` = `memberSid` ORDER BY `ReviewSid` DESC";
  //const sql = "SELECT `m_name` ,`m_sid` FROM `members`  WHERE 1";
  const [results, fields] = await db.query(sql);
  res.json(results);
});


app.use("/reviewproducts", require("./routes/productsitem"));

// app.post('/add', async (req, res) => {
//     const output = {
//         success: false,
//         error: ''
//     };
//     const sql = "INSERT INTO `productsreview` (`ReviewSid`, `ProductsReview`, `ReviewStar`, `Review`, `memberSid`, `ReviewDate`) VALUES (NULL, ?, ?,  ?, ?,current_timestamp())";

//     const [result] = await db.query(sql, [
//         req.body.ReviewSid,
//         req.body.ProductsReview || null,
//         req.body.ReviewStar || null,
//         req.body.Review || null,
//         req.body.memberSid || null,
//         req.body.ReviewDate || 0,
//     ]);
//     console.log(result);
//     output.success = !!result.affectedRows;
//     output.result = result;
//     res.json(output);
// });






//商品規格
app.get("/productsspec", async (req, res) => {
  const sql = "SELECT * FROM `productsspec` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//商品種類（可能用不到）
app.get("/productstype", async (req, res) => {
  const sql = "SELECT * FROM `productstype` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});

// 遊戲
app.get("/game", async (req, res) => {
  const sql1 = "SELECT q.* FROM `question` q ORDER BY rand() LIMIT 10";
  const [rs1] = await db.query(sql1);

  const q_ids = rs1.map((r) => r.sid);

  const sql2 = `SELECT * FROM  \`answer\` WHERE question_sid IN (${q_ids.join(
    ","
  )}) `; // question_sid
  const [rs2] = await db.query(sql2);
  let new_arr = {
    answer0: { list: [] },
    answer1: { list: [] },
    answer2: { list: [] },
    answer3: { list: [] },
    answer4: { list: [] },
    answer5: { list: [] },
    answer6: { list: [] },
    answer7: { list: [] },
    answer8: { list: [] },
    answer9: { list: [] },
  };
  rs2.map((v, i) => {
    if (v.question_sid === q_ids[0] && v.yesno === "right") {
      new_arr.answer0.yes = v.acontent;
      new_arr.answer0.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[1] && v.yesno === "right") {
      new_arr.answer1.yes = v.acontent;
      new_arr.answer1.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[2] && v.yesno === "right") {
      new_arr.answer2.yes = v.acontent;
      new_arr.answer2.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[3] && v.yesno === "right") {
      new_arr.answer3.yes = v.acontent;
      new_arr.answer3.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[4] && v.yesno === "right") {
      new_arr.answer4.yes = v.acontent;
      new_arr.answer4.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[5] && v.yesno === "right") {
      new_arr.answer5.yes = v.acontent;
      new_arr.answer5.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[6] && v.yesno === "right") {
      new_arr.answer6.yes = v.acontent;
      new_arr.answer6.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[7] && v.yesno === "right") {
      new_arr.answer7.yes = v.acontent;
      new_arr.answer7.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[8] && v.yesno === "right") {
      new_arr.answer8.yes = v.acontent;
      new_arr.answer8.question_sid = v.question_sid;
    } else if (v.question_sid === q_ids[9] && v.yesno === "right") {
      new_arr.answer9.yes = v.acontent;
      new_arr.answer9.question_sid = v.question_sid;
    }
    if (v.question_sid === q_ids[0]) {
      new_arr.answer0.list.push(v.acontent);
    } else if (v.question_sid === q_ids[1]) {
      new_arr.answer1.list.push(v.acontent);
    } else if (v.question_sid === q_ids[2]) {
      new_arr.answer2.list.push(v.acontent);
    } else if (v.question_sid === q_ids[3]) {
      new_arr.answer3.list.push(v.acontent);
    } else if (v.question_sid === q_ids[4]) {
      new_arr.answer4.list.push(v.acontent);
    } else if (v.question_sid === q_ids[5]) {
      new_arr.answer5.list.push(v.acontent);
    } else if (v.question_sid === q_ids[6]) {
      new_arr.answer6.list.push(v.acontent);
    } else if (v.question_sid === q_ids[7]) {
      new_arr.answer7.list.push(v.acontent);
    } else if (v.question_sid === q_ids[8]) {
      new_arr.answer8.list.push(v.acontent);
    } else if (v.question_sid === q_ids[9]) {
      new_arr.answer9.list.push(v.acontent);
    }
  });
  // console.log(new_arr);

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (new_arr.answer0.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer0.list;
        rs1[j].yes = new_arr.answer0.yes;
      }
      if (new_arr.answer1.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer1.list;
        rs1[j].yes = new_arr.answer1.yes;
      }
      if (new_arr.answer2.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer2.list;
        rs1[j].yes = new_arr.answer2.yes;
      }
      if (new_arr.answer3.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer3.list;
        rs1[j].yes = new_arr.answer3.yes;
      }
      if (new_arr.answer4.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer4.list;
        rs1[j].yes = new_arr.answer4.yes;
      }
      if (new_arr.answer5.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer5.list;
        rs1[j].yes = new_arr.answer5.yes;
      }
      if (new_arr.answer6.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer6.list;
        rs1[j].yes = new_arr.answer6.yes;
      }
      if (new_arr.answer7.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer7.list;
        rs1[j].yes = new_arr.answer7.yes;
      }
      if (new_arr.answer8.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer8.list;
        rs1[j].yes = new_arr.answer8.yes;
      }
      if (new_arr.answer9.question_sid === rs1[j].sid) {
        rs1[j].answers = new_arr.answer9.list;
        rs1[j].yes = new_arr.answer9.yes;
      }
    }
  }
  res.json(rs1);
  // const sql2 = "SELECT q.`sid`,`name`,`qcontent`,`acontent`,`yesno` FROM (SELECT q.* FROM `question` q ORDER BY rand() LIMIT 10)q JOIN `answer` WHERE `question_sid` = q.`sid` LIMIT 40;";
  // const [results] = await db.query(sql);
});
app.post('/game-points', async (req, res) => {
    const sql = "INSERT INTO `bonus_list` ( `point_id`, `getTime_start`,`getTime_end` ,`bonus_status`,`m_id`) VALUES (?,?,?,?,?)";
    const [result,fields]=await db.query(sql,[
        req.body.point_id || '',
        req.body.getTime_start,
        req.body.getTime_end,
        req.body.bonus_status,
        req.body.m_id,
    ])
    res.json('success')
})
app.post('/chatbot', async (req, res) => {
    let output = {
        success: false,
        results:{respond:'抱歉，我聽不懂你在說什麼?\n您可以點選專人客服為您服務。'}
    }
    const message = req.body.request;
    let sql = '';
    console.log(message) //檢查用，正式時可刪除
    if(message.indexOf('你好')!==-1 || message.indexOf('午安')!==-1 || message.indexOf('早安')!==-1 || message.indexOf('晚安')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%你好%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('地址')!==-1){
        sql = "SELECT `respond` FROM `chatbot` WHERE `request` LIKE '%地址%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('票價')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%票價%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('紅利')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%紅利%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('點數')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%點數%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('開放時間')!==-1 || message.indexOf('幾點開門')!==-1 || message.indexOf('營業')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%開放時間%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    if(message.indexOf('住宿')!==-1 || message.indexOf('房型')!==-1){
        sql = "SELECT * FROM `chatbot` WHERE `request` LIKE '%住宿資訊%'";
        const [results] = await db.query(sql);
        output.success = true;
        output.results = results[0];
    }
    
    
    
    res.json(output);
});
//遊戲
app.get("/roomdetail", async (req, res) => {
  const sql = "SELECT * FROM `roomdetail` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//住宿
app.get('/room-comments-list', async (req, res) => {
    const sql = "SELECT roomplatform.sid , roomplatform.service_score , roomplatform.clean_score , roomplatform.comfort_score , roomplatform.facility_score , roomplatform.cpValue_score, roomplatform.comments , members.m_name , orders_details_live.start  , orders_details_live.end, roomdetail.room_name FROM roomplatform JOIN members on roomplatform.m_sid = members.m_sid JOIN orders_details_live on roomplatform.order_detail_live_sid = orders_details_live.sid JOIN roomdetail on orders_details_live.room_sid = roomdetail.sid";

  const [results, fields] = await db.query(sql);

    res.json(results);
})


//住宿
app.get("/tour", async (req, res) => {
  const sql = "SELECT * FROM `address_1` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});
//園區導覽
app.get("/chatbot", async (req, res) => {
  const sql = "SELECT * FROM `chatbot` WHERE 1";

  const [results, fields] = await db.query(sql);

  res.json(results);
});

// 放在所有路由的後面
app.use((req, res) => {
  res.status(404).send(`<h2>404-找不到網頁</h2>`);
  // 設定狀態碼
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`server started: ${port} -`, new Date());
});
server.listen(3001, () => {
  console.log("listening on *:3001");
});
