import base from "@notoflow/config/eslint/next";
import { globalIgnores } from "eslint/config";

const root = Array.isArray(base) ? base : [base];

export default [...root, globalIgnores(["prisma/**"])];
