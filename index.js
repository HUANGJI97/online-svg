const express = require("express")
const fs = require("fs")
require('dotenv').config();
var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    SecretId: process.env.SECRET_ID, // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
    SecretKey: process.env.SECRET_KEY, // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
});
const app = express();
function renderIconListPage(icons,color='black',serverPath){
   
   return  `
    <head>
       
    </head>
    <style>
    .icon-wrapper{
        padding: 10px;
        width: 30px;
        display: flex;
        height: 30px;
        align-items: center;
        justify-content: center;
        box-shadow:  3px 3px 6px #d8d5d5,
        -3px -3px 6px #ffffff;
        border-radius:15px;
    }
    .icon-wrapper:hover{
        box-shadow:  3px 3px 6px #d8d5d5,
        -3px -3px 6px #ffffff;
        border-radius:15px;
    }
    .icon-item{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }
    .icon-name{
        margin-top:8px;
    }
    </style>
    <div  style="display:grid;grid-template-columns: repeat(10,1fr);gap:24px;text-align:center;flex-wrap:wrap;">
        ${
            icons.map(item=>{
                return `
                    <div class="icon-item" οnclick="handleIconClick()">
                        <div class="icon-wrapper" style="padding:10px;">
                            <img src='${serverPath}/icon/cos/${item.name}?color=${color}' />
                        </div>
                        <div class="icon-name" style="color:#888;font-size:12px">${item.name}</div>
                     </div>    
                `
            }).join('')
        }
    </div>
    <script>
        document.querySelectorAll('.icon-item').forEach(item=>{
            item.onclick=function(){
                const src = item.querySelector('img').src
                navigator.clipboard.writeText(src);
                console.log("复制成功",src)
            }
        })
  </script>
    
    `
}

app.get("/",(req,res)=>{
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
app.get("/icon/cos/:key",(req,res)=>{
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
                console.log("替换颜色值",color)
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
app.get("/icon/:name",(req,res)=>{
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
app.listen(3008,()=>{
    console.log('Success! app listening on port http://localhost:3008')
})