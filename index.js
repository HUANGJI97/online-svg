const express = require("express")
const fs = require("fs")

const app = express();
app.get("/",(req,res)=>{
    try{
        const fileList = fs.readdir('./svgs',{withFileTypes:true},(err,files)=>{
            if(err){
                console.error("读取出错",err)
            }else{
               
                const serverPath = `${req.protocol}://${req.get('host')}`
                console.log(serverPath)
                const color = req.query.color || 'black'
    
                res.send(`
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
                        files.map(item=>{
                            return `
                                <div class="icon-item" οnclick="handleIconClick()">
                                    <div class="icon-wrapper" style="padding:10px;">
                                        <img src='${serverPath}/icon/${item.name}?color=${color}' />
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
                
                `)
            }
        })
    }catch(e){
        console.log('服务出错',e)
        res.send({
            error:e,
            // ls:fs.readdirSync("./")
        })
    }
   

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
    console.log('Example app listening on port http://localhost:3008!')
})