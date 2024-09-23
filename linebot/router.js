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

  const { type, message, replyToken } = ctx.request.body.events[0];

  if (type === "message") {
    let messages = [];
    const { text } = message;

    const mentionText = ["嫂子", "gio", "giovanna", "盈希", "余盈希"];

    const selectedMentionText = mentionText.find((x) => text.includes(x));

    if (selectedMentionText) {
      // 阻止嫂子一直講話
      if (!lock) {
        lock = true;
        setTimeout(() => {
          lock = false;
        }, 180000);
      } else {
        // webhook verification
        ctx.status = 200;
        return;
      }

      if (text.match(`${selectedMentionText} 自我介紹`)) {
        messages = [
          {
            type: "text",
            text: `大家好，我是${selectedMentionText}，曾在上海工作 2+ 年，並有 5 年跨域管理經驗，涉及商業分析、產品設計、維持與優化顧客體驗以及用戶運營，並任職過工研院、壽險、教育科技，現職於出行科技產業。`,
          },
        ];
      } else if (text.match(`${selectedMentionText} 問 `)) {
        const question = text.replace(`${selectedMentionText} 問 `, "");
        const reply = await fetch("http://localhost:3003/query", {
          method: "POST",
          body: JSON.stringify({ query: question }),
          headers: {
            "content-type": "application/json",
          },
        }).then((res) => {
          if (!res.ok) {
            messages = [
              {
                type: "text",
                text: "我現在腦袋有點亂，讓我整理一下",
              },
            ];
            throw new Error(res.statusText);
          }
          return res.text();
        });

        messages = [
          {
            type: "text",
            text: "要懂的自主思考，不要只是聽別人說，好嗎？",
          },
          {
            type: "text",
            text: reply,
          },
        ];
      } else if (selectedMentionText) {
        const data = yaml.load(
          fs.readFileSync(`${__dirname}/replies.yml`, "utf8")
        ).Replies;
        const index = Math.floor(Math.random() * data.length);

        messages = [
          {
            type: "text",
            text: data[index],
          },
        ];
      }

      const dataString = JSON.stringify({
        replyToken,
        messages,
      });

      const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.LINEBOT_TOKEN,
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
    }
  }
});

module.exports = router;
