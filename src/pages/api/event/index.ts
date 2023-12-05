import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

import apiHandler from "@/lib/api-handler";
import { createEventSchema } from "@/schema/event";
import userService from "@/services/user";
import { Event, UserRole } from "@/types";

import prisma from "../../../lib/prisma";

export default apiHandler({
  get: getEvents,
  post: createEvent
});

async function getEvents(req: NextApiRequest, res: NextApiResponse<Event[]>) {
  const { sortKey, sortMethod, searchWord } = req.query;
  const sortObj: { [key: string]: "asc" | "desc" } = {};
  sortObj[sortKey as string] = sortMethod as "asc" | "desc";
  const { userId } = getAuth(req);
  const Role = await userService.getRole(userId as string);
  const isRepairer =
    Role == UserRole.REPAIRER
      ? {
          volunteers: {
            has: userId
          }
        }
      : {};
  // Use 'search' query parameter to filter events
  const events = await prisma.event.findMany({
    where: {
      ...isRepairer,
      OR: searchWord
        ? [
            {
              name: {
                contains: searchWord as string,
                mode: "insensitive"
              }
            },
            {
              createdBy: {
                contains: searchWord as string,
                mode: "insensitive"
              }
            },
            {
              location: {
                contains: searchWord as string,
                mode: "insensitive"
              }
            },
            {
              eventType: {
                contains: searchWord as string,
                mode: "insensitive"
              }
            }
            // Add more fields to search if necessary
          ]
        : [
            {
              name: {
                contains: ""
              }
            }
          ] // Empty OR array when searchWord is not present
    },
    orderBy: sortObj
  });

  res.status(200).json(events);
}

async function createEvent(req: NextApiRequest, res: NextApiResponse<Event>) {
  const { eventType, startDate, endDate, ...rest } = createEventSchema.parse(
    req.body
  );

  const { userId } = getAuth(req);

  const newEvent = await prisma.event.create({
    data: {
      ...rest,
      createdBy: userId!,
      event: {
        connect: {
          name: eventType
        }
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    }
  });

  res.status(200).json(newEvent);
}
