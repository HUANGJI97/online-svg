const express = require("express")
const fs = require("fs")
require('dotenv').config();
var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    SecretId: process.env.SECRET_ID, // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
    SecretKey: process.env.SECRET_KEY, // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
});
function renderIconListPage(icons,color='black',serverPath){
   const namesType = icons.map(item=>`'${item.name.replace(/^(.*)\.svg$/g,'$1')}'`).join(" | ")
   return  `
    <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/highlight.min.js"></script>
        <!-- and it's easy to individually load additional languages -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/languages/go.min.js"></script>
    <style>
    body{
        background: #ededed;
    }
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
    background-color: #efefef;

}
.icon-wrapper:active{
    box-shadow: inset 3px 3px 6px #d8d5d5, inset -3px -3px 6px #ffffff;
    color: #666;
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
.toast{
    box-shadow:  3px 3px 6px #d8d5d5,
    -3px -3px 6px #ffffff;
    background-color: white;
    position: fixed;
    top: 10px;
    right: 0px;
    left: 0px;
    margin: 0px auto;
    width: fit-content;
    padding:10px 15px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    opacity: 0;
    color: #666;
    transition:all .5s;

}
.toast.show{
    opacity: 1;

}
.toast img{
    width: 20px;
    height: 20px;
    margin-right: 8px;

}
.highlight {
    
    background-color: #333;
    color: white;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 14px;
}
.code-wrapper{
    background-color: #333;
    width: fit-content;
    box-sizing: border-box;
    padding: 16px;
    border-radius: 10px;

}
pre {
    text-align: left;
    cursor: pointer;
}
code {
    white-space: pre-wrap;
    text-align: left;
    box-shadow:  3px 3px 6px #d8d5d5,

  }
    </style>
    </head>
    <body>
    <div id="toast" class="toast">
        <img  src="${serverPath}/icons/copy-success-twotone.svg?color=blue" />
        <div id="toast-message"></div>
          
    </div>
    <div  style="margin-top:70px;display:grid;grid-template-columns: repeat(10,1fr);gap:24px;text-align:center;flex-wrap:wrap;">
        ${
            icons.map(item=>{
                const name = item.name.replace(/^(.*)\.svg$/g,'$1')
                return `
                    <div class="icon-item" οnclick="handleIconClick()" data-name="${item.name}">
                        <div class="icon-wrapper" style="padding:10px;">
                            <img src='${serverPath}/icons/${item.name}?color=${color}' />
                        </div>
                        <div class="icon-name" style="color:#888;font-size:12px">${name}</div>
                     </div>    
                `
            }).join('')
        }
    </div>
    <div style="margin-top:30px;max-width:50vw;">
        <div> icons.d.ts</div>
        <pre >
            <code contenteditable class="language-typescript" style="border-radius:10px;">type IconNames = ${namesType}</code>
        </pre>
    </div>
    </body>
    <script>
    const Toast = {
        ele: document.querySelector("#toast"),
    
        show(message){
            console.log(this)
            document.querySelector("#toast-message").innerHTML =  message
            this.ele.classList.add('show')
            setTimeout(()=>{
                this.ele.classList.remove("show")
            },1000)
            
        }
    }
    document.querySelectorAll('.icon-item').forEach(item=>{
        item.onclick=function(){
            const name = item.getAttribute("data-name").replace(".svg","")
            console.log("点击",name,item)
            const src = item.querySelector('img').src
            // const name = src.replace(/.*\/(\.*)\\.svg$/g,'$1')
            navigator.clipboard.writeText(name);
            Toast.show("复制成功 <b style='margin-left:8px;'>"+ name +"</b>")
        }
    })
    hljs.highlightAll();
  </script>
    
    `
}
const app = express();
const router = express.Router();

router.get("/hello",(req,res)=>{
    res.send({
        a:222,
        query:req.query,
        params:req.params
    })
})
router.get("/icon-s/:key",(req,res)=>{
    res.send({
        a:111,
        params:req.params
    })
})
router.get("/icons/:key",(req,res)=>{
    const key = req.params.key
    const {color} = req.query
    // console.log("获取到key",`[${key}]`)
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