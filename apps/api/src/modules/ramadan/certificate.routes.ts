import { Hono } from "hono";
import { auth, getUserId, requireAuth } from "@/pkg/middleware/clerk-auth";
import { NotFoundError } from "@/pkg/errors";
import { ramadanService } from "./ramadan.service";
import { generateCertificatePdf } from "./certificate-pdf";

export const certificateRoutes = new Hono()
  // Public endpoint: verify a certificate (no auth required)
  .get("/verify/:verificationId", async (c) => {
    const verificationId = c.req.param("verificationId");
    const result = await ramadanService.verifyCertificate(verificationId);
    if (!result) {
      return c.json({
        valid: false as const,
        certificate: null,
        imageUrl: null,
      }, 200);
    }
    return c.json({
      valid: true as const,
      certificate: result.certificate,
      imageUrl: result.imageUrl,
    }, 200);
  })
  // Auth-required endpoints below
  .use(auth(), requireAuth)
  .get("/me", async (c) => {
    const userId = getUserId(c);
    const certificate = await ramadanService.getMyCertificate(userId);
    const submissions = await ramadanService.getMyBestSubmissions(userId);
    const eligible = submissions.length >= 30;
    return c.json({ certificate, eligible, completedCount: submissions.length }, 200);
  })
  .post("/", async (c) => {
    const userId = getUserId(c);
    const certificate = await ramadanService.issueCertificate(userId);
    return c.json(certificate, 201);
  })
  .get("/:id/pdf", async (c) => {
    const userId = getUserId(c);
    const cert = await ramadanService.getMyCertificate(userId);
    if (!cert || cert.id !== c.req.param("id")) {
      throw new NotFoundError("Certificate not found");
    }
    const pdfBuffer = generateCertificatePdf(cert);
    c.header("Content-Type", "application/pdf");
    c.header(
      "Content-Disposition",
      `attachment; filename="RPN-Certificate-${cert.verificationId}.pdf"`
    );
    return c.body(pdfBuffer);
  });
