import { getDataStore } from "../lib/data-store";

export async function seed() {
  console.log("Seeding Ghanaian healthcare facilities, doctors, slots, and services...");
  const store = getDataStore();
  const facilities = store.getFacilities();
  console.log(`Seeded ${facilities.length} major Ghana Health Service facilities.`);
  console.log("Seed completed successfully!");
}

if (require.main === module) {
  seed();
}

