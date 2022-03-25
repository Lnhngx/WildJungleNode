const express = require("express");
const db = require("./../modules/connect-db");
const upload = require("./../modules/upload-imgs");

const router = express.Router();

// 自訂路由
router.post("/room-comments-post", async (req, res) => {
    const output={
        success:false,
        error:''
    };
  const sql =await db.query(
    "INSERT INTO `roomplatform`(`service_score`, `clean_score`, `comfort_score`, `facility_score`, `cpValue_score`, `comments`, `m_sid`, `order_sid`, `order_detail_live_sid`) VALUES (?,?,?,?,?,?,?,?,?)");

  const [result] = await db.query(sql, [
    req.body.serve,
    req.body.clean,
    req.body.comfort,
    req.body.facility,
    req.body.cpValue,
    req.body.commentTextarea,
    3,
    3,
   2,
  ]);

  console.log(result);
  output.success=!!result.affectedRows;
  output.result=result;
  res.json(output);

});

module.exports = router;