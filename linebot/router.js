const https = require("https");
const Router = require("@koa/router");
const router = new Router();
const yaml = require("js-yaml");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

let lock = false;

router.get("/", () => {
	ctx.body = "index";
	ctx.status = 200;
});

router.post("/webhook", async (ctx) => {
	if (ctx.request.body.events.length === 0) {
		// webhook verification
		ctx.status = 200;
		return;
	}

	const events = ctx.request.body.events;

	events.forEach((e) => {
		if (e.type === "memberJoined") {
			const members = e.joined.members;
			const replyToken = e.replyToken;
			members.forEach((m) => {
				console.log(m);
				const dataString = JSON.stringify({
					replyToken,
					messages: [
						{
							type: "text",
							text: `歡迎加入群組！`,
						},
					],
				});

				const headers = {
					"Content-Type": "application/json",
					Authorization: "Bearer " + process.env.TOKEN,
				};

				// Options to pass into the request, as defined in the http.request method in the Node.js documentation
				const webhookOptions = {
					hostname: "api.line.me",
					path: "/v2/bot/message/reply",
					method: "POST",
					headers: headers,
					body: dataString,
				};

				const request = https.request(webhookOptions, (res) => {
					res.on("data", (d) => {
						process.stdout.write(d);
					});
				});

				// Handle error
				// request.on() is a function that is called back if an error occurs
				// while sending a request to the API server.
				request.on("error", (err) => {
					console.error(err);
				});

				// Finally send the request and the data we defined
				request.write(dataString);
				request.end();
			});
		}
	});
});

module.exports = router;
