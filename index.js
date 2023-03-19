const express = require("express")
const multer  = require('multer')
const fs = require("fs")

require('dotenv').config();
var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    SecretId: process.env.SECRET_ID, // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
    SecretKey: process.env.SECRET_KEY, // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
});
const app = express();
const router = express.Router();
const upload = multer({storage:multer.memoryStorage() }).any()
// app.use(upload.array())
app.set("views",__dirname+'/template') 
app.set('view engine', 'ejs');

function  uploadFileToCos(fileBuffer,name){
    return new Promise((resolve,reject)=>{
        cos.putObject({
            Bucket:"svg-icons-1256329911",
            Region:"ap-shanghai",
            Key:`${name}.svg`,
            Body:fileBuffer
        },(err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })

}


router.post("/add-icon",upload,async (req,res)=>{
    const formData = req.body;
    const name = formData["icon-name"]
    const files = req.files //Object.fromEntries(req.files.map(item=>([item.fieldname,item.buffer])))
    const uploadResult = await Promise.all(files.map(async(file)=>{
        const type = file.fieldname === 'normal' ? '' : `-${file.fieldname}`
        const res=  await uploadFileToCos(file.buffer,`${name}${type}`)
        console.log(`${name}${type}.svg 上传成功`)
        return res
    }))
   
    // console.log(files)
    res.send({
        message:"success",
        data:uploadResult.map(item=>item.Location),
        // name,
        // files,
    })
})

router.get("/hello",(req,res)=>{
    cos.getBucket({
        Bucket: 'svg-icons-1256329911', /* 必须 */
        Region: 'ap-shanghai',    /* 必须 */
        Prefix: '',  
    }, function(err, data) {
        console.log('文件列表读取',data)
        const list =  data.Contents.filter(item=>item.Size > 0).map(item=>({name:item.Key}))
        const serverPath = `${req.protocol}://${req.get('host')}`
        res.render("index",{title:"SvgIcons",icons:list,color:req.query.color,serverPath})
        // res.send(renderIconListPage(list,req.query.color,serverPath))
    })
  
})

router.get("/icons/:key",(req,res)=>{
    const key = req.params.key
    const {color} = req.query
    console.log("获取到key",`[${key}]`)
    cos.getObject({
        Bucket: 'svg-icons-1256329911', /* 必须 */
        Region: 'ap-shanghai',    /* 必须 */
        Key:key
    }, function(err, data) {
        // console.log("打印获取到的对象",data.Body)
        if(!err){
            const targetSvg = data.Body.toString('utf-8')
            let response = targetSvg;
            if(color){
                // console.log("替换颜色值",color)
                response= targetSvg.replace(/#.{6}/g,color);
            }
            res.set('Content-Type', 'image/svg+xml')
            res.send(response)
        }else{
            res.send({
                message:'fail',
                key,
                err,
            })
        }
    
    })

})
router.get("/icon/:name",(req,res)=>{
    console.log(req.query)
    const {color} = req.query
    const {name} = req.params
    console.log("params",name)
    try{
        const targetSvg = fs.readFileSync(`./svgs/${name}`,'utf-8')
        // console.log("读取svg文件",targetSvg)
        let response = targetSvg;
        
        if(color){
            console.log("替换颜色值",color)
            response= targetSvg.replace(/#.{6}/g,color);
        }
        res.set('Content-Type', 'image/svg+xml')
        res.send(response)
    }catch(e){
        res.send(e)

    }
   

})
router.get("/",(req,res)=>{
    cos.getBucket({
        Bucket: 'svg-icons-1256329911', /* 必须 */
        Region: 'ap-shanghai',    /* 必须 */
        Prefix: '',  
    }, function(err, data) {
        console.log('文件列表读取',data)
        const list =  data.Contents.filter(item=>item.Size > 0).map(item=>({name:item.Key}))
        const serverPath = `${req.protocol}://${req.get('host')}`
        res.send(renderIconListPage(list,req.query.color,serverPath))
    })
   
    // try{
    //     const fileList = fs.readdir('./svgs',{withFileTypes:true},(err,files)=>{
    //         if(err){
    //             console.error("读取出错",err)
    //         }else{
               
    //             const serverPath = `${req.protocol}://${req.get('host')}`
    //             console.log(serverPath)
    //             const color = req.query.color || 'black'
    
    //             res.send()
    //         }
    //     })
    // }catch(e){
    //     console.log('服务出错',e)
       
    // }
   

})
router.get("*",(req,res)=>{
    res.send({
        path:req.path,
        query:req.query,
        params:req.params,
        message:"捕获未定义路由",

    })
})
app.use(router)
app.listen(3008,()=>{
    console.log('Success! app listening on port http://localhost:3008')
})