const { PayOS } = require('@payos/node');

const payos = new PayOS({
  clientId: "7f9b6656-2896-4ec8-9482-f1f4a9a41e37",
  apiKey: "681bd07b-f652-43f8-9f98-513e9f3a2e3b",
  checksumKey: "f29d07aea07d2323539d00cfab05768d70788816db666db3b5e53bc8f3d041a1"
});

async function run() {
  const orderCode = Math.floor(Date.now() / 1000);
  console.log("Calling payos.paymentRequests.create for orderCode:", orderCode);
  
  try {
    const link = await payos.paymentRequests.create({
      orderCode,
      amount: 50000,
      description: "TEST PAYOS",
      returnUrl: "http://localhost:3000/dashboard?paid=1",
      cancelUrl: "http://localhost:3000/dashboard?paid=0"
    });
    
    console.log("SUCCESS RESPONSE:");
    console.log(JSON.stringify(link, null, 2));
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

run();
