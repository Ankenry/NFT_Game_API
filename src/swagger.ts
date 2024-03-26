import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gesoten NFT Gateway API Docs",
      version: "0.0.1",
    },
    basePath: "/",
    host: process.env.NODE_ENV === "development" ? "localhost:3300" : "#",
    consumes: ["application/json", "multipart/form-data"],
    produces: ["application/json", "multipart/form-data"],
    schemes: ["http"],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        }
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ]
  },
  apis: [
    process.env.NODE_ENV === "development"
      ? "./src/server.ts"
      : "./dist/server.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options) as any;

export const swaggerDocs = (app: Express, port: number | string) => {
  // Swagger page
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  // app.get("/docs.json", (req: Request, res: Response) => {
  //   res.setHeader("Content-Type", "application/json");
  //   res.send(swaggerSpec);
  // });

  console.log(`Docs available at http://localhost:${port}/swagger`);
};
