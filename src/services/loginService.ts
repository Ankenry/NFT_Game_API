var jwt = require('jsonwebtoken');
const moment = require('moment');
import logger from "../logger/winston";

export const login = async (body: { username: string, password: string }): Promise<any> => {
  const { username, password } = body

  try {
    if (username === process.env.X_USERNAME && password === process.env.X_PASSWORD) {
      const token = jwt.sign(
        { username },
        process.env.X_TOKEN_KEY,
        {
          expiresIn: "72h",
        }
      );

      logger.info(`[Login] account: ${username} - Login success`);
      return {
        success: true,
        token: token,
        exprired_in: 2 * 60 * 60
      };
    } else {
      logger.error(`[Login] account: ${username} - Wrong username or password`);
      return {
        success: false,
        message: "Wrong username or password"
      };
    }
  } catch (error) {
    logger.error(`[Login] - account: ${username} - error message: ${error}`, error);
  }
};

export const verifyLoginToken = async (token: string): Promise<any> => {
  // TODO call API verify token

  var username = "x";
  try {
    const token = jwt.sign(
      { username },
      process.env.X_TOKEN_KEY,
      {
        expiresIn: "72h",
      }
    );

    logger.info(`[verifyLoginToken] account: ${username} - Login success`);
    return {
      success: true,
      token: token,
      exprired_in: 2 * 60 * 60
    };
  } catch (error) {
    logger.error(`[verifyLoginToken] - error message: ${error}`, error);
  }
};