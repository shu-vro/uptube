import swaggerJSDoc from "swagger-jsdoc";

export const openapiSpecification = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Uptube Backend",
      version: "1.0.0",
    },
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            statusCode: { type: "integer", example: 400 },
          },
        },
      },
    },
  },
  apis: ["./**/*.ts"],
});
