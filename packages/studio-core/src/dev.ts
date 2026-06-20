import * as path from 'node:path';
import { createStudioServer } from './server.js';

const root = process.argv[2] || path.resolve(process.cwd(), '../../dev');

createStudioServer({
  wsPort: 4001,
  projectRoot: path.resolve(root),
  frameworkPort: 3000,
});
