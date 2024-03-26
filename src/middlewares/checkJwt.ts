import { Request, Response, NextFunction } from "express";
import logger from "../logger/winston";
const moment = require('moment');
var jwt = require('jsonwebtoken');

export const checkJwt = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jwtToken = <string>req?.headers["authorization"] ?? "";
    if (!jwtToken) {
      logger.info(`[checkJwt];;date_time:${moment().format('DD/MM/YYYY')};Authorization key not found`);

      res.status(401).send();
      return;
    }

    const tokenArray = jwtToken.split(" ");
    const token = tokenArray?.length ? tokenArray[1] : null;
    if (!token) {
      logger.info(`[checkJwt];;date_time:${moment().format('DD/MM/YYYY')};A token is required for authentication`);
      return res.status(401).send("A token is required for authentication");
    }

    const decoded = jwt.verify(token, process.env.X_TOKEN_KEY);

    req.user = decoded;
    if (!decoded?.username) {
      logger.info(`[checkJwt];;date_time:${moment().format('DD/MM/YYYY')};The login token invalid`);
      res.status(401).send();
    }

    return next();
  } catch (error) {
    logger.error(`[checkJwt];;date_time:${moment().format('DD/MM/YYYY')};${JSON.stringify(error?.response?.data ?? error)}`);
    res.status(401).send();
    return;
  }
};