import { populateFullEnterpriseDemo } from './full-demo-seed.js';

populateFullEnterpriseDemo()
  .then(() => {
    console.log('🎉 Enterprise Demo Seeding Finished Successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Enterprise Demo Seeding Failed:', err);
    process.exit(1);
  });
