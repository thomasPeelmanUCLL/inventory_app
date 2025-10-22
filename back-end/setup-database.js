const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Database Setup Script');
console.log('=====================');
console.log('This script will help you set up the database for the inventory application.');
console.log('Make sure PostgreSQL is installed and running on your machine.');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\nERROR: .env file not found. Please create a .env file with your database configuration.');
  console.log('Example:');
  console.log('DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"');
  console.log('APP_PORT=3000');
  console.log('JWT_SECRET="your-secret-key-here"');
  rl.close();
  return;
}

// Read .env file to get database connection info
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"]+)"/);

if (!dbUrlMatch) {
  console.log('\nERROR: Could not parse DATABASE_URL from .env file.');
  console.log('Make sure your .env file contains a valid DATABASE_URL in the format:');
  console.log('DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"');
  rl.close();
  return;
}

const [, user, password, host, port, database] = dbUrlMatch;

console.log(`\nDatabase connection info from .env file:`);
console.log(`User: ${user}`);
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Database: ${database}`);

rl.question('\nDo you want to create the database tables using the SQL script? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\nCreating database tables...');
    
    // Build the psql command
    const sqlFilePath = path.join(__dirname, 'create_tables.sql');
    
    // For Windows, use the PGPASSWORD environment variable
    const command = `set "PGPASSWORD=${password}" && psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${sqlFilePath}"`;
    
    console.log(`\nExecuting command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`\nError executing SQL script: ${error.message}`);
        console.log('\nTry running the SQL script manually:');
        console.log(`1. Open a command prompt`);
        console.log(`2. Run: psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${sqlFilePath}"`);
        rl.close();
        return;
      }
      
      if (stderr) {
        console.log(`\nSQL script output (stderr):`);
        console.log(stderr);
      }
      
      if (stdout) {
        console.log(`\nSQL script output (stdout):`);
        console.log(stdout);
      }
      
      console.log('\nDatabase tables created successfully!');
      console.log('\nYou can now start the application with: npm start');
      rl.close();
    });
  } else {
    console.log('\nSkipping database table creation.');
    console.log('Remember to create the tables manually before running the application.');
    console.log('You can use the create_tables.sql script or run Prisma migrations.');
    rl.close();
  }
});