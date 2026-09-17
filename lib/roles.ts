import { z } from "zod";

export const roleSchema = z.enum(["admin", "responsable", "catechumene"]);
export type Role = z.infer<typeof roleSchema>;

/** Rôles que l'interface de gestion des utilisateurs peut attribuer. */
export const managedUserRoleSchema = z.enum(["responsable", "catechumene"]);
export type ManagedUserRole = z.infer<typeof managedUserRoleSchema>;

