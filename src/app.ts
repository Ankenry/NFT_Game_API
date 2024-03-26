import express from "express";
import * as bodyParser from "body-parser";
import { ormconfig } from "./ormconfig"

var cookieParser = require('cookie-parser')
var compress = require('compression');
var helmet = require('helmet');
var cors = require('cors');

require('dotenv').config()

class App {
    public app: express.Application;

    constructor() {
        console.log(`Application starting`);
        
        this.app = express();
        this.config();
    }

    private config(): void {
        console.log(`App start connect to database`);
        ormconfig
            .initialize()
            .then(() => {
                console.log("Data Source has been initialized!")
            })
            .catch((err) => {
                console.error("Error during Data Source initialization:", err)
            })

        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(compress());
        this.app.use(helmet());

        // enable CORS - Cross Origin Resource Sharing
        this.app.use(cors());

        console.log(`Application start successfully`);
    }
}

export default new App().app;