import type { Locale } from "@/lib/i18n";
import type { Mail } from "./transport";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#1f2a24">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
<div style="background:#b3282d;color:#fff;border-radius:14px 14px 0 0;padding:20px 24px;font-size:20px;font-weight:bold">🎄 ${esc(title)}</div>
<div style="background:#fff;border-radius:0 0 14px 14px;padding:24px;line-height:1.55;font-size:15px">${body}</div>
</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#1f6b45;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;font-weight:bold">${esc(label)}</a></p>`;
}

function wishBlock(wishlist: string, empty: string): string {
  const w = wishlist.trim();
  return `<div style="background:#f6f1e7;border-radius:10px;padding:14px 16px;white-space:pre-wrap">${w ? esc(w) : `<i>${esc(empty)}</i>`}</div>`;
}

export function ownerCreatedMail(p: {
  locale: Locale; to: string; ownerName: string; eventName: string; joinUrl: string; adminUrl: string;
}): Mail {
  const tr = p.locale === "tr";
  const subject = tr ? `"${p.eventName}" çekilişin hazır` : `Your "${p.eventName}" draw is ready`;
  const html = layout(p.eventName, tr
    ? `<p>Merhaba ${esc(p.ownerName)},</p>
<p>Çekilişin oluşturuldu. Aşağıdaki <b>katılım linkini</b> arkadaşlarınla paylaş:</p>
<p><a href="${esc(p.joinUrl)}">${esc(p.joinUrl)}</a></p>
<p>Herkes katıldıktan sonra çekilişi <b>yönetim panelinden</b> yapabilirsin. Bu linki kimseyle paylaşma:</p>
${button(p.adminUrl, "Yönetim paneline git")}`
    : `<p>Hi ${esc(p.ownerName)},</p>
<p>Your draw has been created. Share this <b>join link</b> with your friends:</p>
<p><a href="${esc(p.joinUrl)}">${esc(p.joinUrl)}</a></p>
<p>Once everyone has joined, run the draw from your <b>admin panel</b>. Keep this link private:</p>
${button(p.adminUrl, "Open admin panel")}`);
  const text = tr
    ? `Katılım linki: ${p.joinUrl}\nYönetim linki (gizli): ${p.adminUrl}`
    : `Join link: ${p.joinUrl}\nAdmin link (private): ${p.adminUrl}`;
  return { to: p.to, subject, html, text };
}

export function joinedMail(p: {
  locale: Locale; to: string; name: string; eventName: string; editUrl: string;
}): Mail {
  const tr = p.locale === "tr";
  const subject = tr ? `"${p.eventName}" çekilişine katıldın` : `You joined "${p.eventName}"`;
  const html = layout(p.eventName, tr
    ? `<p>Merhaba ${esc(p.name)},</p>
<p>Çekilişe katıldın! Çekiliş yapıldığında sana çıkan kişi bu adrese mail olarak gelecek.</p>
<p>Çekilişten önce dilek listeni bu linkten güncelleyebilirsin:</p>
${button(p.editUrl, "Dilek listemi düzenle")}`
    : `<p>Hi ${esc(p.name)},</p>
<p>You're in! When the draw happens, you'll get an email telling you who you're buying for.</p>
<p>You can update your wishlist before the draw here:</p>
${button(p.editUrl, "Edit my wishlist")}`);
  const text = tr ? `Dilek listeni düzenle: ${p.editUrl}` : `Edit your wishlist: ${p.editUrl}`;
  return { to: p.to, subject, html, text };
}

export function drawResultMail(p: {
  locale: Locale; to: string; giverName: string; receiverName: string; receiverWishlist: string; eventName: string;
  ideasUrl: string;
}): Mail {
  const tr = p.locale === "tr";
  const ideas = tr
    ? `<p style="margin-top:20px">Ne alacağını bilmiyor musun? Birkaç soruyu cevapla, sana özel hediye fikirleri gelsin:</p>${button(p.ideasUrl, "Ne alacağımı bilmiyorum 🤔")}`
    : `<p style="margin-top:20px">Not sure what to buy? Answer a few questions and get personalised gift ideas:</p>${button(p.ideasUrl, "I don't know what to buy 🤔")}`;
  const subject = tr ? `🎁 "${p.eventName}" çekilişinde sana çıkan kişi` : `🎁 Your "${p.eventName}" match`;
  const html = layout(p.eventName, tr
    ? `<p>Merhaba ${esc(p.giverName)},</p>
<p>Çekiliş yapıldı! Hediye alacağın kişi:</p>
<p style="font-size:26px;font-weight:bold;color:#b3282d;margin:14px 0">${esc(p.receiverName)}</p>
<p>Dilek listesi:</p>${wishBlock(p.receiverWishlist, "Dilek listesi boş — biraz yaratıcılık 🎅")}
${ideas}
<p style="margin-top:20px;color:#6b7a70;font-size:13px">Bu bir sır — kimseye söyleme! 🤫</p>`
    : `<p>Hi ${esc(p.giverName)},</p>
<p>The draw is done! You're buying a gift for:</p>
<p style="font-size:26px;font-weight:bold;color:#b3282d;margin:14px 0">${esc(p.receiverName)}</p>
<p>Their wishlist:</p>${wishBlock(p.receiverWishlist, "No wishlist — time to get creative 🎅")}
${ideas}
<p style="margin-top:20px;color:#6b7a70;font-size:13px">It's a secret — don't tell anyone! 🤫</p>`);
  const text = tr
    ? `Hediye alacağın kişi: ${p.receiverName}\nDilek listesi:\n${p.receiverWishlist || "-"}\n\nHediye fikirleri: ${p.ideasUrl}`
    : `You're buying for: ${p.receiverName}\nWishlist:\n${p.receiverWishlist || "-"}\n\nGift ideas: ${p.ideasUrl}`;
  return { to: p.to, subject, html, text };
}
