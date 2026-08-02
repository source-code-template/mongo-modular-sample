import { merge } from "config-plus"
import dotenv from "dotenv"
import express, { json } from "express"
import { allow, MiddlewareLogger } from "express-core-web"
import http from "http"
import { createLogger } from "logger-core"
import { connectToDb } from "mongodb-kit"
import { config, env } from "./config"
import { useContext } from "./context"
import { route } from "./route"

import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])

dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

const app = express()
const logger = createLogger(cfg.log)
const middleware = new MiddlewareLogger(logger.info, cfg.middleware)
app.use(allow(cfg.allow), json(), middleware.log)

connectToDb(`${cfg.mongo.uri}`, `${cfg.mongo.db}`)
  .then((db) => {
    const ctx = useContext(db, logger, middleware)
    route(app, ctx)
    http.createServer(app).listen(cfg.port, () => {
      console.log("Start mongo server at port " + cfg.port)
    })
  })
  .catch((err) => console.log("Cannot connect to mongo: " + err))
