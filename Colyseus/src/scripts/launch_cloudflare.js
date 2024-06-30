const { spawn } = require('child_process');
require("dotenv").config();
const fs = require('fs');

const logFile = './cloudflared.log';
const urlEnvVar = 'CLOUDFLARED_URL';

let logStream;

function startCloudflared() {
    // Open the log file in append mode
    logStream = fs.createWriteStream(logFile, { flags: 'w' });

    const cloudflaredProcess = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:63232'], {
        stdio: ['ignore', 'inherit', 'pipe'], // Ignore stdin, pipe stdout and stderr
        detached: true
    });

    // cloudflaredProcess.stdout.pipe(logStream);
    cloudflaredProcess.stderr.pipe(logStream);

    process.env.CLOUDFLARED_PID = cloudflaredProcess.pid.toString();
	console.log(process.env.CLOUDFLARED_PID);

    cloudflaredProcess.stderr.on('data', (data) => {
        const lines = data.toString();
		// console.log(lines);
		const urlMatch = lines.match(/https:\/\/[\w-]+\.trycloudflare\.com/);
		if (urlMatch) {
			const capturedUrl = urlMatch[0];
			process.env[urlEnvVar] = capturedUrl;
            updateEnvFile(urlEnvVar, capturedUrl);
            updateEnvFile(`PROXY_PID`, cloudflaredProcess.pid.toString());
			console.log(`Captured URL: ${capturedUrl}`);
			console.log(`CloudflaredProcessId: ${cloudflaredProcess.pid.toString()}`);
		}
    });

    cloudflaredProcess.on('exit', (code) => {
        logStream.write(`cloudflared process exited with code ${code}\n`);
        if (code !== 0) {
            logStream.write('Restarting cloudflared process...\n');
            setTimeout(startCloudflared, 5000); // Retry after 5 seconds
        }
    });

    cloudflaredProcess.on('error', (err) => {
        logStream.write(`cloudflared process error: ${err.message}\n`);
        // Handle process errors here
    });
}

function updateEnvFile(varName, envValue) {
    fs.readFile('./.env', 'utf8', (err, data) => {
        if (err) {
            console.log('Error reading .env file:', err);
        } else {
            const envFileContent = data;
            const regex = new RegExp(`${varName}=.*`);
            if (envFileContent.match(regex)) {
                // Update existing variable
                const updatedEnvFileContent = envFileContent.replace(regex, `${varName}=${envValue}`);
                fs.writeFile('./.env', updatedEnvFileContent, 'utf8', (err) => {
                    if (err) {
                        console.log('Error updating .env file:', err);
                    } else {
                        console.log(`${varName} updated in .env file`);
                    }
                });
            } else {
                // Append new variable
                fs.appendFile('./.env', `${varName}=${envValue}\n`, (err) => {
                    if (err) {
                        console.log('Error writing to .env file:', err);
                    } else {
                        console.log(`${varName} appended to .env file`);
                    }
                });
            }
        }
    });
}

function terminate() {
    if (process.env.CLOUDFLARED_PID) {
        const pid = parseInt(process.env.CLOUDFLARED_PID, 10);
        logStream.write(`Terminating cloudflared process with PID: ${pid}...\n`);
        process.kill(pid, 'SIGTERM');
    }
    if (logStream) {
        logStream.end(() => {
            console.log('Log stream closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

startCloudflared();
