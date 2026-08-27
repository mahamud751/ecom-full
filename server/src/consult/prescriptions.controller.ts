import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";

type RxItemInput = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

@ApiTags("prescriptions")
@Controller("prescriptions")
export class PrescriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({
    summary: "Create/update prescription for a consult (completes it)",
  })
  async create(
    @Body()
    body: {
      consultationId: string;
      diagnosis?: string;
      advice?: string;
      followUp?: string;
      items: RxItemInput[];
    },
  ) {
    try {
      const { consultationId, diagnosis, advice, followUp, items } =
        body || ({} as never);

      if (!consultationId) {
        throw new ApiError(400, "consultationId is required");
      }

      const consultation = await this.prisma.consultation.findFirst({
        where: {
          OR: [{ id: consultationId }, { consultNumber: consultationId }],
        },
        include: { prescription: true },
      });

      if (!consultation) {
        throw new ApiError(404, "Consultation not found");
      }

      const cleanItems = (items || [])
        .filter((i) => i.medicineName?.trim())
        .map((i, idx) => ({
          medicineName: i.medicineName.trim(),
          dosage: (i.dosage || "As directed").trim(),
          frequency: (i.frequency || "As directed").trim(),
          duration: (i.duration || "As directed").trim(),
          instructions: i.instructions?.trim() || null,
          sortOrder: idx,
        }));

      if (!cleanItems.length && !diagnosis?.trim() && !advice?.trim()) {
        throw new ApiError(
          400,
          "Add at least one medicine or diagnosis/advice",
        );
      }

      const prescription = await this.prisma.$transaction(async (tx) => {
        if (consultation.prescription) {
          await tx.prescriptionItem.deleteMany({
            where: { prescriptionId: consultation.prescription.id },
          });
          return tx.prescription.update({
            where: { id: consultation.prescription.id },
            data: {
              diagnosis: diagnosis?.trim() || null,
              advice: advice?.trim() || null,
              followUp: followUp?.trim() || null,
              items: { create: cleanItems },
            },
            include: { items: { orderBy: { sortOrder: "asc" } } },
          });
        }

        return tx.prescription.create({
          data: {
            consultationId: consultation.id,
            diagnosis: diagnosis?.trim() || null,
            advice: advice?.trim() || null,
            followUp: followUp?.trim() || null,
            items: { create: cleanItems },
          },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        });
      });

      // Complete consultation when Rx is written
      if (consultation.status !== "COMPLETED") {
        await this.prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            status: "COMPLETED",
            endedAt: consultation.endedAt ?? new Date(),
            startedAt: consultation.startedAt ?? new Date(),
          },
        });
      }

      return {
        success: true,
        prescription,
        consultationId: consultation.id,
        consultNumber: consultation.consultNumber,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Prescription create error:", err);
      throw new ApiError(500, "Failed to save prescription");
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Prescription by id, consultation id or consult number",
  })
  async detail(@Param("id") id: string) {
    try {
      // 1) Direct prescription id
      const byId = await this.prisma.prescription.findUnique({
        where: { id },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          consultation: { include: { doctor: true } },
        },
      });
      if (byId) {
        return { prescription: byId };
      }

      // 2) Consultation id or consult number
      const consult = await this.prisma.consultation.findFirst({
        where: { OR: [{ id }, { consultNumber: id }] },
        include: {
          doctor: true,
          prescription: {
            include: { items: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      if (!consult?.prescription) {
        throw new ApiError(404, "Prescription not found");
      }

      return {
        prescription: {
          ...consult.prescription,
          consultation: {
            id: consult.id,
            consultNumber: consult.consultNumber,
            patientName: consult.patientName,
            patientPhone: consult.patientPhone,
            patientAge: consult.patientAge,
            patientGender: consult.patientGender,
            type: consult.type,
            fee: consult.fee,
            createdAt: consult.createdAt,
            doctor: consult.doctor,
          },
        },
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Prescription get error:", err);
      throw new ApiError(500, "Failed to load prescription");
    }
  }
}
