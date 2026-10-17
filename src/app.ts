import { merge } from "config-plus"
import dotenv from "dotenv"
import express, { json, Request } from "express"
import { allow, toString } from "express-web-kit"
import http from "http"
import { createLogger } from "logger-core"
import { Context, mask, MiddlewareLogger } from "middleware-logging"
import { connectToDb } from "mongodb-kit"
import { config, env } from "./config"
import { useContext } from "./context"
import { route } from "./route"

const logger = createLogger(config.log)
dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

const app = express()
const middleware = new MiddlewareLogger(logger.info, cfg.middleware, buildContext, encryptResponse, encryptRequest)
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

function buildContext(req: Request, context: Context): Context {
  context.requestId = req.header("X-Request-ID") ?? ""
  context.correlationId = req.header("X-Correlation-ID") ?? ""
  return context
}
function encryptResponse(rs: string): string {
  try {
    const body = JSON.parse(rs)
    if (body["phone"]) {
      body["phone"] = mask(body["phone"], 2, 2, "*")
    }
    if (body["email"]) {
      body["email"] = mask(body["email"], 2, 2, "*")
    }
    return JSON.stringify(body)
  } catch (err) {
    logger.error("Failed to encrypt response: " + toString(err))
  }
  return rs
}
function encryptRequest(body: any): string {
  if (typeof body === "object") {
    if (body["phone"]) {
      body["phone"] = mask(body["phone"], 2, 2, "*")
    }
    if (body["email"]) {
      body["email"] = mask(body["email"], 2, 2, "*")
    }
  }
  return JSON.stringify(body)
}
