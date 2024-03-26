const moment = require('moment');
const winston = require('winston');
const path = require('path');
const DailyRotateFile = require("winston-daily-rotate-file");

module.exports = winston.createLogger({
    // format của log được kết hợp thông qua format.combine
    format: winston.format.combine(
        winston.format.splat(),
        // Định dạng time cho log
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        // thêm màu sắc
        winston.format.colorize(),
        // thiết lập định dạng của log
        winston.format.printf(
            log => {
                // nếu log là error hiển thị stack trace còn không hiển thị message của log 
                if (log.stack) {
                    // return `[${log.timestamp}] [${log.level}] ${log.stack}`;
                    return `[${log.timestamp}] [Error]${log.message} ${log.stack}`;
                }

                // return `[${log.timestamp}] [${log.level}] ${log.message}`;
                return `[${log.timestamp}] [Info]${log.message}`;
            },
        ),
    ),
    transports: [
        // hiển thị log thông qua console
        new winston.transports.Console(),
        // Thiết lập ghi các errors vào file 
        new DailyRotateFile({
            filename: "./logs/NFT_log_%DATE%.log",
            datePattern: "YYYY_MM_DD",
            maxFiles: '1d'
            // zippedArchive: true
        }),
        // new DailyRotateFile({
        //     filename: "./logs/NFT-info%DATE%.log",
        //     level: "info",
        //     datePattern: "YYYY-MM",
        //     zippedArchive: true
        // })
    ],
})