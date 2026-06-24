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

fetch("http://localhost:8082/orders/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(res => res.text().then(text => console.log("Status:", res.status, "Body:", text)))
.catch(err => console.error(err));
