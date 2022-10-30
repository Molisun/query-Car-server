const express = require('express');
const cors = require('cors');
const app = express();

// 调用 cors模块
app.use(cors());

//引入mysql模块
const mysql = require('mysql');

//配置mysql访问方式
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    //你的mysql密码
    password:'123456',
    //你要连接的数据库
    database:'querycar'
});

// 下面是接口 
// http://127.0.0.1:3000/

app.get('/', (req, res) => res.send('这里是膜老匠nodejs后端接口!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'));


//接收前端的数据   第一个是接口的名字
app.get('/list',function(request,response) {
    console.log('request',request.query)
    // request 请求，前端向后端请求
    // response后台给前端的反馈
    // request.query  前端发过来的get请求数据

    //查询语句
    const sql = `select *
                 from warranty
                 where carNumber = '${request.query.carNumber}'`
    //在数据库中查询，err是错误信息，data是查询后的结果以对象的形式返回
    db.query(sql, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            //data.length=1，即长度为1，直接简写
            if (data.length) {
                //输入正确登录成功
                response.send({code: 200, msg: '查询成功！', result:data})
            } else {
                //输入账号密码错误
                response.send({code: 500, msg: '无此条记录'})
            }
        }
    })
})