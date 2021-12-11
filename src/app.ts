import { json } from 'body-parser';
import { merge } from 'config-plus';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { connectToDb } from 'mongodb-extension';
import { config, env } from './config';
import { useContext } from './context';
import { route } from './route';

dotenv.config();
const conf = merge(config, process.env, env, process.env.ENV);

const app = express();
app.use(json());

connectToDb(`${conf.mongo.uri}`, `${conf.mongo.db}`).then(db => {
  const ctx = useContext(db, conf);
  route(app, ctx);
  http.createServer(app).listen(conf.port, () => {
    console.log('Start mongo server at port ' + conf.port);
  });
}).catch(err => console.log('Cannot connect to mongo: ' + err));
