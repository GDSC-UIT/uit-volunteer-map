import { AppDataSource } from "../data-source.js";
import { seedRoles } from "./roles.seed.js";
import { seedTeams } from "./teams.seed.js";
import { seedPosts } from "./posts.seed.js";

const runSeed = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Loading seeds...");
    await seedRoles(AppDataSource);
    await seedTeams(AppDataSource);
    await seedPosts(AppDataSource);
    console.log("Completed seeding");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

runSeed();
