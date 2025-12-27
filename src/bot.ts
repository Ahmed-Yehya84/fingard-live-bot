import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// --- 1. CONFIGURATION & ERROR CHECKING ---
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const bot = new Bot(process.env.BOT_TOKEN || "");

// Check if variables exist (Helps debug Railway crashes)
if (!process.env.BOT_TOKEN) console.error("❌ ERROR: BOT_TOKEN is missing!");

// --- 2. COMMANDS ---

bot.command("start", (ctx) => {
  ctx.reply(
    "💰 **FinGard AI: Smart Expense Tracker**\n\n" +
      "• Send: *'Coffee 3 and Lunch 12'*\n" +
      "• Send a **Photo** of a receipt.\n" +
      "• /total - View balances\n" +
      "• /stats - Visual chart\n" +
      "• /recent - Manage items\n" +
      "• /clear - Wipe all data",
    { parse_mode: "Markdown" }
  );
});

bot.command("total", async (ctx) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, currency")
    .eq("user_id", ctx.from?.id);
  if (error || !data || data.length === 0)
    return ctx.reply("💰 No expenses found.");

  const totals = data.reduce((acc: any, curr) => {
    const sym = curr.currency || "£";
    acc[sym] = (acc[sym] || 0) + curr.amount;
    return acc;
  }, {});

  const report = Object.entries(totals)
    .map(([sym, sum]) => `• **${sym}:** ${sym}${(sum as number).toFixed(2)}`)
    .join("\n");
  ctx.reply(`📊 **Balances:**\n${report}`, { parse_mode: "Markdown" });
});

bot.command("recent", async (ctx) => {
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", ctx.from?.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (!data || data.length === 0) return ctx.reply("📭 No recent items.");

  await ctx.reply("📝 **Recent Items:**");
  for (const ex of data) {
    const keyboard = new InlineKeyboard().text(`🗑️ Delete`, `del_${ex.id}`);
    await ctx.reply(`${ex.item}: ${ex.currency}${ex.amount}`, {
      reply_markup: keyboard,
    });
  }
});

bot.command("stats", async (ctx) => {
  const { data } = await supabase
    .from("expenses")
    .select("item, amount")
    .eq("user_id", ctx.from?.id);
  if (!data || data.length === 0) return ctx.reply("📊 No data for chart.");

  const grouped = data.reduce((acc: any, curr) => {
    const name =
      curr.item.charAt(0).toUpperCase() + curr.item.slice(1).toLowerCase();
    acc[name] = (acc[name] || 0) + curr.amount;
    return acc;
  }, {});

  const chartConfig = {
    type: "pie",
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}&bkg=white`;
  await ctx.replyWithPhoto(url, {
    caption: "📊 **Spending Breakdown**",
    parse_mode: "Markdown",
  });
});

bot.command("clear", (ctx) =>
  ctx.reply("⚠️ Clear all data? Type /confirm_clear to wipe everything.")
);

bot.command("confirm_clear", async (ctx) => {
  await supabase.from("expenses").delete().eq("user_id", ctx.from?.id);
  ctx.reply("🧹 **Vault cleared.**");
});

// --- 3. CALLBACK HANDLER (DELETION) ---
bot.on("callback_query:data", async (ctx) => {
  if (ctx.callbackQuery.data.startsWith("del_")) {
    const id = ctx.callbackQuery.data.split("_")[1];
    await supabase.from("expenses").delete().eq("id", id);
    await ctx.editMessageText("🗑️ *Deleted.*", { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery("Removed!");
  }
});

// --- 4. PHOTO HANDLER ---
bot.on("message:photo", async (ctx) => {
  const wait = await ctx.reply("📸 *Scanning...*", { parse_mode: "Markdown" });
  try {
    const photo = ctx.message.photo.pop();
    const file = await ctx.api.getFile(photo!.file_id);
    const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    const res = await axios.get(url, { responseType: "arraybuffer" });

    const prompt = `Return ONLY JSON: {"item": "Store", "amount": number, "currency": "string"}`;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(res.data).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ]);

    // Hardened JSON Parser
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid Vision JSON");
    const ai = JSON.parse(jsonMatch[0]);

    await supabase.from("expenses").insert([{ ...ai, user_id: ctx.from?.id }]);
    await bot.api.deleteMessage(ctx.chat.id, wait.message_id);
    ctx.reply(
      `✅ **Saved!**\n${ai.item}: ${ai.currency}${ai.amount.toFixed(2)}`
    );
  } catch (e) {
    console.error("Vision Error:", e);
    ctx.reply("❌ Vision Error. Check logs.");
  }
});

// --- 5. TEXT HANDLER ---
bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;
  const wait = await ctx.reply("🤖 *Thinking...*", { parse_mode: "Markdown" });
  try {
    const prompt = `Extract expenses. Return ONLY JSON array: [{"item": "string", "amount": number, "currency": "string"}] from: "${ctx.message.text}"`;
    const result = await model.generateContent(prompt);

    // Hardened JSON Parser
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid Text JSON");
    const expenses = JSON.parse(jsonMatch[0]);

    await supabase
      .from("expenses")
      .insert(expenses.map((e: any) => ({ ...e, user_id: ctx.from?.id })));
    await bot.api.deleteMessage(ctx.chat.id, wait.message_id);
    ctx.reply(
      `✅ **Saved!**\n${expenses
        .map((e: any) => `• ${e.item}: ${e.currency}${e.amount}`)
        .join("\n")}`
    );
  } catch (e) {
    console.error("Parsing Error:", e);
    await bot.api.deleteMessage(ctx.chat.id, wait.message_id);
    ctx.reply("❌ Parsing Error. Try 'Pizza 12'.");
  }
});

// --- 6. START ---
bot.api.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "total", description: "View totals" },
  { command: "stats", description: "View chart" },
  { command: "recent", description: "Manage history" },
  { command: "clear", description: "Wipe data" },
]);

console.log("🚀 FinGard Bot LIVE!");
bot.start().catch((err) => {
  console.error("CRITICAL BOT ERROR:", err);
});
