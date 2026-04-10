const { Storage } = require("megajs");
const dotenv = require("dotenv");
dotenv.config();

const email = process.env.MEGA_EMAIL;
const password = process.env.MEGA_PASSWORD;

console.log("Testing Mega.nz connection for:", email);

const s = new Storage({
  email,
  password,
  userAgent: "CenterManagement/1.0",
}, (err) => {
  if (err) {
    console.error("Login failed:", err);
    process.exit(1);
  }
  console.log("Login successful!");
  console.log("Account info:", s.name);
  process.exit(0);
});

setTimeout(() => {
  console.error("Connection timed out after 10s");
  process.exit(1);
}, 10000);
