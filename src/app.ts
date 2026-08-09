import { merge } from "config-plus"
import dotenv from "dotenv"
import express, { json, Request } from "express"
import { allow, MiddlewareLogger, SimpleMap } from "express-web-kit"
import http from "http"
import { createLogger } from "logger-core"
import { connectToDb } from "mongodb-kit"
import { config, env } from "./config"
import { useContext } from "./context"
import { route } from "./route"

import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])

const logger = createLogger(config.log)
dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

const app = express()
const middleware = new MiddlewareLogger(logger.info, cfg.middleware, buildHeader)
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

function buildHeader(req: Request, map: SimpleMap): SimpleMap {
  const requestId = req.get("X-Request-ID")
  if (requestId) {
    map["requestId"] = requestId
  }
  const correlationId = req.get("X-Correlation-ID")
  if (correlationId) {
    map["correlationId"] = correlationId
  }
  return map
}
