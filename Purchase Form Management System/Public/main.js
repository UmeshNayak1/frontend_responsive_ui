document.getElementById("checkoutForm").addEventListener("submit", completePurchase);

async function completePurchase(e) {
    e.preventDefault(); // prevent page reload
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const postcode = document.getElementById("postcode").value.trim();
    const country = document.getElementById("country").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const cardType = document.querySelector('input[name="cardType"]:checked');

    if (!name || !email || !phone || !address || !postcode || !country || !cardNumber || !cardType) {
        alert("Please fill all required fields!");
        return;
    }

    const last4 = cardNumber.slice(-4);

    const formData = {
        name,
        email,
        phone,
        address,
        postcode,
        country,
        cardType: cardType.value,
        last4
    };

    try {
        const response = await fetch("http://localhost:3000/submit", {  // use relative path (important for deployment)
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        document.getElementById("greetingMessage").innerText =
            `Thank you ${name}! Your purchase has been successfully completed.`;

        document.getElementById("successModal").classList.add("active");

        document.getElementById("checkoutForm").reset();

    } catch (error) {
        console.error(error);
        alert("Something went wrong. Please try again.");
    }
}


function closeModal() {
    document.getElementById("successModal").classList.remove("active");
}