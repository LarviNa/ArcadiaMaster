const payload = {
  userId: "user-demo-123",
  totalAmount: 22.73,
  items: [{
    comicId: "1",
    quantity: 1
  }],
  cardNumber: "1234567812345678",
  expirationDate: "12/28",
  ccv: "123"
};

async function test() {
  console.log("POSTing to gateway...");
  const createRes = await fetch("http://localhost:8083/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const orderData = await createRes.json();
  console.log("POST result:", createRes.status, orderData);
  
  if (!createRes.ok) return;

  console.log("PATCHing status to PAID...");
  const patchRes = await fetch(`http://localhost:8083/orders/${orderData.id}/status?status=PAID`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" }
  });
  
  const patchData = await patchRes.json();
  console.log("PATCH result:", patchRes.status, patchData);
}

test().catch(console.error);
