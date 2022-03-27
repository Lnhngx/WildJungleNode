const express = require("express");
const db = require("./../modules/connect-db");
const upload = require("./../modules/upload-imgs");

const router = express.Router();

// 自訂路由

router.get('/room-comments-list', async (req, res) => {
    const sql = "SELECT roomplatform.sid , roomplatform.service_score , roomplatform.clean_score , roomplatform.comfort_score , roomplatform.facility_score , roomplatform.cpValue_score, roomplatform.comments , members.m_name , orders_details_live.start  , orders_details_live.end, roomdetail.room_name FROM roomplatform JOIN members on roomplatform.m_sid = members.m_sid JOIN orders_details_live on roomplatform.order_detail_live_sid = orders_details_live.sid JOIN roomdetail on orders_details_live.room_sid = roomdetail.sid ORDER BY orders_details_live.start DESC";

    const [results, fields] = await db.query(sql);

    res.json(results);
})

router.post("/room-comments-post", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  const sql =
    "INSERT INTO `roomplatform`(`service_score`, `clean_score`, `comfort_score`, `facility_score`, `cpValue_score`, `comments` , `m_sid`,`order_sid` , `order_detail_live_sid`) VALUES (?,?,?,?,?,?,?,?,?)";

  const [result,fields] = await db.query(sql, [
    req.body.serve,
    req.body.clean,
    req.body.comfort,
    req.body.facility,
    req.body.cpValue,
    req.body.commentTextarea,
    1,
    1,
    1
  ]);

  console.log(result);
  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});

module.exports = router;
