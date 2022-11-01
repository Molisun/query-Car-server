const express = require('express');
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser')
//导入上传文件中间件，能帮助我们实现接收文件的接口
const multer  = require('multer')
//接收到的文件放uploads文件夹
const upload = multer({ dest: 'uploads/' })
// 导入knex插件，他能帮助我们连接MySQL数据库
const knex = require('knex')({
    client: 'mysql',
    //填入数据库的地址、账号、密码、库名
    connection: {
        host     : 'localhost',
        user     : 'root',
        password : '123456',
        database : 'querycar'
    }
})
//使得express后端能接收前端发送回来的json格式数据
app.use(express.json());
// 导入bodyParser插件，它帮助我们获取前端post请求传过来的参数
app.use(bodyParser.urlencoded({ extended:false }))
//使得让外部通过链接可以访问这个文件夹里文件（ 地址 + 端口 / 文件名 ）便可访问
app.use(express.static('uploads'))
// 调用 cors模块
app.use(cors());
//使得express后端能接收前端发送回来的json格式数据
app.use(express.json());

//引入mysql模块
const mysql = require('mysql');

//配置mysql访问方式
let db

//mysql自动重连
function handleDisconnection() {
    db = mysql.createConnection({
        host:'localhost',
        user:'root',
        //你的mysql密码
        password:'123456',
        //你要连接的数据库
        database:'querycar',
        useConnectionPooling: true
    })
    db.connect(function (err) {
        if (err) {
            setTimeout(()=>{handleDisconnection()}, 2000);
        }
    });

    db.on('error', function (err) {
        logger.error('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            logger.error('db error执行重连:' + err.message);
            handleDisconnection();
        } else {
            throw err;
        }
    });
}
handleDisconnection();

// 下面是接口 
// http://127.0.0.1:3000/

app.get('/', (req, res) => res.send('这里是膜老匠nodejs后端接口!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'));

app.all('*', function(req, res, next) {
    console.log(req.method);
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Content-type');
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS,PATCH");
    res.header('Access-Control-Max-Age',1728000);//预请求缓存20天
    next();
});

//查询质保信息
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

//新增售后信息
app.post('/addAfter',function(request,response) {

    const name = request.query.name;
    const mobilePhone = request.query.mobilePhone;
    const problem = request.query.problem;
    const submitTime = request.query.submitTime;
    const isDelete = request.query.isDelete;

    //查询语句
    const sql = `insert into after (name, mobilePhone, problem,submitTime,isDelete) values ('${name}', '${mobilePhone}', '${problem}','${submitTime}','${isDelete}');`

    db.query(sql, function (err, data) {
        if(err){
            console.log(err)
        }else{
            response.send({code: 200, msg: '新增成功！', result:data})
        }
    })
})

//查询售后信息
app.get('/listAfter',function(request,response) {
    //查询语句
    const sql = `select * from after where isDelete = 'false'`
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
                response.send({code: 500, msg: '数据库中无售后提交记录'})
            }
        }
    })
})

//删除售后信息
app.get('/delAfter',function(request,response) {
    console.log('request',request.query)
    const idArr = request.query.id
    let id = ""
    if(idArr.length == 1){
        id = idArr[0]
    }else{
        id = idArr.join(',')
    }
    console.log(id)
    //查询语句
    const sql = `update after SET isDelete='true' where id in (${id})`

    console.log(sql)

    db.query(sql, function (err, data) {
        if (err) {
            console.log(err)
        } else {

            response.send({code: 200, msg: '删除成功！', result:data})

        }
    })
})

//新增质保信息
app.post('/imageAdd',upload.single('constructionImage'),(req,response)=>{
    // req.file得到前端发送回来的文件信息，req.body的到文件文本信息
    const {file,body,query} = req
    console.log(query)
    for (const key in query) {
        console.log(key)
    }
    console.log(body)
    //判断是否发送的是空文件回来
    if( file == undefined){
        response.send({code:400,msg:'新增失败,参数缺失'})
    }else{
        //利用kenx在数据库完成新增操作，保存文件名字段
        //相当于 insert into comic （icon）values（file.filename）
        knex('warranty').insert(
            {
                ...body,
                constructionImage:file.filename
            }
        ).then(res=>{
            response.send({code:200,msg:'新增成功'})
        })
    }
})
