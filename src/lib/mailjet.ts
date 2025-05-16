import Mailjet from "node-mailjet";

// Initialize Mailjet client
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY ?? "",
  apiSecret: process.env.MAILJET_API_SECRET ?? "",
});

export default mailjet;
