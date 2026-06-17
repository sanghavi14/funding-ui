import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    FOUNDRY_BASE_URL: process.env.FOUNDRY_BASE_URL,
    ONTOLOGY_RID: process.env.ONTOLOGY_RID,
    CLIENT_ID: process.env.CLIENT_ID,
    DEFAULT_LOAN_NUMBER: process.env.DEFAULT_LOAN_NUMBER,
  }
};

export default nextConfig;
