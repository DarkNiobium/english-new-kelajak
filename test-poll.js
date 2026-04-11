async function test() {
  const url = "https://text.pollinations.ai/openai";
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "mistral",
      messages: [{ role: "user", content: "Say hello world" }]
    })
  });
  console.log(await res.text());
}
test();
