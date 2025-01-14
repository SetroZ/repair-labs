import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";
import { HttpStatusCode } from "axios";

import apiHandler from "@/lib/api-handler";
import prisma from "@/lib/prisma";
import { RepairRequest } from "@/types";

export default apiHandler({
  get: getRepairRequests
});

async function getRepairRequests(
  req: NextApiRequest,
  res: NextApiResponse<RepairRequest[]>
) {
  const { id } = req.query;

  const event = await prisma.event.findUnique({
    where: { id: id as string }
  });

  if (!event) {
    throw new ApiError(HttpStatusCode.NotFound, "Event not found");
  }

  const repairRequests = await prisma.repairRequest.findMany({
    where: { event: { id: id as string } }
  });

  // TODO: Generate GET presigned urls for images in S3.

  return res.status(200).json(repairRequests);
}
