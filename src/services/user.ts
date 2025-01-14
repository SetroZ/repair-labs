/* eslint-disable no-unused-vars */

import { clerkClient } from "@clerk/nextjs";
import { User as ClerkUser } from "@clerk/nextjs/server";

import { buildPaginationResponse, PaginationOptions } from "@/lib/pagination";
import { User, UserRole } from "@/types";

type ClerkOrderBy =
  | "created_at"
  | "updated_at"
  | "+created_at"
  | "+updated_at"
  | "-created_at"
  | "-updated_at";

async function getMany(options: PaginationOptions) {
  const { orderBy, perPage, page, query } = options;

  const searchRequest = {
    orderBy: orderBy as ClerkOrderBy,
    limit: perPage,
    offset: (page - 1) * perPage,
    query
  };

  // getCount requires a search request too so it returns the total query count.
  const users = await clerkClient.users.getUserList(searchRequest);
  const totalCount = await clerkClient.users.getCount(searchRequest);

  return buildPaginationResponse<User>(
    users.map((user) => toResponse(user)),
    options,
    totalCount
  );
}

async function getUser(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  return toResponse(user);
}

async function updateRole(userId: string, role: UserRole) {
  return await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      role: role
    }
  });
}

async function getRole(userId: string): Promise<UserRole> {
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata.role
    ? (user.publicMetadata.role as UserRole)
    : UserRole.CLIENT;

  return role;
}

function toResponse(user: ClerkUser): User {
  const { id, firstName, lastName, emailAddresses, publicMetadata } = user;
  const role = publicMetadata.role
    ? (publicMetadata.role as UserRole)
    : UserRole.CLIENT;
  const emailAddress = emailAddresses[0].emailAddress;

  return {
    id,
    firstName,
    lastName,
    role,
    emailAddress
  };
}

const userService = {
  getMany,
  getUser,
  updateRole,
  getRole
};

export default userService;
