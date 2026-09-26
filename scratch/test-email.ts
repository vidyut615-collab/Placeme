import { sendZeptoMail } from '../src/utils/zeptomail';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  console.log('Sending email...');
  const res = await sendZeptoMail('test@example.com', 'Test from Script', '<p>Hello Vercel Test</p>');
  console.log('Result:', res);
}
run();
