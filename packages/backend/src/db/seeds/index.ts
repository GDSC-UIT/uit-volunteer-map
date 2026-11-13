import { AppDataSource, DATABASE_PATH, ensureDatabaseDirectory } from "../data-source.js";
import { seedRoles } from "./roles.seed.js";

const runSeed = async () => {
  try {
    ensureDatabaseDirectory(DATABASE_PATH);
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Loading seeds...");
    await seedRoles(AppDataSource);
    console.log("Completed seeding");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

runSeed();
