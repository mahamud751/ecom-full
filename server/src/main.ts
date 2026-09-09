import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });

  // Uploaded media stays at /uploads/... (outside the /api prefix) so
  // existing DB URLs keep working. Uploads are content-addressed by name and
  // never rewritten in place, so let clients cache them hard.
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads",
    maxAge: "30d",
    immutable: true,
  });

  const config = new DocumentBuilder()
    .setTitle("Cholbe E-commerce API")
    .setDescription(
      "Backend API for the Cholbe health & beauty e-commerce platform: storefront, orders, doctors/consultations, lab tests and admin.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Customer auth (JWT)")
    .addTag("catalog", "Categories, brands, banners, products")
    .addTag("search", "Text + image search")
    .addTag("orders", "Checkout, tracking, coupons")
    .addTag("reviews", "Product reviews")
    .addTag("refunds", "Refund requests")
    .addTag("support", "Support tickets")
    .addTag("notify", "Product alerts")
    .addTag("wishlist", "Wishlist status")
    .addTag("lab", "Lab tests & bookings")
    .addTag("doctors", "Doctors listing")
    .addTag("consultations", "Consult bookings & lifecycle")
    .addTag("prescriptions", "E-prescriptions")
    .addTag("agora", "Agora RTC tokens")
    .addTag("upload", "File uploads")
    .addTag("admin", "Admin panel")
    .addTag("admin-auth", "Admin auth")
    .addTag("doctor-auth", "Doctor portal auth")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `API running on http://localhost:${port}/api — Swagger: /api/docs`,
  );
}
bootstrap();
