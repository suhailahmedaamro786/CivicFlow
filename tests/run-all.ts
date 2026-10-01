import { runAllTests } from './agents.test';

runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });

