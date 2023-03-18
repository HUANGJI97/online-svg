FROM node:16.15.0-alpine

# 设置工作目录
WORKDIR /app

# 复制应用程序代码
COPY . /app

# 安装应用程序依赖
RUN npm install

# 暴露应用程序端口
EXPOSE 3008

# 启动应用程序
CMD ["npm", "start"]