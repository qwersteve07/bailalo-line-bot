const Koa = require("koa");
const { koaBody } = require("koa-body");
const cors = require("@koa/cors");
const router = require("./router");
const app = new Koa();

const PORT = process.env.PORT || 3000;

app
  .use(cors())
  .use(koaBody({ multipart: true }))
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(PORT, () => {
    console.log(`server listen to ${PORT}`);
  });
